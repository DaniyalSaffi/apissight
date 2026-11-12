/**
 * Browser image preprocessing for the detector, with selectable variants.
 * Every variant produces a 224x224x3 uint8 RGB array; normalisation to
 * [-1, 1] happens in the worker, after this module returns.
 *
 * Variants:
 * - "pillow" (default, shipped): replicates Pillow 10.4.0 exactly —
 *   ImageOps.fit's float crop box (bleed 0, centering 0.5, 0.5), then the
 *   two-pass fixed-point Lanczos resample from libImaging/Resample.c
 *   (support 3 x max(scale, 1), kernel at (x - center + 0.5) / filterscale,
 *   weights normalised, out-of-range taps dropped, round + clip to uint8
 *   after EACH pass). Verified against Pillow locally; see ml/README.md.
 * - "lanczos3": plain Lanczos3 on an integer centre crop, float weights,
 *   rounded once at the end. Parity experiment only.
 * - "canvas": the previous behaviour — integer centre crop, OffscreenCanvas
 *   with imageSmoothingQuality "high". Parity experiment only.
 * - "passthrough": no resize at all; the input must already be 224x224.
 *   Tensor-level test only: separates conversion errors from resize errors.
 *
 * Alpha: Pillow's convert("RGB") drops alpha WITHOUT compositing, keeping
 * stored RGB values. The canvas decode below can premultiply alpha and lose
 * stored RGB under transparent pixels. No parity image has alpha, so parity
 * is unaffected; exact RGBA parity would need a different decode route
 * (e.g. a WebGL texture upload with premultiplication disabled).
 *
 * EXIF orientation is decided at decode time in the worker, not here: the
 * browser default ("from-image") is kept, so what the user sees is what the
 * model gets. The parity images carry no EXIF orientation.
 */

export type PreprocessVariant = "pillow" | "lanczos3" | "canvas" | "passthrough";

export const PREPROCESS_VARIANTS: readonly PreprocessVariant[] = [
  "pillow",
  "lanczos3",
  "canvas",
  "passthrough",
];

/** Unknown or missing values fall back to the shipped default, "pillow". */
export function parsePreprocessVariant(value: string | null | undefined): PreprocessVariant {
  if (value === "lanczos3" || value === "canvas" || value === "passthrough") return value;
  return "pillow";
}

export interface RgbImage {
  /** RGB bytes, row-major, 3 per pixel. */
  data: Uint8Array;
  width: number;
  height: number;
}

/** Decode a bitmap to exact RGB pixels: 1:1 draw, no scaling, alpha dropped. */
export function decodeBitmapToRgb(bitmap: ImageBitmap): RgbImage {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("2D canvas context unavailable.");
  context.drawImage(bitmap, 0, 0);
  const rgba = context.getImageData(0, 0, bitmap.width, bitmap.height).data;
  const rgb = new Uint8Array(bitmap.width * bitmap.height * 3);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) {
    rgb[j] = rgba[i];
    rgb[j + 1] = rgba[i + 1];
    rgb[j + 2] = rgba[i + 2];
  }
  return { data: rgb, width: bitmap.width, height: bitmap.height };
}

/* ------------------------------------------------------------------ */
/* Pillow-exact resampling (Pillow 10.4.0, ImageOps.fit + Resample.c)  */
/* ------------------------------------------------------------------ */

const PRECISION_BITS = 22;
const PRECISION_SCALE = 1 << PRECISION_BITS;
const PRECISION_ROUND = 1 << (PRECISION_BITS - 1);

function sinc(x: number): number {
  if (x === 0) return 1;
  const px = Math.PI * x;
  return Math.sin(px) / px;
}

function lanczos(x: number): number {
  if (x >= -3 && x < 3) return sinc(x) * sinc(x / 3);
  return 0;
}

/** Float crop box from ImageOps.fit: bleed 0, centering (0.5, 0.5), square output. */
export function fitBox(width: number, height: number): [number, number, number, number] {
  const side = Math.min(width, height);
  const left = (width - side) * 0.5;
  const top = (height - side) * 0.5;
  return [left, top, left + side, top + side];
}

interface FixedCoeffs {
  /** [xmin, tap count] per output pixel. */
  bounds: Int32Array;
  /** Fixed-point weights, ksize entries per output pixel. */
  weights: Int32Array;
  ksize: number;
}

/**
 * Port of precompute_coeffs + normalize_coeffs_8bpc from Resample.c.
 * C (int) casts truncate toward zero; Math.trunc matches. Out-of-range
 * taps are dropped (bounds clamped) and the surviving weights normalised.
 */
function precomputeCoeffs(
  inSize: number,
  in0: number,
  in1: number,
  outSize: number,
): FixedCoeffs {
  const scale = (in1 - in0) / outSize;
  const filterscale = Math.max(scale, 1);
  const support = 3 * filterscale;
  const ksize = Math.ceil(support) * 2 + 1;
  const bounds = new Int32Array(outSize * 2);
  const weights = new Int32Array(outSize * ksize);
  const ss = 1 / filterscale;
  for (let xx = 0; xx < outSize; xx++) {
    const center = in0 + (xx + 0.5) * scale;
    let xmin = Math.trunc(center - support + 0.5);
    if (xmin < 0) xmin = 0;
    let xmax = Math.trunc(center + support + 0.5);
    if (xmax > inSize) xmax = inSize;
    const count = xmax - xmin;
    let ww = 0;
    const row: number[] = new Array(count);
    for (let x = 0; x < count; x++) {
      const w = lanczos((x + xmin - center + 0.5) * ss);
      row[x] = w;
      ww += w;
    }
    for (let x = 0; x < count; x++) {
      const norm = ww !== 0 ? row[x] / ww : row[x];
      weights[xx * ksize + x] =
        norm < 0
          ? Math.trunc(-0.5 + norm * PRECISION_SCALE)
          : Math.trunc(0.5 + norm * PRECISION_SCALE);
    }
    bounds[xx * 2] = xmin;
    bounds[xx * 2 + 1] = count;
  }
  return { bounds, weights, ksize };
}

function clamp8(value: number): number {
  return value < 0 ? 0 : value > 255 ? 255 : value;
}

/** Horizontal pass of ImagingResampleHorizontal_8bpc: accumulate, round, clip to uint8. */
function resampleHorizontal(
  src: Uint8Array,
  srcWidth: number,
  srcHeight: number,
  coeffs: FixedCoeffs,
  outWidth: number,
): Uint8Array {
  const out = new Uint8Array(outWidth * srcHeight * 3);
  const { bounds, weights, ksize } = coeffs;
  for (let y = 0; y < srcHeight; y++) {
    const srcRow = y * srcWidth * 3;
    const outRow = y * outWidth * 3;
    for (let xx = 0; xx < outWidth; xx++) {
      const xmin = bounds[xx * 2];
      const count = bounds[xx * 2 + 1];
      const base = xx * ksize;
      for (let c = 0; c < 3; c++) {
        let acc = PRECISION_ROUND;
        for (let x = 0; x < count; x++) {
          acc += weights[base + x] * src[srcRow + (xmin + x) * 3 + c];
        }
        out[outRow + xx * 3 + c] = clamp8(Math.floor(acc / PRECISION_SCALE));
      }
    }
  }
  return out;
}

/** Vertical pass of ImagingResampleVertical_8bpc. */
function resampleVertical(
  src: Uint8Array,
  srcWidth: number,
  srcHeight: number,
  coeffs: FixedCoeffs,
  outHeight: number,
): Uint8Array {
  const out = new Uint8Array(srcWidth * outHeight * 3);
  const { bounds, weights, ksize } = coeffs;
  for (let yy = 0; yy < outHeight; yy++) {
    const ymin = bounds[yy * 2];
    const count = bounds[yy * 2 + 1];
    const base = yy * ksize;
    for (let x = 0; x < srcWidth; x++) {
      for (let c = 0; c < 3; c++) {
        let acc = PRECISION_ROUND;
        for (let y = 0; y < count; y++) {
          acc += weights[base + y] * src[((ymin + y) * srcWidth + x) * 3 + c];
        }
        out[(yy * srcWidth + x) * 3 + c] = clamp8(Math.floor(acc / PRECISION_SCALE));
      }
    }
  }
  return out;
}

/** Pillow-exact: float fit box, then the two-pass fixed-point resample. */
export function resamplePillow(image: RgbImage, outSize: number): Uint8Array {
  const [left, top, right, bottom] = fitBox(image.width, image.height);
  const horizontal = precomputeCoeffs(image.width, left, right, outSize);
  const intermediate = resampleHorizontal(
    image.data,
    image.width,
    image.height,
    horizontal,
    outSize,
  );
  const vertical = precomputeCoeffs(image.height, top, bottom, outSize);
  return resampleVertical(intermediate, outSize, image.height, vertical, outSize);
}

/* -------------------------------------------------------------- */
/* Plain Lanczos3 on an integer centre crop (parity variant 2)    */
/* -------------------------------------------------------------- */

interface FloatCoeffs {
  bounds: Int32Array;
  weights: Float64Array;
  ksize: number;
}

function precomputeFloatCoeffs(
  inSize: number,
  in0: number,
  in1: number,
  outSize: number,
): FloatCoeffs {
  const scale = (in1 - in0) / outSize;
  const filterscale = Math.max(scale, 1);
  const support = 3 * filterscale;
  const ksize = Math.ceil(support) * 2 + 1;
  const bounds = new Int32Array(outSize * 2);
  const weights = new Float64Array(outSize * ksize);
  const ss = 1 / filterscale;
  for (let xx = 0; xx < outSize; xx++) {
    const center = in0 + (xx + 0.5) * scale;
    let xmin = Math.trunc(center - support + 0.5);
    if (xmin < 0) xmin = 0;
    let xmax = Math.trunc(center + support + 0.5);
    if (xmax > inSize) xmax = inSize;
    const count = xmax - xmin;
    let ww = 0;
    for (let x = 0; x < count; x++) {
      const w = lanczos((x + xmin - center + 0.5) * ss);
      weights[xx * ksize + x] = w;
      ww += w;
    }
    if (ww !== 0) {
      for (let x = 0; x < count; x++) weights[xx * ksize + x] /= ww;
    }
    bounds[xx * 2] = xmin;
    bounds[xx * 2 + 1] = count;
  }
  return { bounds, weights, ksize };
}

/** Integer centre crop, float Lanczos3, rounded once at the end. */
export function resampleLanczos3(image: RgbImage, outSize: number): Uint8Array {
  const side = Math.min(image.width, image.height);
  const sx = Math.floor((image.width - side) / 2);
  const sy = Math.floor((image.height - side) / 2);
  const cropped = new Uint8Array(side * side * 3);
  for (let y = 0; y < side; y++) {
    const srcStart = ((sy + y) * image.width + sx) * 3;
    cropped.set(image.data.subarray(srcStart, srcStart + side * 3), y * side * 3);
  }
  const horizontal = precomputeFloatCoeffs(side, 0, side, outSize);
  const intermediate = new Float64Array(outSize * side * 3);
  for (let y = 0; y < side; y++) {
    for (let xx = 0; xx < outSize; xx++) {
      const xmin = horizontal.bounds[xx * 2];
      const count = horizontal.bounds[xx * 2 + 1];
      for (let c = 0; c < 3; c++) {
        let acc = 0;
        for (let x = 0; x < count; x++) {
          acc +=
            horizontal.weights[xx * horizontal.ksize + x] *
            cropped[(y * side + xmin + x) * 3 + c];
        }
        intermediate[(y * outSize + xx) * 3 + c] = acc;
      }
    }
  }
  const vertical = precomputeFloatCoeffs(side, 0, side, outSize);
  const out = new Uint8Array(outSize * outSize * 3);
  for (let yy = 0; yy < outSize; yy++) {
    const ymin = vertical.bounds[yy * 2];
    const count = vertical.bounds[yy * 2 + 1];
    for (let x = 0; x < outSize; x++) {
      for (let c = 0; c < 3; c++) {
        let acc = 0;
        for (let y = 0; y < count; y++) {
          acc +=
            vertical.weights[yy * vertical.ksize + y] *
            intermediate[((ymin + y) * outSize + x) * 3 + c];
        }
        out[(yy * outSize + x) * 3 + c] = clamp8(Math.round(acc));
      }
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Canvas variant (parity variant 3): previous behaviour              */
/* ------------------------------------------------------------------ */

export function resampleCanvas(bitmap: ImageBitmap, outSize: number): Uint8Array {
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = Math.floor((bitmap.width - side) / 2);
  const sy = Math.floor((bitmap.height - side) / 2);
  const canvas = new OffscreenCanvas(outSize, outSize);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2D canvas context unavailable.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, sx, sy, side, side, 0, 0, outSize, outSize);
  const rgba = context.getImageData(0, 0, outSize, outSize).data;
  const rgb = new Uint8Array(outSize * outSize * 3);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) {
    rgb[j] = rgba[i];
    rgb[j + 1] = rgba[i + 1];
    rgb[j + 2] = rgba[i + 2];
  }
  return rgb;
}

/* ------------------------------------------------------------------ */
/* Passthrough (tensor-level test): no resize                         */
/* ------------------------------------------------------------------ */

export function passthrough(image: RgbImage, outSize: number): Uint8Array {
  if (image.width !== outSize || image.height !== outSize) {
    throw new Error(
      `Passthrough needs a ${outSize}x${outSize} image, got ${image.width}x${image.height}.`,
    );
  }
  return image.data.slice();
}

/** Run the selected variant on a decoded bitmap. */
export function preprocessPixels(
  bitmap: ImageBitmap,
  variant: PreprocessVariant,
  outSize: number,
): Uint8Array {
  if (variant === "canvas") return resampleCanvas(bitmap, outSize);
  const rgb = decodeBitmapToRgb(bitmap);
  if (variant === "lanczos3") return resampleLanczos3(rgb, outSize);
  if (variant === "passthrough") return passthrough(rgb, outSize);
  return resamplePillow(rgb, outSize);
}

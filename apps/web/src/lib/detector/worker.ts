/**
 * Inference worker. Runs the two converted TensorFlow.js models off the main
 * thread and applies the two-stage gate exactly as in the master plan (7.1):
 * Stage 2 runs only when Stage 1 returns a label starting with "0".
 *
 * Preprocessing (plan 7.1): centre-crop to a square, resize to 224x224,
 * normalise to [-1, 1] as x = (pixel / 127.5) - 1. The Python reference uses
 * Lanczos resampling. This worker draws the centre-cropped square to a
 * 224x224 OffscreenCanvas with imageSmoothingQuality "high" (the browser's
 * best downscale); where OffscreenCanvas is unavailable it falls back to
 * bilinear resizing. The resize method is recorded in the parity docs
 * (ml/README.md, docs/PARITY_REPORT.md). The parity test (ml/) measures the
 * effect of any preprocessing difference; the demo must not ship until
 * parity passes.
 *
 * No predictions are ever invented: if the model files are missing or fail to
 * load, the worker reports "not-loaded" and classify() rejects.
 */
import type {
  InferenceResult,
  ModelManifest,
  WorkerRequest,
  WorkerResponse,
} from "@apissight/core";
import { assembleInferenceResult, isValidStage1Label, topLabelIndex } from "@apissight/core";

type TfModule = typeof import("@tensorflow/tfjs");
type LayersModel = import("@tensorflow/tfjs").LayersModel;

let tf: TfModule | null = null;
let stage1Model: LayersModel | null = null;
let stage2Model: LayersModel | null = null;
let stage1Labels: string[] = [];
let stage2Labels: string[] = [];
let modelVersion = "";

const ctx = self as unknown as {
  postMessage(message: WorkerResponse): void;
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
};

function post(message: WorkerResponse): void {
  ctx.postMessage(message);
}

async function fetchManifest(url: string): Promise<ModelManifest | null> {
  try {
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) return null;
    return (await response.json()) as ModelManifest;
  } catch {
    return null;
  }
}

async function init(message: Extract<WorkerRequest, { type: "init" }>): Promise<void> {
  post({ type: "status", status: "loading" });
  const [manifest1, manifest2] = await Promise.all([
    fetchManifest(message.stage1ManifestUrl),
    fetchManifest(message.stage2ManifestUrl),
  ]);
  if (!manifest1 || !manifest2) {
    post({
      type: "status",
      status: "not-loaded",
      reason:
        "Model files not found. Convert the supplied Keras models with ml/convert_to_tfjs.py and copy the output into public/models/ (see ml/README.md).",
    });
    return;
  }
  try {
    tf = await import("@tensorflow/tfjs");
    await tf.ready();
    stage1Model = await tf.loadLayersModel(message.stage1ModelUrl);
    stage2Model = await tf.loadLayersModel(message.stage2ModelUrl);
    stage1Labels = manifest1.labels;
    stage2Labels = manifest2.labels;
    modelVersion = manifest1.version;
    post({ type: "status", status: "ready", modelVersion });
  } catch (error) {
    stage1Model = null;
    stage2Model = null;
    post({
      type: "status",
      status: "not-loaded",
      reason: `Model files found but failed to load: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

/**
 * Prepare one image for the models: centre-crop to a square, high-quality
 * downscale to 224x224, normalise to [-1, 1] as x = (pixel / 127.5) - 1.
 * The canvas path is preferred; the tensor path is the fallback where
 * OffscreenCanvas is unavailable.
 */
function prepareInput(
  tfModule: TfModule,
  bitmap: ImageBitmap,
): ReturnType<TfModule["tensor"]> {
  if (typeof OffscreenCanvas !== "undefined") {
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = Math.floor((bitmap.width - side) / 2);
    const sy = Math.floor((bitmap.height - side) / 2);
    const canvas = new OffscreenCanvas(224, 224);
    const context = canvas.getContext("2d");
    if (context) {
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(bitmap, sx, sy, side, side, 0, 0, 224, 224);
      const imageData = context.getImageData(0, 0, 224, 224);
      return tfModule.tidy(() =>
        tfModule.browser.fromPixels(imageData).toFloat().div(127.5).sub(1).expandDims(0),
      );
    }
  }
  return tfModule.tidy(() => {
    const pixels = tfModule.browser.fromPixels(bitmap);
    const height = pixels.shape[0];
    const width = pixels.shape[1];
    const side = Math.min(height, width);
    const top = Math.floor((height - side) / 2);
    const left = Math.floor((width - side) / 2);
    const cropped = pixels.slice([top, left, 0], [side, side, 3]);
    const resized = tfModule.image.resizeBilinear(cropped, [224, 224]);
    return resized.toFloat().div(127.5).sub(1).expandDims(0);
  });
}

async function classify(id: string, image: Blob): Promise<void> {
  if (!tf || !stage1Model || !stage2Model) {
    post({ type: "error", id, message: "Model not loaded." });
    return;
  }
  const currentTf = tf;
  let bitmap: ImageBitmap | null = null;
  let input: ReturnType<TfModule["tensor"]> | null = null;
  try {
    bitmap = await createImageBitmap(image);
    input = prepareInput(currentTf, bitmap);
    const stage1Output = stage1Model.predict(input) as ReturnType<TfModule["tensor"]>;
    const stage1Values = (await stage1Output.data()) as Float32Array;
    stage1Output.dispose();
    const stage1Top = topLabelIndex(stage1Values);
    const stage1Valid = isValidStage1Label(stage1Labels[stage1Top] ?? "");

    // Stage 2 runs only when Stage 1 passes the gate. The model is never
    // invoked for invalid images.
    let stage2Values: Float32Array | null = null;
    if (stage1Valid) {
      const stage2Output = stage2Model.predict(input) as ReturnType<TfModule["tensor"]>;
      stage2Values = (await stage2Output.data()) as Float32Array;
      stage2Output.dispose();
    }
    const result: InferenceResult = assembleInferenceResult(
      stage1Values,
      stage1Labels,
      stage2Values,
      stage2Labels,
    );
    input.dispose();
    input = null;
    post({ type: "result", id, result });
  } catch (error) {
    if (input) input.dispose();
    post({
      type: "error",
      id,
      message: `Analysis failed: ${error instanceof Error ? error.message : String(error)}`,
    });
  } finally {
    if (bitmap) bitmap.close();
  }
}

/** Serialize handling so classifications never run concurrently. */
let chain: Promise<void> = Promise.resolve();

ctx.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;
  chain = chain.then(async () => {
    if (message.type === "init") {
      await init(message);
    } else if (message.type === "classify") {
      await classify(message.id, message.image);
    }
  });
};

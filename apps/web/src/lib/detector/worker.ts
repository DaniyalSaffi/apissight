/**
 * Inference worker. Runs the two converted TensorFlow.js models off the main
 * thread and applies the two-stage gate exactly as in the master plan (7.1):
 * Stage 2 runs only when Stage 1 returns a label starting with "0".
 *
 * Preprocessing (plan 7.1): the default variant ("pillow") replicates Pillow
 * 10.4.0 exactly — ImageOps.fit's float crop box, then the two-pass
 * fixed-point Lanczos resample from libImaging/Resample.c — followed by
 * normalisation to [-1, 1] as x = (pixel / 127.5) - 1. See preprocess.ts.
 * The other variants ("lanczos3", "canvas", "passthrough") exist only for
 * the parity experiments; the shipped default is "pillow".
 *
 * Decoding uses createImageBitmap with colour-space conversion and alpha
 * premultiplication disabled, and keeps the browser's default EXIF
 * orientation handling ("from-image"): what the user sees is what the model
 * gets. The parity images carry no EXIF orientation, so parity is
 * unaffected. This choice is recorded in the parity report.
 *
 * No predictions are ever invented: if the model files are missing or fail to
 * load, the worker reports "not-loaded" and classify() rejects.
 */
import type {
  InferenceResult,
  ModelManifest,
  PreprocessVariant,
  WorkerRequest,
  WorkerResponse,
} from "@apissight/core";
import { assembleInferenceResult, isValidStage1Label, topLabelIndex } from "@apissight/core";
import { preprocessPixels } from "./preprocess";

type TfModule = typeof import("@tensorflow/tfjs");
type LayersModel = import("@tensorflow/tfjs").LayersModel;

let tf: TfModule | null = null;
let stage1Model: LayersModel | null = null;
let stage2Model: LayersModel | null = null;
let stage1Labels: string[] = [];
let stage2Labels: string[] = [];
let modelVersion = "";
let activeVariant: PreprocessVariant = "pillow";

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
  activeVariant = message.preprocessVariant ?? "pillow";
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

/** Decode options shared by classify() and pixels(): no colour conversion, no alpha premultiplication, default EXIF orientation. */
function decodeOptions(): ImageBitmapOptions {
  return {
    colorSpaceConversion: "none",
    imageOrientation: "from-image",
    premultiplyAlpha: "none",
  };
}

/**
 * Prepare one image for the models with the active preprocessing variant,
 * then normalise to [-1, 1] as x = (pixel / 127.5) - 1.
 */
function prepareInput(
  tfModule: TfModule,
  bitmap: ImageBitmap,
): ReturnType<TfModule["tensor"]> {
  const pixels = preprocessPixels(bitmap, activeVariant, 224);
  return tfModule.tidy(() =>
    tfModule.tensor(pixels, [224, 224, 3]).toFloat().div(127.5).sub(1).expandDims(0),
  );
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
    bitmap = await createImageBitmap(image, decodeOptions());
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

/**
 * Parity hook: run the active variant's preprocessing and return the raw
 * 224x224 RGB pixels, without running any model. Used by the parity run
 * (pixel-level test) through the ?pixels=1 page hook. No models needed.
 */
async function pixels(id: string, image: Blob): Promise<void> {
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(image, decodeOptions());
    const rgb = preprocessPixels(bitmap, activeVariant, 224);
    post({ type: "pixels-result", id, pixels: rgb });
  } catch (error) {
    post({
      type: "error",
      id,
      message: `Preprocessing failed: ${error instanceof Error ? error.message : String(error)}`,
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
    } else if (message.type === "pixels") {
      await pixels(message.id, message.image);
    }
  });
};

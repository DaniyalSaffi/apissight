/**
 * Shared inference types (Phase 2). No model code runs in Phase 1.
 * The two-stage gate and preprocessing come from the working Colab inference
 * code (plan §7.1), NOT from the FYP report. See ml/COLAB_RUNBOOK.md.
 */

/** Raw label as stored in a labels file, e.g. "0 Honey Bee or Beehive". */
export type RawLabel = string;

/** Display label with the leading index stripped, e.g. "Honey Bee or Beehive". */
export function displayLabel(raw: RawLabel): string {
  return raw.replace(/^\d+\s*/, "");
}

/** Stage 1 gate: a photo is valid only when its Stage 1 label starts with "0". */
export function isValidStage1Label(raw: RawLabel): boolean {
  return raw.startsWith("0");
}

export interface StageProbabilities {
  /** Raw label as stored in the labels file, e.g. "0 Honey Bee or Beehive". */
  rawLabel: RawLabel;
  /** Display label with the leading index stripped. */
  label: string;
  probability: number;
}

export interface StageResult {
  /** Raw top label, e.g. "0 Honey Bee or Beehive". */
  rawLabel: RawLabel;
  /** Display top label with the leading index stripped. */
  label: string;
  confidence: number;
  probabilities: StageProbabilities[];
}

export interface InferenceResult {
  stage1: StageResult;
  /** Present only when Stage 1 passed the gate. Never run for invalid images. */
  stage2: StageResult | null;
  /** True when the Stage 1 top label starts with "0". */
  valid: boolean;
  /** True when Stage 2 was skipped because Stage 1 failed the gate. */
  gateSkipped: boolean;
}

/** Index of the largest value; ties keep the earliest index. */
export function topLabelIndex(values: ArrayLike<number>): number {
  let best = 0;
  for (let i = 1; i < values.length; i += 1) {
    if (values[i] > values[best]) best = i;
  }
  return best;
}

function toProbabilities(values: ArrayLike<number>, labels: string[]): StageProbabilities[] {
  return labels.map((raw, index) => ({
    rawLabel: raw,
    label: displayLabel(raw),
    probability: values[index] ?? 0,
  }));
}

/**
 * Assemble an inference result from raw stage outputs, enforcing the gate.
 * Stage 2 is included only when the Stage 1 top label starts with "0" AND
 * Stage 2 values were supplied. Callers must not run the Stage 2 model for
 * invalid images; this function drops Stage 2 data even if it is supplied
 * for a gated-out image, so the gate holds in both layers.
 */
export function assembleInferenceResult(
  stage1Values: ArrayLike<number>,
  stage1Labels: string[],
  stage2Values: ArrayLike<number> | null,
  stage2Labels: string[],
): InferenceResult {
  const stage1Index = topLabelIndex(stage1Values);
  const stage1Raw = stage1Labels[stage1Index];
  const valid = isValidStage1Label(stage1Raw);
  let stage2: StageResult | null = null;
  if (valid && stage2Values !== null) {
    const stage2Index = topLabelIndex(stage2Values);
    const stage2Raw = stage2Labels[stage2Index];
    stage2 = {
      rawLabel: stage2Raw,
      label: displayLabel(stage2Raw),
      confidence: stage2Values[stage2Index],
      probabilities: toProbabilities(stage2Values, stage2Labels),
    };
  }
  return {
    stage1: {
      rawLabel: stage1Raw,
      label: displayLabel(stage1Raw),
      confidence: stage1Values[stage1Index],
      probabilities: toProbabilities(stage1Values, stage1Labels),
    },
    stage2,
    valid,
    gateSkipped: !valid,
  };
}

export interface ModelManifest {
  version: string;
  inputSize: 224;
  inputRange: [-1, 1];
  labels: RawLabel[];
  validPrefix: "0";
  convertedFrom: string;
  parityReport: string | null;
}

/**
 * Inference provider interface. Phase 2 implements a TensorFlow.js provider
 * (browser, on-device) behind this interface. A Python API fallback keeps the
 * same interface if browser parity fails (plan §7.2). No provider is
 * implemented in Phase 1.
 */
export interface InferenceProvider {
  readonly name: string;
  load(): Promise<void>;
  /** Runs Stage 1, then Stage 2 only if Stage 1 passes the gate. */
  classify(image: Blob): Promise<InferenceResult>;
}

/** Detector settings, stored in the browser. Defaults match the dashboard reference. */
export interface DetectorSettings {
  /** Stage 2 labels containing this word (case-insensitive) count as healthy. */
  healthyKeyword: string;
  /** Confidence below this value shows a low-confidence warning. */
  lowConfidenceThreshold: number;
  /** Analyse new uploads automatically when the model is ready. */
  autoAnalyse: boolean;
}

export const DEFAULT_SETTINGS: DetectorSettings = {
  healthyKeyword: "healthy",
  lowConfidenceThreshold: 0.7,
  autoAnalyse: false,
};

/** Healthy vs diseased badge rule, from the dashboard reference code. */
export function isHealthyLabel(raw: RawLabel, healthyKeyword: string): boolean {
  return raw.toLowerCase().includes(healthyKeyword.toLowerCase());
}

export type QueueItemStatus =
  | "queued"
  | "processing"
  | "done"
  | "error"
  | "duplicate"
  | "skipped";

export interface QueueItem {
  id: string;
  fileName: string;
  fileSize: number;
  sha1: string;
  /** 256px thumbnail as a data URL, for cards and history. */
  thumbnail: string | null;
  status: QueueItemStatus;
  result: InferenceResult | null;
  error: string | null;
  analysedAt: string | null;
}

/** One analysed image, as stored in history and exports. */
export interface HistoryItem {
  file: string;
  analysedAt: string;
  thumbnail: string | null;
  stage1: string;
  stage1Confidence: number;
  valid: boolean;
  stage2: string | null;
  stage2Confidence: number | null;
  stage1Probabilities: StageProbabilities[];
  stage2Probabilities: StageProbabilities[] | null;
}

export interface HistoryRun {
  id: string;
  createdAt: string;
  modelVersion: string;
  items: HistoryItem[];
}

/** Preprocessing variant for the detector worker. Must match PreprocessVariant in apps/web/src/lib/detector/preprocess.ts. */
export type PreprocessVariant = "pillow" | "lanczos3" | "canvas" | "passthrough";

/** Messages between the detector UI (main thread) and the inference worker. */
export type WorkerRequest =
  | {
      type: "init";
      stage1ManifestUrl: string;
      stage1ModelUrl: string;
      stage2ManifestUrl: string;
      stage2ModelUrl: string;
      preprocessVariant?: PreprocessVariant;
    }
  | { type: "classify"; id: string; image: Blob }
  | { type: "pixels"; id: string; image: Blob };

export type WorkerResponse =
  | { type: "status"; status: "loading" | "ready" | "not-loaded"; reason?: string; modelVersion?: string }
  | { type: "result"; id: string; result: InferenceResult }
  | { type: "pixels-result"; id: string; pixels: Uint8Array }
  | { type: "error"; id: string | null; message: string };

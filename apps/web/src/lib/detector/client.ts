/**
 * Main-thread client for the inference worker. Implements the
 * InferenceProvider contract from @apissight/core: load() checks for the
 * converted models, classify() runs the two-stage gate in the worker.
 */
import type {
  InferenceProvider,
  InferenceResult,
  PreprocessVariant,
  WorkerResponse,
} from "@apissight/core";

export type DetectorStatus = "loading" | "ready" | "not-loaded";

export interface DetectorUrls {
  stage1ManifestUrl: string;
  stage1ModelUrl: string;
  stage2ManifestUrl: string;
  stage2ModelUrl: string;
  /** Preprocessing variant for the worker. Defaults to "pillow". */
  preprocessVariant?: PreprocessVariant;
}

type StatusListener = (
  status: DetectorStatus,
  reason?: string,
  modelVersion?: string,
) => void;

const CLASSIFY_TIMEOUT_MS = 120_000;

export class DetectorClient implements InferenceProvider {
  readonly name = "tfjs-worker";
  status: DetectorStatus = "loading";
  modelVersion = "";

  private worker: Worker;
  private urls: DetectorUrls;
  private pending = new Map<
    string,
    { resolve: (result: InferenceResult) => void; reject: (error: Error) => void; timer: number }
  >();
  private pendingPixels = new Map<
    string,
    { resolve: (pixels: Uint8Array) => void; reject: (error: Error) => void; timer: number }
  >();
  private listeners = new Set<StatusListener>();
  private loadWaiters: Array<() => void> = [];

  constructor(urls: DetectorUrls) {
    this.urls = urls;
    this.worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      this.handle(event.data);
    };
    this.worker.onerror = (event) => {
      this.setStatus("not-loaded", event.message || "The inference worker failed to start.");
    };
  }

  load(): Promise<void> {
    this.setStatus("loading");
    this.worker.postMessage({
      type: "init",
      stage1ManifestUrl: this.urls.stage1ManifestUrl,
      stage1ModelUrl: this.urls.stage1ModelUrl,
      stage2ManifestUrl: this.urls.stage2ManifestUrl,
      stage2ModelUrl: this.urls.stage2ModelUrl,
      preprocessVariant: this.urls.preprocessVariant ?? "pillow",
    });
    return new Promise((resolve) => {
      this.loadWaiters.push(resolve);
    });
  }

  classify(image: Blob): Promise<InferenceResult> {
    if (this.status !== "ready") {
      return Promise.reject(new Error("Model not loaded."));
    }
    const id = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        this.pending.delete(id);
        reject(new Error("Analysis timed out after 120 seconds."));
      }, CLASSIFY_TIMEOUT_MS);
      this.pending.set(id, { resolve, reject, timer });
      this.worker.postMessage({ type: "classify", id, image });
    });
  }

  /**
   * Parity hook: run the worker's preprocessing and return the raw 224x224
   * RGB pixels, without running any model. Used by the parity run through
   * the ?pixels=1 page hook. No models needed.
   */
  getPixels(image: Blob): Promise<Uint8Array> {
    const id = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        this.pendingPixels.delete(id);
        reject(new Error("Preprocessing timed out after 120 seconds."));
      }, CLASSIFY_TIMEOUT_MS);
      this.pendingPixels.set(id, { resolve, reject, timer });
      this.worker.postMessage({ type: "pixels", id, image });
    });
  }

  onStatus(listener: StatusListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  terminate(): void {
    this.worker.terminate();
  }

  private handle(message: WorkerResponse): void {
    if (message.type === "status") {
      this.modelVersion = message.modelVersion ?? "";
      this.setStatus(message.status, message.reason, message.modelVersion);
      if (message.status !== "loading") {
        const waiters = this.loadWaiters;
        this.loadWaiters = [];
        waiters.forEach((resolve) => resolve());
      }
    } else if (message.type === "result") {
      const entry = this.pending.get(message.id);
      if (entry) {
        window.clearTimeout(entry.timer);
        this.pending.delete(message.id);
        entry.resolve(message.result);
      }
    } else if (message.type === "pixels-result") {
      const entry = this.pendingPixels.get(message.id);
      if (entry) {
        window.clearTimeout(entry.timer);
        this.pendingPixels.delete(message.id);
        entry.resolve(message.pixels);
      }
    } else if (message.type === "error") {
      if (message.id) {
        const entry = this.pending.get(message.id);
        if (entry) {
          window.clearTimeout(entry.timer);
          this.pending.delete(message.id);
          entry.reject(new Error(message.message));
        }
        const pixelsEntry = this.pendingPixels.get(message.id);
        if (pixelsEntry) {
          window.clearTimeout(pixelsEntry.timer);
          this.pendingPixels.delete(message.id);
          pixelsEntry.reject(new Error(message.message));
        }
      } else {
        this.setStatus("not-loaded", message.message);
      }
    }
  }

  private setStatus(status: DetectorStatus, reason?: string, modelVersion?: string): void {
    this.status = status;
    this.listeners.forEach((listener) => listener(status, reason, modelVersion));
  }
}

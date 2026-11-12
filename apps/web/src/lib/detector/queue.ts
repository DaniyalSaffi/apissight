/**
 * Detector queue: DOM-free state machine for the upload queue. The page UI
 * (ui.ts) renders from this controller and calls its methods; unit tests
 * drive it directly with a stub classifier. No DOM, no storage, no network.
 *
 * Behaviour matches the dashboard reference: duplicates are kept but marked,
 * corrupt files fail per item without stopping the rest of the queue, and
 * pause/resume/stop/restart only affect queued work.
 */
import type { InferenceResult, QueueItem } from "@apissight/core";

export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Returns an error reason, or null when the file is acceptable. */
export function validateImageFile(file: { type: string; size: number }): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "only JPEG, PNG, and WebP images are accepted";
  }
  if (file.size > MAX_FILE_BYTES) {
    return "larger than 20 MB";
  }
  return null;
}

export type Classifier = (blob: Blob) => Promise<InferenceResult>;

export interface NewQueueFile {
  id: string;
  fileName: string;
  fileSize: number;
  sha1: string;
  thumbnail: string | null;
  blob: Blob;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class QueueController {
  readonly items: QueueItem[] = [];
  running = false;
  paused = false;
  /** Called after every state change so the UI can re-render. */
  onChange: () => void = () => {};

  private blobs = new Map<string, Blob>();
  private stopRequested = false;

  /** Add a file. A SHA-1 already in the queue marks the new item "duplicate". */
  add(file: NewQueueFile): QueueItem {
    const duplicate = this.items.some((item) => item.sha1 === file.sha1);
    const item: QueueItem = {
      id: file.id,
      fileName: file.fileName,
      fileSize: file.fileSize,
      sha1: file.sha1,
      thumbnail: file.thumbnail,
      status: duplicate ? "duplicate" : "queued",
      result: null,
      error: duplicate ? "Duplicate of an image already in the queue." : null,
      analysedAt: null,
    };
    this.items.push(item);
    this.blobs.set(item.id, file.blob);
    this.onChange();
    return item;
  }

  remove(id: string): boolean {
    const index = this.items.findIndex((item) => item.id === id);
    if (index < 0) return false;
    this.items.splice(index, 1);
    this.blobs.delete(id);
    this.onChange();
    return true;
  }

  clear(): void {
    this.items.length = 0;
    this.blobs.clear();
    this.onChange();
  }

  pause(): void {
    this.paused = true;
    this.onChange();
  }

  resume(): void {
    this.paused = false;
    this.onChange();
  }

  requestStop(): void {
    this.stopRequested = true;
    this.onChange();
  }

  /** Reset finished and failed items to queued so they can run again. */
  restart(): void {
    for (const item of this.items) {
      if (item.status === "done" || item.status === "error") {
        item.status = "queued";
        item.result = null;
        item.error = null;
        item.analysedAt = null;
      }
    }
    this.onChange();
  }

  /** Analyse one queued item. Returns false when the run did not start. */
  async analyseSingle(id: string, classify: Classifier): Promise<boolean> {
    if (this.running) return false;
    const item = this.items.find((entry) => entry.id === id);
    const blob = this.blobs.get(id);
    if (!item || !blob || item.status !== "queued") return false;
    this.running = true;
    this.onChange();
    item.status = "processing";
    item.error = null;
    this.onChange();
    try {
      const result = await classify(blob);
      item.result = result;
      item.status = "done";
      item.analysedAt = new Date().toISOString();
    } catch (error) {
      item.status = "error";
      item.error = error instanceof Error ? error.message : String(error);
    }
    this.running = false;
    this.onChange();
    return true;
  }

  /**
   * Analyse every queued item in order. Honours pause (waits between items)
   * and stop (leaves the rest queued). A failing item is marked "error" and
   * the run continues with the next item. Returns "stopped" when a stop was
   * requested, otherwise "finished". Returns null when a run is already active.
   */
  async run(classify: Classifier): Promise<"finished" | "stopped" | null> {
    if (this.running) return null;
    this.running = true;
    this.stopRequested = false;
    this.paused = false;
    this.onChange();
    const pending = this.items.filter((item) => item.status === "queued");
    for (const item of pending) {
      if (this.stopRequested) break;
      while (this.paused && !this.stopRequested) {
        await sleep(200);
      }
      if (this.stopRequested) break;
      const blob = this.blobs.get(item.id);
      if (!blob) {
        item.status = "error";
        item.error = "File no longer available.";
        this.onChange();
        continue;
      }
      item.status = "processing";
      item.error = null;
      this.onChange();
      try {
        const result = await classify(blob);
        item.result = result;
        item.status = "done";
        item.analysedAt = new Date().toISOString();
      } catch (error) {
        item.status = "error";
        item.error = error instanceof Error ? error.message : String(error);
      }
      this.onChange();
    }
    const outcome = this.stopRequested ? "stopped" : "finished";
    this.running = false;
    this.paused = false;
    this.stopRequested = false;
    this.onChange();
    return outcome;
  }
}

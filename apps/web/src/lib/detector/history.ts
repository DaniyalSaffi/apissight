/**
 * Detector run history, stored locally in IndexedDB. Runs never leave the
 * device. Each run is one saved batch of analysed images.
 */
import { openDB, type DBSchema } from "idb";
import type { HistoryRun } from "@apissight/core";

interface DetectorDB extends DBSchema {
  runs: { key: string; value: HistoryRun };
}

const dbPromise = openDB<DetectorDB>("apissight-detector", 1, {
  upgrade(db) {
    db.createObjectStore("runs", { keyPath: "id" });
  },
});

export async function saveRun(run: HistoryRun): Promise<void> {
  const db = await dbPromise;
  await db.put("runs", run);
}

export async function listRuns(): Promise<HistoryRun[]> {
  const db = await dbPromise;
  const runs = await db.getAll("runs");
  return runs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteRun(id: string): Promise<void> {
  const db = await dbPromise;
  await db.delete("runs", id);
}

export async function clearRuns(): Promise<void> {
  const db = await dbPromise;
  await db.clear("runs");
}

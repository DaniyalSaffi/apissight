/** Queue tests: pause/resume/stop/restart, duplicates, corrupt files. */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  QueueController,
  validateImageFile,
} from "../../apps/web/src/lib/detector/queue.ts";

const STAGE1 = ["0 Honey Bee or Beehive", "1 Not Honey Bee or Not Beehive"];
const STAGE2 = [
  "0 Healthy Honey Bee or Healthy Beehive",
  "1 Deformed Wing Virus (DWV)",
  "2 Varroa Mite Infestation",
  "3 Chalkbrood Disease",
];

function fakeResult() {
  return {
    stage1: {
      rawLabel: STAGE1[0],
      label: "Honey Bee or Beehive",
      confidence: 0.95,
      probabilities: STAGE1.map((raw, i) => ({
        rawLabel: raw,
        label: raw.replace(/^\d+\s*/, ""),
        probability: i === 0 ? 0.95 : 0.05,
      })),
    },
    stage2: {
      rawLabel: STAGE2[1],
      label: "Deformed Wing Virus (DWV)",
      confidence: 0.87,
      probabilities: STAGE2.map((raw, i) => ({
        rawLabel: raw,
        label: raw.replace(/^\d+\s*/, ""),
        probability: i === 1 ? 0.87 : 0.04,
      })),
    },
    valid: true,
    gateSkipped: false,
  };
}

function addFile(queue, id, sha1) {
  return queue.add({
    id,
    fileName: `${id}.png`,
    fileSize: 10,
    sha1,
    thumbnail: null,
    blob: new Blob([id]),
  });
}

function deferred() {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

test("validateImageFile rejects wrong types and oversize files", () => {
  assert.equal(validateImageFile({ type: "image/jpeg", size: 100 }), null);
  assert.equal(validateImageFile({ type: "image/png", size: 100 }), null);
  assert.equal(validateImageFile({ type: "image/webp", size: 100 }), null);
  assert.match(validateImageFile({ type: "image/gif", size: 100 }) ?? "", /JPEG, PNG/);
  assert.match(validateImageFile({ type: "text/plain", size: 100 }) ?? "", /JPEG, PNG/);
  assert.match(validateImageFile({ type: "image/jpeg", size: 21 * 1024 * 1024 }) ?? "", /20 MB/);
  assert.equal(validateImageFile({ type: "image/jpeg", size: 20 * 1024 * 1024 }), null);
});

test("duplicates: same SHA-1 marks the second item duplicate, first stays queued", () => {
  const queue = new QueueController();
  const first = addFile(queue, "a", "sha-same");
  const second = addFile(queue, "b", "sha-same");
  assert.equal(first.status, "queued");
  assert.equal(second.status, "duplicate");
  assert.match(second.error ?? "", /Duplicate/);
  assert.equal(queue.items.length, 2);
});

test("run analyses queued items in order and records results", async () => {
  const queue = new QueueController();
  addFile(queue, "a", "sha-a");
  addFile(queue, "b", "sha-b");
  const seen = [];
  const outcome = await queue.run(async (blob) => {
    seen.push(await blob.text());
    return fakeResult();
  });
  assert.equal(outcome, "finished");
  assert.deepEqual(seen, ["a", "b"]);
  assert.deepEqual(queue.items.map((i) => i.status), ["done", "done"]);
  assert.ok(queue.items.every((i) => i.result !== null && i.analysedAt !== null));
  assert.equal(queue.running, false);
});

test("corrupt file: a rejecting classifier marks error and the run continues", async () => {
  const queue = new QueueController();
  addFile(queue, "bad", "sha-bad");
  addFile(queue, "good", "sha-good");
  const outcome = await queue.run(async (blob) => {
    if ((await blob.text()) === "bad") throw new Error("Analysis failed: corrupt image data");
    return fakeResult();
  });
  assert.equal(outcome, "finished");
  assert.equal(queue.items[0].status, "error");
  assert.match(queue.items[0].error ?? "", /corrupt image/);
  assert.equal(queue.items[1].status, "done");
});

test("pause holds the next item until resume", async () => {
  const queue = new QueueController();
  addFile(queue, "a", "sha-a");
  addFile(queue, "b", "sha-b");
  const gate = deferred();
  let startedB = false;
  const runPromise = queue.run(async (blob) => {
    const name = await blob.text();
    if (name === "a") await gate.promise;
    if (name === "b") startedB = true;
    return fakeResult();
  });
  // Wait until item "a" is processing, then pause before it finishes.
  for (let i = 0; i < 50 && queue.items[0].status !== "processing"; i += 1) {
    await new Promise((r) => setTimeout(r, 10));
  }
  assert.equal(queue.items[0].status, "processing");
  queue.pause();
  gate.resolve();
  await new Promise((r) => setTimeout(r, 500));
  assert.equal(startedB, false);
  assert.equal(queue.items[1].status, "queued");
  queue.resume();
  const outcome = await runPromise;
  assert.equal(outcome, "finished");
  assert.equal(startedB, true);
  assert.deepEqual(queue.items.map((i) => i.status), ["done", "done"]);
});

test("stop leaves the remaining items queued", async () => {
  const queue = new QueueController();
  addFile(queue, "a", "sha-a");
  addFile(queue, "b", "sha-b");
  addFile(queue, "c", "sha-c");
  const gate = deferred();
  const runPromise = queue.run(async (blob) => {
    if ((await blob.text()) === "a") await gate.promise;
    return fakeResult();
  });
  for (let i = 0; i < 50 && queue.items[0].status !== "processing"; i += 1) {
    await new Promise((r) => setTimeout(r, 10));
  }
  queue.requestStop();
  gate.resolve();
  const outcome = await runPromise;
  assert.equal(outcome, "stopped");
  assert.deepEqual(queue.items.map((i) => i.status), ["done", "queued", "queued"]);
});

test("restart resets done and error items to queued and they run again", async () => {
  const queue = new QueueController();
  addFile(queue, "a", "sha-a");
  addFile(queue, "b", "sha-b");
  let calls = 0;
  await queue.run(async () => {
    calls += 1;
    if (calls === 1) throw new Error("boom");
    return fakeResult();
  });
  assert.deepEqual(queue.items.map((i) => i.status), ["error", "done"]);
  queue.restart();
  assert.deepEqual(queue.items.map((i) => i.status), ["queued", "queued"]);
  assert.ok(queue.items.every((i) => i.result === null && i.error === null));
  await queue.run(async () => fakeResult());
  assert.deepEqual(queue.items.map((i) => i.status), ["done", "done"]);
});

test("analyseSingle runs only that item and refuses while a run is active", async () => {
  const queue = new QueueController();
  addFile(queue, "a", "sha-a");
  addFile(queue, "b", "sha-b");
  const started = await queue.analyseSingle("a", async () => fakeResult());
  assert.equal(started, true);
  assert.deepEqual(queue.items.map((i) => i.status), ["done", "queued"]);
  const gate = deferred();
  const runPromise = queue.run(async () => {
    await gate.promise;
    return fakeResult();
  });
  for (let i = 0; i < 50 && !queue.running; i += 1) {
    await new Promise((r) => setTimeout(r, 10));
  }
  assert.equal(await queue.analyseSingle("b", async () => fakeResult()), false);
  gate.resolve();
  await runPromise;
});

test("remove and clear drop items and their blobs", async () => {
  const queue = new QueueController();
  addFile(queue, "a", "sha-a");
  addFile(queue, "b", "sha-b");
  assert.equal(queue.remove("a"), true);
  assert.equal(queue.remove("a"), false);
  assert.equal(queue.items.length, 1);
  queue.clear();
  assert.equal(queue.items.length, 0);
  const outcome = await queue.run(async () => fakeResult());
  assert.equal(outcome, "finished");
});

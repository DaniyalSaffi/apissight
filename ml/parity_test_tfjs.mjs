#!/usr/bin/env node
/**
 * Run the converted TensorFlow.js models over a labelled parity set (TF.js side).
 *
 * Mirrors ml/parity_test.py: same manifest CSV, same JSON output shape, same gate.
 * Preprocessing mirrors plan section 7.1 as closely as Node allows:
 *   - decode image, centre-crop to a square, resize to 224x224, scale to [-1, 1]
 * Resize methods differ by backend (recorded in ml/README.md): the Keras
 * side uses PIL Lanczos; the browser worker uses OffscreenCanvas drawing
 * with imageSmoothingQuality "high"; this script uses progressive bilinear
 * halving, which approximates the browser smoothing. Those small differences
 * are part of what parity measures. Acceptance (plan section 7.4): top-1
 * agreement >= 99% and per-class probability difference <= 0.02. If parity
 * fails, fall back to the Python API. Do not change the models.
 *
 * Requires: @tensorflow/tfjs-node
 *   npm install --no-save @tensorflow/tfjs-node
 *
 * Usage:
 *   node ml/parity_test_tfjs.mjs \
 *     --stage1 ml/converted/stage1/model.json --labels1 ml/originals/labels.txt \
 *     --stage2 ml/converted/stage2/model.json --labels2 "ml/originals/labels (1).txt.txt" \
 *     --images ml/parity-data/images --manifest ml/parity-data/manifest.csv \
 *     --out ml/parity-results/tfjs_results.json
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import * as tf from "@tensorflow/tfjs-node";

function arg(name) {
  const i = process.argv.indexOf(name);
  if (i === -1 || i + 1 >= process.argv.length) {
    console.error(`Missing argument: ${name}`);
    process.exit(2);
  }
  return process.argv[i + 1];
}

function loadLabels(path) {
  return readFileSync(path, "utf8").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  const header = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row = {};
    header.forEach((h, i) => { row[h] = (cells[i] ?? "").trim(); });
    return row;
  });
}

/**
 * High-quality downscale for a square tensor: halve repeatedly with bilinear
 * resize until close to the target, then one final resize. Progressive
 * downsampling approximates area averaging and is much closer to Lanczos
 * and to the browser's canvas smoothing than a single bilinear step.
 * Called inside tf.tidy, so intermediate tensors are disposed automatically.
 */
function resizeHighQuality(square, target) {
  let current = square;
  let size = square.shape[0];
  while (size > target * 2) {
    size = Math.max(target, Math.floor(size / 2));
    current = tf.image.resizeBilinear(current, [size, size]);
  }
  return tf.image.resizeBilinear(current, [target, target]);
}

async function main() {
  const stage1Path = resolve(arg("--stage1"));
  const labels1 = loadLabels(arg("--labels1"));
  const stage2Path = resolve(arg("--stage2"));
  const labels2 = loadLabels(arg("--labels2"));
  const imagesDir = arg("--images");
  const manifest = parseCsv(readFileSync(arg("--manifest"), "utf8"));
  const outPath = arg("--out");

  if (manifest.length < 30) {
    console.error(`WARNING: only ${manifest.length} parity images. Plan section 7.4 needs at least 30.`);
  }

  console.log(`Stage 1 labels: ${labels1.join(" | ")}`);
  console.log(`Stage 2 labels: ${labels2.join(" | ")}`);
  const model1 = await tf.loadLayersModel(`file://${stage1Path}`);
  const model2 = await tf.loadLayersModel(`file://${stage2Path}`);
  console.log("Models loaded.");

  const results = [];
  for (const row of manifest) {
    const name = row.file;
    const path = join(imagesDir, name);
    if (!existsSync(path)) {
      console.error(`Missing image: ${path}`);
      process.exit(2);
    }
    const buffer = readFileSync(path);
    const input = tf.tidy(() => {
      const decoded = tf.node.decodeImage(buffer, 3);
      const [h, w] = decoded.shape;
      const side = Math.min(h, w);
      const top = Math.floor((h - side) / 2);
      const left = Math.floor((w - side) / 2);
      const cropped = decoded.slice([top, left, 0], [side, side, 3]);
      const resized = resizeHighQuality(cropped, 224);
      return resized.toFloat().div(127.5).sub(1).expandDims(0);
    });
    const p1Tensor = model1.predict(input);
    const p1 = Array.from(await p1Tensor.data());
    p1Tensor.dispose();
    let i1 = 0;
    p1.forEach((v, i) => { if (v > p1[i1]) i1 = i; });
    const s1 = labels1[i1];
    const entry = {
      file: name,
      stage1_expected: row.stage1_expected || "",
      stage2_expected: row.stage2_expected || "",
      stage1_label: s1,
      stage1_confidence: p1[i1],
      stage1_probabilities: p1,
      valid: s1.startsWith("0"),
      stage2_label: null,
      stage2_confidence: null,
      stage2_probabilities: [],
    };
    if (entry.valid) {
      const p2Tensor = model2.predict(input);
      const p2 = Array.from(await p2Tensor.data());
      p2Tensor.dispose();
      let i2 = 0;
      p2.forEach((v, i) => { if (v > p2[i2]) i2 = i; });
      entry.stage2_label = labels2[i2];
      entry.stage2_confidence = p2[i2];
      entry.stage2_probabilities = p2;
    }
    input.dispose();
    results.push(entry);
    console.log(`${name}: ${s1} -> ${entry.stage2_label || "skipped"}`);
  }

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify({ backend: "tfjs", results }, null, 2));
  console.log(`Wrote ${results.length} results to ${outPath}`);
}

main().catch((err) => { console.error(err); process.exit(1); });

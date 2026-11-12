/** Export tests: CSV/JSON/XLSX/PDF contents, model version, and notice. */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildCsvText,
  buildJsonText,
  buildPdfBytes,
  buildXlsxBytes,
  rowsFromItems,
} from "../../apps/web/src/lib/detector/exports.ts";

const ITEMS = [
  {
    file: 'bee, "quoted".jpg',
    analysedAt: "2026-11-12T07:00:00.000Z",
    thumbnail: null,
    stage1: "Honey Bee or Beehive",
    stage1Confidence: 0.95,
    valid: true,
    stage2: "Deformed Wing Virus (DWV)",
    stage2Confidence: 0.87,
    stage1Probabilities: [
      { rawLabel: "0 Honey Bee or Beehive", label: "Honey Bee or Beehive", probability: 0.95 },
      { rawLabel: "1 Not Honey Bee or Not Beehive", label: "Not Honey Bee or Not Beehive", probability: 0.05 },
    ],
    stage2Probabilities: [
      { rawLabel: "0 Healthy Honey Bee or Healthy Beehive", label: "Healthy Honey Bee or Healthy Beehive", probability: 0.04 },
      { rawLabel: "1 Deformed Wing Virus (DWV)", label: "Deformed Wing Virus (DWV)", probability: 0.87 },
      { rawLabel: "2 Varroa Mite Infestation", label: "Varroa Mite Infestation", probability: 0.05 },
      { rawLabel: "3 Chalkbrood Disease", label: "Chalkbrood Disease", probability: 0.04 },
    ],
  },
  {
    file: "flower.jpg",
    analysedAt: "2026-11-12T07:01:00.000Z",
    thumbnail: null,
    stage1: "Not Honey Bee or Not Beehive",
    stage1Confidence: 0.99,
    valid: false,
    stage2: null,
    stage2Confidence: null,
    stage1Probabilities: [
      { rawLabel: "0 Honey Bee or Beehive", label: "Honey Bee or Beehive", probability: 0.01 },
      { rawLabel: "1 Not Honey Bee or Not Beehive", label: "Not Honey Bee or Not Beehive", probability: 0.99 },
    ],
    stage2Probabilities: null,
  },
];

test("rowsFromItems maps history items to export columns", () => {
  const rows = rowsFromItems(ITEMS);
  assert.equal(rows[0]["Stage 1 confidence"], "0.950");
  assert.equal(rows[0]["Valid honeybee image"], "Yes");
  assert.equal(rows[0]["Stage 2 label"], "Deformed Wing Virus (DWV)");
  assert.equal(rows[1]["Valid honeybee image"], "No");
  assert.equal(rows[1]["Stage 2 label"], "Skipped (invalid image)");
  assert.equal(rows[1]["Stage 2 confidence"], "");
});

test("CSV carries the model version, notice, header, and escaped values", () => {
  const text = buildCsvText(ITEMS, "1.0.0-test");
  const lines = text.split("\n");
  assert.match(lines[0], /model 1\.0\.0-test/);
  assert.match(lines[1], /Decision support only/);
  assert.equal(lines[2], "File,Analysed,Stage 1 label,Stage 1 confidence,Valid honeybee image,Stage 2 label,Stage 2 confidence");
  assert.match(lines[3], /^"bee, ""quoted""\.jpg",/);
  assert.match(lines[3], /Deformed Wing Virus \(DWV\)/);
  assert.match(lines[4], /Skipped \(invalid image\)/);
});

test("JSON round-trips tool, version, notice, and items", () => {
  const parsed = JSON.parse(buildJsonText(ITEMS, "1.0.0-test"));
  assert.equal(parsed.tool, "ApisSight detector");
  assert.equal(parsed.modelVersion, "1.0.0-test");
  assert.match(parsed.notice, /Decision support only/);
  assert.equal(parsed.items.length, 2);
  assert.equal(parsed.items[0].file, 'bee, "quoted".jpg');
  assert.equal(parsed.items[1].valid, false);
});

test("XLSX has Results and About sheets with the right contents", async () => {
  const bytes = await buildXlsxBytes(ITEMS, "1.0.0-test");
  const loaded = await import("exceljs");
  const ExcelJS = loaded.default ?? loaded;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes);
  assert.deepEqual(workbook.worksheets.map((sheet) => sheet.name), ["Results", "About"]);
  const results = workbook.getWorksheet("Results");
  assert.deepEqual(
    results.getRow(1).values.slice(1),
    ["File", "Analysed", "Stage 1 label", "Stage 1 confidence", "Valid honeybee image", "Stage 2 label", "Stage 2 confidence"],
  );
  assert.equal(results.getRow(2).getCell(1).value, 'bee, "quoted".jpg');
  assert.equal(results.getRow(2).getCell(6).value, "Deformed Wing Virus (DWV)");
  assert.equal(results.getRow(3).getCell(5).value, "No");
  const about = workbook.getWorksheet("About");
  assert.equal(about.getRow(2).getCell(1).value, "Model version");
  assert.equal(about.getRow(2).getCell(2).value, "1.0.0-test");
});

test("PDF starts with the PDF header and names the model, file, and notice", async () => {
  const bytes = await buildPdfBytes(ITEMS, "1.0.0-test");
  const text = Buffer.from(bytes).toString("latin1");
  assert.ok(text.startsWith("%PDF-"));
  assert.match(text, /ApisSight detector results/);
  assert.match(text, /1\.0\.0-test/);
  assert.match(text, /Decision support only/);
  assert.match(text, /flower\.jpg/);
});

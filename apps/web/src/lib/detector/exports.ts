/**
 * Exports for detector results. Every export carries the model version and
 * the export timestamp, and states that results are decision support only.
 * Spreadsheet and PDF libraries load on demand, only when used.
 *
 * The build* functions return file contents without touching the DOM, so
 * tests can check export contents exactly. The export* functions download
 * those contents in the browser.
 */
import type { HistoryItem } from "@apissight/core";

export interface ExportRow {
  File: string;
  Analysed: string;
  "Stage 1 label": string;
  "Stage 1 confidence": string;
  "Valid honeybee image": string;
  "Stage 2 label": string;
  "Stage 2 confidence": string;
}

export function rowsFromItems(items: HistoryItem[]): ExportRow[] {
  return items.map((item) => ({
    File: item.file,
    Analysed: item.analysedAt,
    "Stage 1 label": item.stage1,
    "Stage 1 confidence": item.stage1Confidence.toFixed(3),
    "Valid honeybee image": item.valid ? "Yes" : "No",
    "Stage 2 label": item.stage2 ?? "Skipped (invalid image)",
    "Stage 2 confidence":
      item.stage2Confidence === null ? "" : item.stage2Confidence.toFixed(3),
  }));
}

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function stamp(modelVersion: string): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function buildCsvText(items: HistoryItem[], modelVersion: string): string {
  const rows = rowsFromItems(items);
  const header = Object.keys(rows[0] ?? { File: "" });
  const lines = [
    `# ApisSight detector results — model ${modelVersion} — exported ${new Date().toISOString()}`,
    "# Decision support only. Confirm with a qualified inspector or lab.",
    header.map(csvCell).join(","),
    ...rows.map((row) => header.map((key) => csvCell(String(row[key as keyof ExportRow]))).join(",")),
  ];
  return lines.join("\n");
}

export function exportCsv(items: HistoryItem[], modelVersion: string): void {
  downloadBlob(
    `apissight-results-${stamp(modelVersion)}.csv`,
    new Blob([buildCsvText(items, modelVersion)], { type: "text/csv;charset=utf-8" }),
  );
}

export function buildJsonText(items: HistoryItem[], modelVersion: string): string {
  const payload = {
    tool: "ApisSight detector",
    modelVersion,
    exportedAt: new Date().toISOString(),
    notice: "Decision support only. Confirm with a qualified inspector or lab.",
    items,
  };
  return JSON.stringify(payload, null, 2);
}

export function exportJson(items: HistoryItem[], modelVersion: string): void {
  downloadBlob(
    `apissight-results-${stamp(modelVersion)}.json`,
    new Blob([buildJsonText(items, modelVersion)], { type: "application/json" }),
  );
}

export async function buildXlsxBytes(items: HistoryItem[], modelVersion: string): Promise<Uint8Array> {
  const loaded = await import("exceljs");
  const ExcelJS = (loaded as { default?: typeof loaded }).default ?? loaded;
  const workbook = new ExcelJS.Workbook();
  const rows = rowsFromItems(items);
  const results = workbook.addWorksheet("Results");
  results.columns = Object.keys(rows[0] ?? { File: "" }).map((header) => ({
    header,
    key: header,
    width: 24,
  }));
  results.addRows(rows);
  const meta = workbook.addWorksheet("About");
  meta.addRows([
    ["Tool", "ApisSight detector"],
    ["Model version", modelVersion],
    ["Exported", new Date().toISOString()],
    ["Notice", "Decision support only. Confirm with a qualified inspector or lab."],
  ]);
  const buffer = (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
  return new Uint8Array(buffer);
}

export async function exportXlsx(items: HistoryItem[], modelVersion: string): Promise<void> {
  const bytes = await buildXlsxBytes(items, modelVersion);
  downloadBlob(
    `apissight-results-${stamp(modelVersion)}.xlsx`,
    new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
}

export async function buildPdfBytes(items: HistoryItem[], modelVersion: string): Promise<ArrayBuffer> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 16;
  doc.setFontSize(16);
  doc.text("ApisSight detector results", margin, y);
  y += 7;
  doc.setFontSize(9);
  doc.text(`Model: ${modelVersion}  •  Exported: ${new Date().toISOString()}`, margin, y);
  y += 5;
  doc.text("Decision support only. Confirm with a qualified inspector or lab.", margin, y);
  y += 8;
  for (const item of items) {
    if (y > 250) {
      doc.addPage();
      y = 16;
    }
    if (item.thumbnail) {
      try {
        doc.addImage(item.thumbnail, "JPEG", margin, y, 28, 28);
      } catch {
        /* Thumbnail is decorative in the export; continue without it. */
      }
    }
    const textX = margin + 32;
    doc.setFontSize(11);
    doc.text(doc.splitTextToSize(item.file, pageWidth - textX - margin), textX, y + 5);
    doc.setFontSize(9);
    const stage1Line = `Stage 1: ${item.stage1} (${(item.stage1Confidence * 100).toFixed(1)}%) — ${item.valid ? "valid" : "invalid image"}`;
    doc.text(doc.splitTextToSize(stage1Line, pageWidth - textX - margin), textX, y + 12);
    const stage2Line =
      item.stage2 === null
        ? "Stage 2: skipped (invalid image)"
        : `Stage 2: ${item.stage2} (${((item.stage2Confidence ?? 0) * 100).toFixed(1)}%)`;
    doc.text(doc.splitTextToSize(stage2Line, pageWidth - textX - margin), textX, y + 18);
    doc.text(`Analysed: ${item.analysedAt}`, textX, y + 24);
    y += 34;
  }
  return doc.output("arraybuffer");
}

export async function exportPdf(items: HistoryItem[], modelVersion: string): Promise<void> {
  const bytes = await buildPdfBytes(items, modelVersion);
  downloadBlob(
    `apissight-results-${stamp(modelVersion)}.pdf`,
    new Blob([bytes], { type: "application/pdf" }),
  );
}

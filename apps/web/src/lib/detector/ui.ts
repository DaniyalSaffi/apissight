/**
 * Detector UI: upload queue, analysis controls, result cards, charts,
 * history, and exports. All analysis runs on the device through the
 * inference worker. Until the converted models exist, every analysis
 * control stays disabled and the page shows a "coming soon" state.
 * No fake or mock predictions are ever shown.
 */
import {
  DEFAULT_SETTINGS,
  isHealthyLabel,
  type DetectorSettings,
  type HistoryItem,
  type HistoryRun,
  type QueueItem,
} from "@apissight/core";
import { DetectorClient, type DetectorStatus, type DetectorUrls } from "./client";
import { QueueController, validateImageFile } from "./queue";
import { clearRuns, deleteRun, listRuns, saveRun } from "./history";
import { clearCharts, renderCharts } from "./charts";
import { exportCsv, exportJson, exportPdf, exportXlsx } from "./exports";

const SETTINGS_KEY = "apissight-detector-settings";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function loadSettings(): DetectorSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DetectorSettings>;
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    /* Fall through to defaults. */
  }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings: DetectorSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* Storage unavailable; settings apply for this session only. */
  }
}

async function sha1Hex(file: File): Promise<string> {
  try {
    if (crypto.subtle) {
      const buffer = await file.arrayBuffer();
      const digest = await crypto.subtle.digest("SHA-1", buffer);
      return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    }
  } catch {
    /* Fall through to the session-only fallback below. */
  }
  return `fallback-${file.name}-${file.size}-${file.lastModified}`;
}

async function makeThumbnail(file: File): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 256 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return canvas.toDataURL("image/jpeg", 0.8);
  } catch {
    return null;
  }
}

function queueItemToHistory(item: QueueItem): HistoryItem | null {
  if (!item.result || !item.analysedAt) return null;
  return {
    file: item.fileName,
    analysedAt: item.analysedAt,
    thumbnail: item.thumbnail,
    stage1: item.result.stage1.label,
    stage1Confidence: item.result.stage1.confidence,
    valid: item.result.valid,
    stage2: item.result.stage2?.label ?? null,
    stage2Confidence: item.result.stage2?.confidence ?? null,
    stage1Probabilities: item.result.stage1.probabilities,
    stage2Probabilities: item.result.stage2?.probabilities ?? null,
  };
}

export function initDetector(urls: DetectorUrls): void {
  const client = new DetectorClient(urls);
  const settings = loadSettings();
  const queue = new QueueController();
  let viewingRun: HistoryRun | null = null;

  const $ = <T extends HTMLElement>(id: string): T | null =>
    document.getElementById(id) as T | null;

  const statusEl = $("detector-status");
  const retryButton = $<HTMLButtonElement>("detector-retry");
  const offlineNote = $("offline-note");
  const dropzone = $("dropzone");
  const fileInput = $<HTMLInputElement>("file-input");
  const queueList = $("queue-list");
  const queueEmpty = $("queue-empty");
  const resultsGrid = $("results-grid");
  const resultsEmpty = $("results-empty");
  const resultsNote = $("results-note");
  const chartsEmpty = $("charts-empty");
  const historyList = $("history-list");
  const historyEmpty = $("history-empty");
  const toasts = $("toasts");

  function toast(message: string): void {
    if (!toasts) return;
    const element = document.createElement("div");
    element.className = "toast";
    element.setAttribute("role", "status");
    element.textContent = message;
    toasts.appendChild(element);
    window.setTimeout(() => element.remove(), 5000);
  }

  function displayedItems(): HistoryItem[] {
    if (viewingRun) return viewingRun.items;
    return queue.items
      .map(queueItemToHistory)
      .filter((item): item is HistoryItem => item !== null);
  }

  function syncControls(): void {
    const hasQueued = queue.items.some((item) => item.status === "queued");
    const hasFinished = queue.items.some((item) => item.status === "done" || item.status === "error");
    const ready = client.status === "ready";
    const setDisabled = (id: string, disabled: boolean) => {
      const button = $(id) as HTMLButtonElement | null;
      if (button) button.disabled = disabled;
    };
    setDisabled("btn-analyse", queue.running || !ready || !hasQueued);
    setDisabled("btn-pause", !queue.running || queue.paused);
    setDisabled("btn-resume", !queue.running || !queue.paused);
    setDisabled("btn-stop", !queue.running);
    setDisabled("btn-restart", queue.running || !ready || !hasFinished);
    setDisabled("btn-clear-queue", queue.running || queue.items.length === 0);
    const hasItems = displayedItems().length > 0;
    setDisabled("btn-export-csv", !hasItems);
    setDisabled("btn-export-json", !hasItems);
    setDisabled("btn-export-xlsx", !hasItems);
    setDisabled("btn-export-pdf", !hasItems);
    setDisabled("btn-save-run", viewingRun !== null || queue.items.every((item) => item.status !== "done"));
    if (retryButton) retryButton.hidden = client.status !== "not-loaded";
  }

  function renderQueue(): void {
    if (!queueList) return;
    if (queueEmpty) queueEmpty.hidden = queue.items.length > 0;
    queueList.innerHTML = queue.items
      .map(
        (item) => `
        <li class="queue-item" data-id="${escapeHtml(item.id)}">
          ${item.thumbnail ? `<img src="${item.thumbnail}" alt="" class="queue-thumb" />` : ""}
          <span class="queue-name">${escapeHtml(item.fileName)}</span>
          <span class="muted small">${formatBytes(item.fileSize)}</span>
          <span class="chip chip-${item.status}">${escapeHtml(item.status)}</span>
          ${item.error ? `<span class="queue-error small">${escapeHtml(item.error)}</span>` : ""}
          <button type="button" class="btn-small" data-analyse-single="${escapeHtml(item.id)}" ${queue.running || item.status !== "queued" ? "disabled" : ""}>Analyse this image</button>
          <button type="button" class="btn-small" data-remove="${escapeHtml(item.id)}" ${queue.running ? "disabled" : ""}>Remove</button>
        </li>`,
      )
      .join("");
    queueList.querySelectorAll<HTMLButtonElement>("[data-analyse-single]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.getAttribute("data-analyse-single");
        if (!id || queue.running) return;
        void analyseSingle(id);
      });
    });
    queueList.querySelectorAll<HTMLButtonElement>("[data-remove]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.getAttribute("data-remove");
        if (!id || queue.running) return;
        queue.remove(id);
        renderResults();
        void refreshCharts();
        syncControls();
      });
    });
  }

  function probabilityBars(
    probabilities: Array<{ label: string; probability: number }>,
    topLabel: string,
  ): string {
    return `<ul class="prob-list">${probabilities
      .map(
        (entry) => `
        <li class="${entry.label === topLabel ? "prob-top" : ""}">
          <span>${escapeHtml(entry.label)}</span>
          <span class="conf-bar"><span style="width:${Math.round(entry.probability * 100)}%"></span></span>
          <span>${percent(entry.probability)}</span>
        </li>`,
      )
      .join("")}</ul>`;
  }

  function renderResults(): void {
    if (!resultsGrid) return;
    const items = displayedItems();
    if (resultsEmpty) resultsEmpty.hidden = items.length > 0;
    const backButton = $("btn-back-results");
    if (backButton) backButton.hidden = viewingRun === null;
    if (resultsNote) {
      resultsNote.hidden = viewingRun === null;
      if (viewingRun) {
        resultsNote.textContent = `Viewing a saved run from ${viewingRun.createdAt} (model ${viewingRun.modelVersion}). Use "Back to current results" to return.`;
      }
    }
    resultsGrid.innerHTML = items
      .map((item, index) => {
        const healthy =
          item.stage2 !== null && isHealthyLabel(item.stage2, settings.healthyKeyword);
        const lowConf =
          item.stage1Confidence < settings.lowConfidenceThreshold ||
          (item.stage2Confidence !== null && item.stage2Confidence < settings.lowConfidenceThreshold);
        return `
        <article class="card result-card">
          ${item.thumbnail ? `<img src="${item.thumbnail}" alt="" class="result-thumb" />` : ""}
          <h3>${escapeHtml(item.file)}</h3>
          <p class="small muted">${escapeHtml(item.analysedAt)}</p>
          <p><span class="chip chip-stage1">Stage 1: ${escapeHtml(item.stage1)}</span>
          <span class="conf-bar"><span style="width:${Math.round(item.stage1Confidence * 100)}%"></span></span>
          ${percent(item.stage1Confidence)}</p>
          ${
            item.valid
              ? `<p><span class="chip ${healthy ? "chip-healthy" : "chip-diseased"}">${healthy ? "Healthy" : "Diseased"}</span></p>
                 <p><span class="chip chip-stage2">Stage 2: ${escapeHtml(item.stage2 ?? "")}</span>
                 <span class="conf-bar"><span style="width:${Math.round((item.stage2Confidence ?? 0) * 100)}%"></span></span>
                 ${percent(item.stage2Confidence ?? 0)}</p>`
              : `<p><span class="chip chip-invalid">Invalid image — Stage 2 skipped</span></p>`
          }
          ${lowConf ? `<p class="notice notice-warn small">Low confidence. Treat this result with extra caution and confirm with an inspector or lab.</p>` : ""}
          <details>
            <summary>All probabilities</summary>
            <h4>Stage 1</h4>
            ${probabilityBars(item.stage1Probabilities, item.stage1)}
            ${item.stage2Probabilities && item.stage2 ? `<h4>Stage 2</h4>${probabilityBars(item.stage2Probabilities, item.stage2)}` : ""}
          </details>
          <p><button type="button" class="btn-small" data-download-json="${index}">Download this result (JSON)</button></p>
        </article>`;
      })
      .join("");
    resultsGrid.querySelectorAll<HTMLButtonElement>("[data-download-json]").forEach((button) => {
      button.addEventListener("click", () => {
        const item = items[Number(button.getAttribute("data-download-json"))];
        if (!item) return;
        const blob = new Blob([JSON.stringify(item, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `apissight-result-${item.file.replace(/[^a-zA-Z0-9._-]+/g, "_")}.json`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
      });
    });
  }

  async function refreshCharts(): Promise<void> {
    const items = displayedItems();
    if (chartsEmpty) chartsEmpty.hidden = items.length > 0;
    if (items.length === 0) {
      clearCharts();
      return;
    }
    try {
      await renderCharts(items, settings.healthyKeyword);
    } catch (error) {
      console.error("Charts failed to render:", error);
    }
  }

  async function refreshHistory(): Promise<void> {
    if (!historyList) return;
    let runs: HistoryRun[] = [];
    try {
      runs = await listRuns();
    } catch (error) {
      console.error("History failed to load:", error);
    }
    if (historyEmpty) historyEmpty.hidden = runs.length > 0;
    historyList.innerHTML = runs
      .map(
        (run) => `
        <li class="history-item">
          <span>${escapeHtml(run.createdAt)}</span>
          <span>${run.items.length} image(s)</span>
          <span class="muted small">model ${escapeHtml(run.modelVersion)}</span>
          <button type="button" class="btn-small" data-view-run="${escapeHtml(run.id)}">View</button>
          <button type="button" class="btn-small" data-delete-run="${escapeHtml(run.id)}">Delete</button>
        </li>`,
      )
      .join("");
    historyList.querySelectorAll<HTMLButtonElement>("[data-view-run]").forEach((button) => {
      button.addEventListener("click", async () => {
        const run = runs.find((entry) => entry.id === button.getAttribute("data-view-run"));
        if (!run) return;
        viewingRun = run;
        renderResults();
        await refreshCharts();
        syncControls();
        document.getElementById("results-heading")?.scrollIntoView({ behavior: "smooth" });
      });
    });
    historyList.querySelectorAll<HTMLButtonElement>("[data-delete-run]").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.getAttribute("data-delete-run");
        if (!id || !window.confirm("Delete this saved run? This cannot be undone.")) return;
        await deleteRun(id);
        if (viewingRun?.id === id) viewingRun = null;
        await refreshHistory();
        renderResults();
        await refreshCharts();
        syncControls();
      });
    });
  }

  async function analyseSingle(id: string): Promise<void> {
    if (queue.running) return;
    if (client.status !== "ready") {
      toast("The live demo is coming soon. Analysis is unavailable until the models are verified and installed.");
      return;
    }
    viewingRun = null;
    await queue.analyseSingle(id, (blob) => client.classify(blob));
    renderResults();
    await refreshCharts();
    syncControls();
  }

  async function runQueue(): Promise<void> {
    if (queue.running) return;
    if (client.status !== "ready") {
      toast("The live demo is coming soon. Analysis is unavailable until the models are verified and installed.");
      return;
    }
    if (!queue.items.some((item) => item.status === "queued")) {
      toast("Nothing to analyse. Add images to the queue first.");
      return;
    }
    viewingRun = null;
    const outcome = await queue.run((blob) => client.classify(blob));
    syncControls();
    await refreshCharts();
    if (outcome) toast(outcome === "stopped" ? "Analysis stopped." : "Analysis finished.");
  }

  async function addFiles(fileList: FileList | File[]): Promise<void> {
    const incoming = [...fileList];
    let added = 0;
    for (const file of incoming) {
      const problem = validateImageFile(file);
      if (problem) {
        toast(`Skipped ${file.name}: ${problem}.`);
        continue;
      }
      const sha1 = await sha1Hex(file);
      queue.add({
        id: crypto.randomUUID(),
        fileName: file.name,
        fileSize: file.size,
        sha1,
        thumbnail: await makeThumbnail(file),
        blob: file,
      });
      added += 1;
    }
    if (added > 0) {
      toast(`${added} image(s) added to the queue.`);
    }
    renderQueue();
    syncControls();
    if (settings.autoAnalyse && client.status === "ready") {
      void runQueue();
    }
  }

  function setStatusBanner(status: DetectorStatus, reason?: string, modelVersion?: string): void {
    if (!statusEl) return;
    if (status === "loading") {
      statusEl.className = "notice";
      statusEl.innerHTML = "<strong>Checking for models…</strong> Looking for the converted model files.";
    } else if (status === "ready") {
      statusEl.className = "notice notice-ok";
      statusEl.innerHTML = `<strong>Model ready.</strong> Version ${escapeHtml(modelVersion ?? "unknown")}. Images are analysed on this device and are not uploaded.`;
    } else {
      statusEl.className = "notice";
      statusEl.innerHTML = "<strong>Live demo coming soon: the models are being verified.</strong> You can still add images to the queue; analysis starts once the models are installed. No predictions are shown until then.";
      if (reason) console.warn("Detector models not loaded:", reason);
    }
    syncControls();
  }

  // Wire controls.
  const onClick = (id: string, handler: () => void) => {
    const element = $(id);
    if (element) element.addEventListener("click", handler);
  };
  onClick("btn-analyse", () => void runQueue());
  onClick("btn-pause", () => {
    queue.pause();
    syncControls();
  });
  onClick("btn-resume", () => {
    queue.resume();
    syncControls();
  });
  onClick("btn-stop", () => {
    queue.requestStop();
    syncControls();
  });
  onClick("btn-restart", () => {
    queue.restart();
    renderQueue();
    renderResults();
    void runQueue();
  });
  onClick("btn-clear-queue", () => {
    if (queue.running) return;
    queue.clear();
    viewingRun = null;
    renderQueue();
    renderResults();
    void refreshCharts();
    syncControls();
  });
  onClick("detector-retry", () => {
    void client.load();
  });
  onClick("btn-back-results", () => {
    viewingRun = null;
    renderResults();
    void refreshCharts();
    syncControls();
  });
  onClick("btn-save-run", async () => {
    const items = displayedItems();
    if (items.length === 0) return;
    const run: HistoryRun = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      modelVersion: client.modelVersion || "unknown",
      items,
    };
    try {
      await saveRun(run);
      toast("Run saved to this device's history.");
      await refreshHistory();
    } catch (error) {
      toast(`Could not save the run: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  onClick("btn-clear-history", async () => {
    if (!window.confirm("Delete all saved runs from this device? This cannot be undone.")) return;
    await clearRuns();
    viewingRun = null;
    await refreshHistory();
    renderResults();
    void refreshCharts();
    syncControls();
  });
  onClick("btn-export-csv", () => exportCsv(displayedItems(), client.modelVersion || "unknown"));
  onClick("btn-export-json", () => exportJson(displayedItems(), client.modelVersion || "unknown"));
  onClick("btn-export-xlsx", () => {
    void exportXlsx(displayedItems(), client.modelVersion || "unknown").catch((error: unknown) =>
      toast(`Spreadsheet export failed: ${error instanceof Error ? error.message : String(error)}`),
    );
  });
  onClick("btn-export-pdf", () => {
    void exportPdf(displayedItems(), client.modelVersion || "unknown").catch((error: unknown) =>
      toast(`PDF export failed: ${error instanceof Error ? error.message : String(error)}`),
    );
  });

  // Upload: file picker + drag and drop.
  if (fileInput) {
    fileInput.addEventListener("change", () => {
      if (fileInput.files) void addFiles(fileInput.files);
      fileInput.value = "";
    });
  }
  if (dropzone) {
    dropzone.addEventListener("click", () => fileInput?.click());
    dropzone.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        fileInput?.click();
      }
    });
    for (const eventName of ["dragenter", "dragover"]) {
      dropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropzone.classList.add("dropzone-active");
      });
    }
    for (const eventName of ["dragleave", "drop"]) {
      dropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropzone.classList.remove("dropzone-active");
      });
    }
    dropzone.addEventListener("drop", (event) => {
      if (event.dataTransfer?.files) void addFiles(event.dataTransfer.files);
    });
  }
  document.addEventListener("paste", (event) => {
    const files = event.clipboardData?.files;
    if (files && files.length > 0) void addFiles(files);
  });

  // Settings.
  const healthyInput = $<HTMLInputElement>("setting-healthy");
  const lowConfInput = $<HTMLInputElement>("setting-low-conf");
  const autoInput = $<HTMLInputElement>("setting-auto");
  if (healthyInput) {
    healthyInput.value = settings.healthyKeyword;
    healthyInput.addEventListener("change", () => {
      settings.healthyKeyword = healthyInput.value.trim() || DEFAULT_SETTINGS.healthyKeyword;
      saveSettings(settings);
      renderResults();
      void refreshCharts();
    });
  }
  if (lowConfInput) {
    lowConfInput.value = String(settings.lowConfidenceThreshold);
    lowConfInput.addEventListener("change", () => {
      const value = Number(lowConfInput.value);
      settings.lowConfidenceThreshold =
        Number.isFinite(value) && value >= 0 && value <= 1 ? value : DEFAULT_SETTINGS.lowConfidenceThreshold;
      lowConfInput.value = String(settings.lowConfidenceThreshold);
      saveSettings(settings);
      renderResults();
    });
  }
  if (autoInput) {
    autoInput.checked = settings.autoAnalyse;
    autoInput.addEventListener("change", () => {
      settings.autoAnalyse = autoInput.checked;
      saveSettings(settings);
    });
  }

  // Offline notice.
  const updateOnline = () => {
    if (offlineNote) offlineNote.hidden = navigator.onLine;
  };
  window.addEventListener("online", updateOnline);
  window.addEventListener("offline", updateOnline);
  updateOnline();

  client.onStatus((status, reason, modelVersion) => setStatusBanner(status, reason, modelVersion));
  queue.onChange = () => {
    renderQueue();
    renderResults();
    syncControls();
  };
  renderQueue();
  renderResults();
  void refreshCharts();
  void refreshHistory();
  setStatusBanner("loading");
  void client.load();
}

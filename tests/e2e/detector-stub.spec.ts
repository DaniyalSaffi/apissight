/**
 * Detector smoke tests with synthetic stub models (never real weights).
 *
 * The stub sets are copied into apps/web/dist by `npm run pretest:e2e`
 * (see tests/fixtures/generate-stub-models.mjs) so the preview server
 * serves them as real files: stub-valid at /models, stub-invalid at
 * /models-invalid. Route interception is NOT used: the detector loads
 * its models inside a Web Worker, and the registered service worker
 * handles same-origin requests, so intercepted routes never reach the
 * worker's fetches. The ?models= query override (same-origin paths
 * only) selects the model folder.
 */
import { test, expect, type Page } from "@playwright/test";
import { existsSync } from "node:fs";
import { join } from "node:path";

// 1x1 red PNG.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test.beforeAll(() => {
  const probe = join(process.cwd(), "apps", "web", "dist", "models", "stage1", "model.json");
  if (!existsSync(probe)) {
    throw new Error(
      "Stub models missing from apps/web/dist. Run: npm run build && npm run pretest:e2e",
    );
  }
});

/** Surface the detector's own failure reason (logged via console.warn) in CI output. */
function captureDiagnostics(page: Page): void {
  page.on("console", (message) => {
    if (message.type() === "warning" || message.type() === "error") {
      console.log(`[page ${message.type()}] ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => console.log(`[pageerror] ${error.message}`));
}

async function upload(page: Page, name: string, buffer: Buffer, mimeType = "image/png"): Promise<void> {
  await page.setInputFiles("#file-input", { name, buffer, mimeType });
}

test("valid stub: upload, analyse, Stage 1 + Stage 2 results, exports enabled", async ({ page }) => {
  captureDiagnostics(page);
  await page.goto("/detector");
  await expect(page.locator("#detector-status")).toContainText("Model ready");
  await upload(page, "bee.png", PNG);
  await expect(page.locator(".queue-item")).toContainText("bee.png");
  await page.click("#btn-analyse");
  const card = page.locator(".result-card");
  await expect(card).toBeVisible();
  await expect(card).toContainText("Stage 1: Honey Bee or Beehive");
  await expect(card).toContainText("Stage 2: Deformed Wing Virus (DWV)");
  await expect(card).not.toContainText("Stage 2 skipped");
  await expect(page.locator("#btn-export-csv")).toBeEnabled();
  await expect(page.locator("#btn-export-json")).toBeEnabled();
});

test("invalid stub: Stage 2 is skipped and no Stage 2 label appears", async ({ page }) => {
  captureDiagnostics(page);
  await page.goto("/detector?models=/models-invalid");
  await expect(page.locator("#detector-status")).toContainText("Model ready");
  await upload(page, "flower.png", PNG);
  await page.click("#btn-analyse");
  const card = page.locator(".result-card");
  await expect(card).toBeVisible();
  await expect(card).toContainText("Invalid image — Stage 2 skipped");
  await expect(card).toContainText("Stage 1: Not Honey Bee or Not Beehive");
  await expect(card).not.toContainText("Stage 2: Deformed");
  await expect(card).not.toContainText("Stage 2: Healthy");
});

test("no models: friendly coming-soon state, no error text, analysis disabled", async ({ page }) => {
  captureDiagnostics(page);
  await page.goto("/detector?models=/models-absent");
  await expect(page.locator("#detector-status")).toContainText("Live demo coming soon");
  await expect(page.locator("#detector-status")).not.toContainText("not loaded");
  await expect(page.locator("#detector-status")).not.toContainText("failed");
  await expect(page.locator("#btn-analyse")).toBeDisabled();
  await expect(page.locator("#detector-retry")).toBeVisible();
});

test("duplicates are marked and corrupt files fail without blocking the queue", async ({ page }) => {
  captureDiagnostics(page);
  await page.goto("/detector");
  await expect(page.locator("#detector-status")).toContainText("Model ready");
  await upload(page, "bee.png", PNG);
  await upload(page, "bee.png", PNG);
  await expect(page.locator(".queue-item")).toHaveCount(2);
  await expect(page.locator(".queue-item").nth(1)).toContainText("duplicate");
  await upload(page, "corrupt.png", Buffer.from("this is not image data at all"));
  await expect(page.locator(".queue-item")).toHaveCount(3);
  await page.click("#btn-analyse");
  await expect(page.locator(".queue-item").nth(0)).toContainText("done");
  await expect(page.locator(".queue-item").nth(2)).toContainText("error");
  await expect(page.locator(".queue-error").first()).toBeVisible();
  await expect(page.locator(".result-card")).toHaveCount(1);
});

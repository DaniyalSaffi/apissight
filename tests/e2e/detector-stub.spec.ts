/** Detector smoke tests with synthetic stub models (never real weights). */
import { test, expect, type Page, type Route } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "..", "fixtures");

// 1x1 red PNG.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function serveStub(page: Page, set: "stub-valid" | "stub-invalid"): Promise<void> {
  const base = join(fixturesDir, set);
  if (!existsSync(join(base, "stage1", "model.json"))) {
    throw new Error(`Stub fixtures missing. Run: node tests/fixtures/generate-stub-models.mjs`);
  }
  await page.route("**/models/**", async (route: Route) => {
    const url = new URL(route.request().url());
    const relative = url.pathname.replace(/^\/models\//, "");
    const file = join(base, relative);
    if (!existsSync(file)) {
      await route.fulfill({ status: 404, body: "stub file not found" });
      return;
    }
    const body = readFileSync(file);
    const contentType = file.endsWith(".json") ? "application/json" : "application/octet-stream";
    await route.fulfill({ status: 200, body, contentType });
  });
}

async function upload(page: Page, name: string, buffer: Buffer, mimeType = "image/png"): Promise<void> {
  await page.setInputFiles("#file-input", { name, buffer, mimeType });
}

test("valid stub: upload, analyse, Stage 1 + Stage 2 results, exports enabled", async ({ page }) => {
  await serveStub(page, "stub-valid");
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
  await serveStub(page, "stub-invalid");
  await page.goto("/detector");
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
  await page.goto("/detector");
  await expect(page.locator("#detector-status")).toContainText("Live demo coming soon");
  await expect(page.locator("#detector-status")).not.toContainText("not loaded");
  await expect(page.locator("#detector-status")).not.toContainText("failed");
  await expect(page.locator("#btn-analyse")).toBeDisabled();
  await expect(page.locator("#detector-retry")).toBeVisible();
});

test("duplicates are marked and corrupt files fail without blocking the queue", async ({ page }) => {
  await serveStub(page, "stub-valid");
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

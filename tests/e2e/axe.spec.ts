/** axe accessibility scan on every built page, plus the 404 page. */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

function collectRoutes(dir: string, base: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectRoutes(full, base, out);
    } else if (entry === "index.html") {
      const rel = relative(base, join(dir));
      out.push(rel === "" ? "/" : `/${rel.split(sep).join("/")}/`);
    }
  }
  return out.sort();
}

const distDir = join(process.cwd(), "apps", "web", "dist");
const routes = collectRoutes(distDir, distDir);

test("every built page exists in the route list", () => {
  expect(routes.length).toBeGreaterThan(20);
  expect(routes).toContain("/");
  expect(routes).toContain("/detector/");
  expect(routes).toContain("/research/");
});

for (const route of routes) {
  test(`axe: ${route} has no violations`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder(page).analyze();
    expect(results.violations).toEqual([]);
  });
}

test("axe: 404 page has no violations", async ({ page }) => {
  await page.goto("/this-page-does-not-exist-404-check");
  await expect(page.locator("main")).toBeVisible();
  const results = await new AxeBuilder(page).analyze();
  expect(results.violations).toEqual([]);
});

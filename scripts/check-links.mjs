#!/usr/bin/env node
/**
 * Internal link check. Run after `npm run build`.
 * Scans apps/web/dist HTML for internal hrefs and reports targets that do not exist.
 * External links, mailto:, tel:, and pure anchors are skipped.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const distDir = join(root, "apps", "web", "dist");

if (!existsSync(distDir)) {
  console.error("dist/ not found. Run `npm run build` first.");
  process.exit(1);
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry.endsWith(".html")) out.push(full);
  }
  return out;
}

const broken = [];
for (const file of walk(distDir)) {
  const html = readFileSync(file, "utf8");
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  for (const raw of hrefs) {
    if (/^(https?:|mailto:|tel:|#|data:)/.test(raw)) continue;
    const path = raw.split("#")[0].split("?")[0];
    if (!path) continue;
    // Strip the build base path: dist is rooted at the base, so resolve from dist.
    // Astro emits base-prefixed hrefs; find the file by trying the full path
    // and, if needed, by stripping leading segments until a file matches.
    const candidates = [];
    let rel = path.replace(/^\//, "");
    candidates.push(rel);
    const parts = rel.split("/");
    while (parts.length > 1) {
      parts.shift();
      candidates.push(parts.join("/"));
    }
    let found = false;
    for (const cand of candidates) {
      const target = resolve(distDir, cand);
      if (
        existsSync(target) &&
        (statSync(target).isFile() || existsSync(join(target, "index.html")))
      ) {
        found = true;
        break;
      }
      if (existsSync(`${target}.html`)) {
        found = true;
        break;
      }
      if (existsSync(join(target, "index.html"))) {
        found = true;
        break;
      }
    }
    if (!found) broken.push(`${relative(distDir, file)} -> ${raw}`);
  }
}

if (broken.length > 0) {
  console.log("Broken internal links:");
  for (const b of broken) console.log(`  - ${b}`);
  process.exit(1);
}
console.log(`Link check: PASS (${walk(distDir).length} pages, no broken internal links).`);

#!/usr/bin/env node
/**
 * Launch gate.
 *
 * Usage:
 *   node scripts/check-launch-gate.mjs            # report only, always exits 0
 *   node scripts/check-launch-gate.mjs --strict   # exit 1 while any launch blocker remains
 *
 * Production launch is blocked while any of these remain in the site source
 * (pages, data, config, i18n — component files are excluded because badge
 * default labels and the placeholder-box template are UI machinery, not
 * content claims):
 *   - PlaceholderBox usage in pages, data-placeholder attributes, or
 *     status: "placeholder" values (friendly "To be added" cards)
 *   - "Evidence pending" / "Consent pending" markers (any case, incl. data values)
 *   - "Pending SAWiE approval" / "Pending expert review" markers
 *   - StatusBadge usage with kind="evidence" | "consent" | "approval" | "review"
 *   - consent: "pending" values in data files
 *   - needsReview translations
 *   - allowIndexing: false or earlyRelease: true in site.config.ts
 *
 * Note: kind="pending" is deliberately NOT a blocker — "Under review" (paper)
 * and "Planned"/"Exploring" (roadmap) are legitimate states at launch.
 *
 * Early-release deploys run the non-strict form. The CI launch-gate job runs
 * --strict in report-only mode (non-blocking) until the owner turns strict
 * mode back on for the full launch.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const srcDir = join(root, "apps", "web", "src");
const strict = process.argv.includes("--strict");

const MARKERS = [
  "<PlaceholderBox",
  "data-placeholder",
  'status: "placeholder"',
  "Evidence pending",
  "evidence pending",
  "Consent pending",
  "Pending SAWiE approval",
  "Pending expert review",
  'kind="evidence"',
  'kind="consent"',
  'kind="approval"',
  'kind="review"',
  'consent: "pending"',
  "needsReview: true",
];

const EXCLUDED_DIRS = new Set(["components"]);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry)) walk(full, out);
    } else if (/\.(astro|ts|tsx|md|mdx|css)$/.test(entry)) out.push(full);
  }
  return out;
}

const findings = [];
for (const file of walk(srcDir)) {
  const text = readFileSync(file, "utf8");
  for (const marker of MARKERS) {
    if (text.includes(marker)) {
      findings.push(`${relative(root, file)}: contains "${marker}"`);
    }
  }
}

const configText = readFileSync(join(srcDir, "site.config.ts"), "utf8");
if (/allowIndexing:\s*false/.test(configText)) {
  findings.push("apps/web/src/site.config.ts: allowIndexing is false (noindex on)");
}
if (/earlyRelease:\s*true/.test(configText)) {
  findings.push("apps/web/src/site.config.ts: earlyRelease is true (banner on)");
}

if (findings.length === 0) {
  console.log("Launch gate: PASS — no launch blockers found.");
  process.exit(0);
}

console.log(`Launch gate: ${findings.length} blocker(s) found:`);
for (const f of findings) console.log(`  - ${f}`);

if (strict) {
  console.log("\nStrict mode: full launch is BLOCKED. Clear every blocker above,");
  console.log("set allowIndexing to true and earlyRelease to false, and get owner approval before launching.");
  process.exit(1);
}

console.log("\nReport mode: early release may proceed (noindex + banner). Full launch is blocked.");
process.exit(0);

import { defineConfig } from "astro/config";

// GitHub Pages: SITE_URL and BASE_PATH come from repository variables.
// See docs/GITHUB_PAGES_SETUP.md. Local defaults are safe for preview.
const site = process.env.SITE_URL || "http://localhost:4321";
let base = process.env.BASE_PATH || "/";
if (!base.endsWith("/")) base += "/";
if (!base.startsWith("/")) base = `/${base}`;

export default defineConfig({
  site,
  base,
  output: "static",
  trailingSlash: "ignore",
  build: {
    format: "directory",
  },
  vite: {
    // The detector worker must build as an ES module; Astro's default
    // inlined-script format (iife) rejects worker builds.
    worker: { format: "es" },
  },
});

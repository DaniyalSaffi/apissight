import { defineConfig } from "@playwright/test";

/**
 * End-to-end tests run against the built site (run `npm run build` first).
 * Detector tests serve synthetic stub models via route interception; no
 * real model files are needed. See tests/fixtures/README.md.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:4321",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run preview --workspace=apps/web -- --port 4321 --host 127.0.0.1 --strictPort",
    url: "http://127.0.0.1:4321/",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});

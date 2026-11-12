# Test fixtures

`generate-stub-models.mjs` writes synthetic stub models into `stub-valid/`
and `stub-invalid/` (gitignored, regenerated before every e2e run). The stubs
are tiny Flatten + Dense networks with zero weights and a fixed bias, so
their outputs are fully determined: `stub-valid` passes the Stage 1 gate,
`stub-invalid` does not.

They are NOT project models. Never ship them, never measure accuracy with
them, and never copy them into `apps/web/public/models/` or
`packages/models/`.

The generator also copies the sets into `apps/web/dist/{models,models-invalid}`
so the preview server serves them as real files during e2e runs. Route
interception is not used: the detector loads its models inside a Web Worker,
and the registered service worker handles same-origin requests, so
intercepted routes never reach the worker's fetches. The detector page
accepts a `?models=` query override (same-origin paths only) to select the
model folder; the specs use `/models` (valid), `/models-invalid`, and
`/models-absent` (no files, for the coming-soon case). Build before testing
(`npm run build`, then `npm run test:e2e`); rebuilding wipes `dist/`, so do
not rebuild between the copy and the test run.

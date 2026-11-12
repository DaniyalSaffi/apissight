# Test fixtures

`generate-stub-models.mjs` writes synthetic stub models into `stub-valid/`
and `stub-invalid/` (gitignored, regenerated before every e2e run). The stubs
are tiny Flatten + Dense networks with zero weights and a fixed bias, so
their outputs are fully determined: `stub-valid` passes the Stage 1 gate,
`stub-invalid` does not.

They are NOT project models. Never ship them, never measure accuracy with
them, and never copy them into `apps/web/public/models/` or
`packages/models/`.

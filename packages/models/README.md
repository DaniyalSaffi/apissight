# packages/models — converted model output (Phase 2)

This package will hold the converted TensorFlow.js models, one folder per stage:

```
packages/models/
  stage1/   # model.json + weight shards + manifest.json (from ml/converted/stage1)
  stage2/   # model.json + weight shards + manifest.json (from ml/converted/stage2)
```

Both folders are gitignored and EMPTY in this early release, on purpose:

1. Conversion has not run yet (see `ml/COLAB_RUNBOOK.md`).
2. Parity has not passed yet (see `docs/PARITY_REPORT.md`).
3. Ownership/licensing of the models is unconfirmed. No weights are published
   until that decision is recorded in the local open-items list (IP-1).
   See `docs/MODEL_PUBLISHING.md` for the publishing options.

Manifest templates live here for reference only. Real manifests are written by
`ml/convert_to_tfjs.py` and must include the source file hash. Never hand-write
a manifest for shipped models.

- `stage1.manifest.template.json`
- `stage2.manifest.template.json`

Do not place original `.h5` files here. Originals live in `ml/originals/`
(gitignored) during conversion, and nowhere in the repository afterwards.

## Serving the models in the detector

After parity passes and IP-1 is recorded, copy the converted folders into
the site's public folder (also gitignored), where the detector worker loads
them:

```
apps/web/public/models/stage1/   # copy of packages/models/stage1/
apps/web/public/models/stage2/   # copy of packages/models/stage2/
```

The worker fetches `manifest.json` first; if the folders are missing it
reports "not-loaded" and the Detector page shows a clear message instead of
predictions. Keep `packages/models/` as the canonical store and
`apps/web/public/models/` as the served copy.

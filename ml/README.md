# ml/ — conversion and parity only

No training happens here. No model is retrained, modified, or replaced. This
folder converts the two supplied models for the browser and proves the
conversion matches the originals (plan §7.3–§7.4).

## Files

| File | Purpose |
|---|---|
| `convert_to_tfjs.py` | Load each `.h5` (legacy Keras + `CustomDepthwiseConv2D` fix), verify input/output shapes against the labels files, convert to TF.js (Keras route, then SavedModel fallback), write `manifest.json` + `conversion.log`. |
| `parity_test.py` | Keras-side run over a labelled parity set. Preprocessing exactly as in plan §7.1. |
| `parity_test_tfjs.mjs` | TF.js-side run over the same set (Node + `@tensorflow/tfjs-node`). Same JSON shape, same gate. |
| `parity_compare.py` | Compare both runs. Acceptance: top-1 agreement ≥ 99% and max probability difference ≤ 0.02 (plan §7.4). |
| `requirements.txt` | Python dependencies for Colab. |
| `COLAB_RUNBOOK.md` | Exact click-by-click Colab steps, expected outputs, and what to send back. |

## Layout (gitignored — never commit models or parity images)

```
ml/
  originals/      # place keras_model.h5, keras_model (1).h5, labels files here
  converted/      # TF.js output: stage1/, stage2/ (model.json + shards + manifest.json)
  parity-data/    # images/ + manifest.csv (team-supplied, rights-cleared only)
  parity-results/ # keras_results.json, tfjs_results.json, summary.json
```

## Inference reference (authoritative)

Preprocessing and the two-stage gate come from the working inference code
(plan §7.1), confirmed against the team's dashboard code (`bee_dashboard.py`,
supplied 2026-11-12):

- `ImageOps.fit` centre-crop + resize to 224×224, LANCZOS; `x = (array / 127.5) - 1`.
- Stage 1 label starting with `"0"` = valid. Stage 2 runs only for valid images.
- Display names strip the leading number; exports keep the raw label.
- Legacy Keras load: `TF_USE_LEGACY_KERAS=1`, `tf_keras`, `CustomDepthwiseConv2D`
  dropping the `groups` argument.

The FYP report's training-preprocessing description (0–1 range, aspect-preserving
padding) does NOT apply to the demo.

## Resize methods (recorded 2026-11-12)

All three backends centre-crop to a square, resize to 224×224, and scale with
`x = (pixel / 127.5) - 1`. The resampling method differs by backend:

| Backend | Resize method |
|---|---|
| Python / Keras (`parity_test.py`) | PIL `ImageOps.fit`, LANCZOS (exact plan §7.1) |
| Browser worker (`apps/web/src/lib/detector/worker.ts`) | `OffscreenCanvas` draw at 224×224 with `imageSmoothingQuality: "high"`; bilinear fallback where `OffscreenCanvas` is unavailable |
| Node / TF.js (`parity_test_tfjs.mjs`) | Progressive bilinear halving (approximates the browser smoothing; TF.js has no Lanczos or canvas path in Node) |

The parity test measures the total effect of these differences. Acceptance is
unchanged (top-1 agreement ≥ 99%, max per-class probability difference ≤ 0.02).
The parity test stays the final judge: if it fails, the demo switches to a
Python API instead of changing the models.

## Dashboard reference → Phase 2 detector requirements

`bee_dashboard.py` (Flask + Colab) is the functional reference for plan §7.5.
The Phase 2 detector (`apps/web/src/lib/detector/`) reproduces its behaviour
in the browser (on-device, no server):

| Dashboard behaviour | Phase 2 requirement |
|---|---|
| SHA-1 duplicate detection, corrupt-file rejection, thumbnails | Same, in the browser; strip EXIF/location data |
| Queue: analyse all / selected / single; pause, resume, stop, restart | Same state machine in a Web Worker |
| Status per image: queued, processing, done, error | Same, plus per-image JSON download |
| Result cards: both stages, confidence, probability bars, low-confidence warning (default threshold 0.70), "Stage 2 skipped" for invalid | Same |
| Healthy vs diseased badge by keyword ("healthy" in Stage 2 label, configurable) | Same setting, same default |
| Charts: outcome overview, disease distribution, average confidence | Same (Chart.js or equivalent) |
| Exports: CSV, XLSX, JSON, PDF with file, time, Stage 1, confidence, valid flag, Stage 2, Stage 2 confidence | Same columns; add model version + timestamp |
| Run history (last 30 runs) | IndexedDB history with the same fields |
| Settings: healthy keyword, low-confidence threshold, auto-analyse uploads | Same settings panel |
| Theme toggle (light/dark, stored locally) | Same (already in the Phase 1 site chrome) |

The dashboard's YOLO/counting features do not exist — it classifies photos only,
like the detector. Do not add counting to the detector. (EXIF/location
stripping: uploads are processed on-device and never leave the browser; the
256px thumbnails stored in history are re-encoded JPEGs, which drops EXIF.)

## If parity fails

Do not edit the models. Switch the demo to a Python API (plan §7.2, Option B)
behind the same `InferenceProvider` interface (`packages/core/src/types.ts`),
and record the decision in `docs/PARITY_REPORT.md`.

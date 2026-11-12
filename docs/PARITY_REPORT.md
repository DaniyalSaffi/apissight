# Parity report

**Status: PASSED on run #2 (2026-11-12, private apissight-ml repo, workflow
`convert-and-parity`, run 43206277760).** Run #1 failed on the old browser
resize; the Pillow-exact worker fixed it, and run #2 passed every check below
with the shipped `pillow` variant. The browser demo may proceed once the
model-publishing decision (M2) is made. Parity is backend agreement only —
it is NOT accuracy: the parity set carries no verified ground-truth labels.

## Acceptance (master plan §7.4)

- At least 30 representative, labelled test images (team-supplied).
- Top-1 agreement between Keras and TF.js: at least 99% (Stage 1 and Stage 2).
- Per-class probability difference: at most 0.02 (maximum absolute difference).
- Stage 1 gate agreement: no image may pass the gate on one backend and fail it
  on the other.

If any rule fails: switch the demo to a Python API (plan §7.2, Option B).
Never change the models.

## Preprocessing used in the run (recorded 2026-11-12, updated for the Pillow-exact worker)

All backends centre-crop to a square, resize to 224×224, and scale with
`x = (pixel / 127.5) - 1`. Resampling differs by backend:

| Backend | Resize method |
|---|---|
| Python / Keras (`ml/parity_test.py`) | PIL `ImageOps.fit`, LANCZOS (exact plan §7.1) |
| Browser worker, default (`apps/web/src/lib/detector/preprocess.ts`, variant `pillow`) | Pillow-exact port of Pillow 10.4.0: `ImageOps.fit` float crop box, then the two-pass fixed-point Lanczos resample from `libImaging/Resample.c`. Validated bit-exact against Pillow 10.4.0 on all 32 parity images locally, and again 0 difference on all 32 in run #2 |
| Browser worker, parity variants (`?preprocess=`) | `lanczos3`: plain Lanczos3 on an integer centre crop. `canvas`: the previous `OffscreenCanvas` draw with `imageSmoothingQuality: "high"`. `passthrough`: no resize (tensor-level test). Experiments only |
| Node / TF.js (`ml/parity_test_tfjs.mjs`) | Progressive bilinear halving (approximates the browser smoothing) |

Decoding keeps the browser's default EXIF orientation handling
(`"from-image"`): what the user sees is what the model gets. The parity
images carry no EXIF orientation, so parity is unaffected.

The parity test measures the total effect of these differences and stays the
final judge. If it fails, the demo switches to a Python API; the models are
never changed.

## Run details (run #2, 2026-11-12)

| Field | Value |
|---|---|
| Date run | 2026-11-12 |
| Run by | GitHub Actions workflow `convert-and-parity` (run #2, 43206277760), private `apissight-ml` repo, commit `c74f85c`; site + worker under test: `apissight` commit `22ce658` |
| TensorFlow version | 2.15.1 |
| tf-keras version | 2.15.1 |
| tensorflowjs version | 4.17.0 |
| Pillow / NumPy versions | 10.4.0 / 1.26.4 |
| Node version (TF.js side) | v22.23.4 (Playwright 1.65.0) |
| Stage 1 source file + SHA-256 | `keras_model.h5`, `4f112bbeca0102b13954d26b0c0ca525154a70fb1752dbdd012201d76370e2bc` |
| Stage 2 source file + SHA-256 | `keras_model__1.h5`, `b0e75a17983bdc8df74b4d854dd8c619ce1835c25627aaf6ce6d434e768fc0f4` |
| Parity set size | 32 (≥ 30) |
| Parity set description | 32 licensed stock images (13 bee, 7 disease, 12 non-bee), UNLABELLED — expected-label columns empty, so agreement only, never accuracy. Rights: see `ml/parity_images/SOURCES.md` in the private repo |

## Results (shipped variant `pillow`, from `ml/parity-results/summary_pillow.json`)

| Check | Result | Pass? |
|---|---|---|
| Images compared | 32 | — |
| Stage 1 top-1 agreement | 1.0000 (32/32) | Yes (≥ 0.99) |
| Stage 2 top-1 agreement | 1.0000 (32/32) | Yes (≥ 0.99) |
| Stage 1 max probability difference | 0.000001 | Yes (≤ 0.02) |
| Stage 2 max probability difference | 0.000003 | Yes (≤ 0.02) |
| Gate mismatches | 0 | Yes |
| Pixel test (browser pixels vs Python arrays) | Worst max difference 0 on all 32 images (goal ≤ 2) | Yes |
| Tensor test (`passthrough`, no resize) | Max differences 0.000001 / 0.000003 | Yes (conversion clean) |
| Borderline cases | None: no flip, so no Keras top-2 gap within 0.02 arises | — |
| Agreement with expected labels (Keras, Stage 1) | Not scored (set unlabelled) | informational only |
| Agreement with expected labels (Keras, Stage 2) | Not scored (set unlabelled) | informational only |
| Agreement with expected labels (TF.js, Stage 1) | Not scored (set unlabelled) | informational only |
| Agreement with expected labels (TF.js, Stage 2) | Not scored (set unlabelled) | informational only |

Other variants in the same run, for the record: `lanczos3` failed (Stage 2
max difference 0.027952 > 0.02, pixel worst max 70); `canvas` failed exactly
as in run #1 (agreements 0.9688 / 0.9062, max differences 0.911143 / 0.425026,
gate mismatch `nonbee_05.jpg`), confirming the old resize was the cause of
the run #1 failure. `passthrough` passed with the same numbers as `pillow`.

## Decision

- [x] Parity PASSED — browser demo may proceed to Phase 2 build, pending the model-publishing decision (M2).
- [ ] Parity FAILED — Python API fallback. Reason recorded: _not applicable; run #1 failed on the old resize and was superseded by run #2._

## Measured figures for the site (owner approval required)

Measured agreement with expected labels describes these models on THIS test
set only. Figures go on the site only after the owner approves the exact
numbers and test-set description. Do not copy figures from this report to the
site without that approval. Until then, the site shows metric placeholders.
No accuracy figure exists for the demo models: the parity set is unlabelled,
and a labelled test set is still needed (MODEL-1).

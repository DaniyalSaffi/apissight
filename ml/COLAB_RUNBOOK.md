# Colab runbook — convert the models and run the parity test

Run this in Google Colab (free tier is enough). No payment, no billing setup.
Nothing here contacts anyone or publishes anything. You only send back the
output files listed at the end.

Time estimate: roughly 15–30 minutes once files are uploaded, mostly waiting
for installs and model loads. If a step fails, stop, copy the error text, and
send it back instead of guessing.

## Before you start

Have ready, on your computer:

1. This repository (or at least the `ml/` folder) — download the zip from the
   project files, or clone the repo if it exists on GitHub by then.
2. The two model files: `keras_model.h5` and `keras_model (1).h5`.
3. The two labels files: `labels.txt` and `labels (1).txt.txt`.
4. The parity set — **already collected in this repository**: `ml/parity_images/`
   (32 licensed images) + `ml/parity_images/manifest.csv`. See "Parity set"
   below. If you use the collected set, you can run Steps 1–7 in one go.

## Parity set

Two kinds of test set exist. Do not confuse them.

**A. Backend-agreement set (already collected — use this for Steps 5–7).**
`ml/parity_images/` holds 32 freely licensed images (bee/hive photos, non-bee
images, and disease-condition photos) with a `manifest.csv` whose expected-label
columns are EMPTY. That is deliberate: the parity test checks that the Keras
and TensorFlow.js builds of the SAME models produce the same outputs, so
ground-truth labels are not required. **Parity agreement is not accuracy.**
Never use this set to claim accuracy.

To use it in Colab, copy it into the layout the scripts expect:

```python
!cp ml/parity_images/manifest.csv ml/parity-data/manifest.csv
!cp ml/parity_images/*.jpg ml/parity_images/*.png ml/parity-data/images/ 2>/dev/null
```

Sources for every image are logged in `ml/parity_images/SOURCES.md`. This
folder is gitignored and stays out of the public repository.

**B. Labelled set (still needed — for accuracy measurement only).** To measure
accuracy, the team or experts must label images. Build it like this:

- At least 30 images. Include: healthy bees, each of the three diseases, and
  invalid images (no bee/hive: e.g. flowers alone, equipment, people, other insects).
- Use only photos you own or have clear rights to use. Do not scrape images.
- Name files simply, e.g. `bee_001.jpg`, `invalid_001.jpg`. Keep originals
  unedited (no crops, no filters) — preprocessing happens in the scripts.
- Label each image yourself (or with an expert) and write `manifest.csv`:

```csv
file,stage1_expected,stage2_expected
bee_001.jpg,0 Honey Bee or Beehive,1 Deformed Wing Virus (DWV)
healthy_001.jpg,0 Honey Bee or Beehive,0 Healthy Honey Bee or Healthy Beehive
invalid_001.jpg,1 Not Honey Bee or Not Beehive,
```

Rules: expected labels must match the labels files exactly, including the
leading number. `stage2_expected` stays empty for invalid images. One row per
image. No extra columns. With a labelled manifest, `parity_compare.py` also
reports agreement with your expected labels; with the unlabelled set it
reports backend agreement only.

## Step 1 — Open Colab and install dependencies

1. Go to <https://colab.research.google.com> and open a new notebook.
2. Run this cell:

```python
!pip install -q tf_keras tensorflowjs Pillow numpy h5py
```

3. Restart the runtime: menu **Runtime → Restart runtime** (required after
   installing `tf_keras`, same as the dashboard notebook).
4. In a new cell, record versions (copy the output — it goes in the parity report):

```python
import tensorflow, tf_keras, tensorflowjs, PIL, numpy
print("tensorflow", tensorflow.__version__)
print("tf_keras", tf_keras.__version__)
print("tensorflowjs", tensorflowjs.__version__)
print("Pillow", PIL.__version__)
print("numpy", numpy.__version__)
```

Expected: version numbers print, no errors.

## Step 2 — Upload the repository and model files

Run this cell, then use the file browser (folder icon, left sidebar) to upload:

```python
import os
os.makedirs("ml/originals", exist_ok=True)
os.makedirs("ml/parity-data/images", exist_ok=True)
os.makedirs("ml/parity-results", exist_ok=True)
print("Folders ready. Upload files with the file browser, or mount Drive.")
```

Upload into these exact places:

- `ml/convert_to_tfjs.py`, `ml/parity_test.py`, `ml/parity_compare.py`
  (from this repository's `ml/` folder).
- `ml/originals/keras_model.h5`
- `ml/originals/keras_model (1).h5` (keep the exact name, including spaces).
- `ml/originals/labels.txt`
- `ml/originals/labels (1).txt.txt`
- Parity images into `ml/parity-data/images/`, and `ml/parity-data/manifest.csv`.

Tip: if Drive is easier, mount it (`from google.colab import drive;
drive.mount('/content/drive')`) and copy files with `!cp` instead. Paths in
the commands below assume the layout above.

Verify with:

```python
!ls -lh ml/originals/ ml/parity-data/ ml/parity-data/images/ | head -50
!cat ml/parity-data/manifest.csv
```

Expected: all four model/labels files listed; manifest rows shown. If the
parity set is not ready yet, the `ml/parity-data` folders may be empty — that
is fine for Steps 3–4.

## Step 3 — Convert Stage 1

```python
!python ml/convert_to_tfjs.py --stage 1 \
  --model ml/originals/keras_model.h5 \
  --labels ml/originals/labels.txt \
  --out ml/converted/stage1
```

Expected output ends with:

```
Done. TF.js output in ml/converted/stage1. Manifest and log written.
Next: run the parity test ...
```

If it prints `Route 1 failed. Saving SavedModel ...`, that is the planned
fallback — wait for it to finish. Only a final `ERROR: conversion failed on
both routes` means conversion failed. If that happens, download
`ml/converted/stage1/conversion.log` and send it back. Do not edit the model.

## Step 4 — Convert Stage 2

```python
!python ml/convert_to_tfjs.py --stage 2 \
  --model "ml/originals/keras_model (1).h5" \
  --labels "ml/originals/labels (1).txt.txt" \
  --out ml/converted/stage2
```

Same expected output as Step 3, for `stage2`. Check both outputs:

```python
!ls -lh ml/converted/stage1/ ml/converted/stage2/
!cat ml/converted/stage1/manifest.json
!cat ml/converted/stage2/manifest.json
```

Expected: each folder has `model.json`, weight shard file(s), `manifest.json`,
and `conversion.log`. Manifests show 2 labels (Stage 1) and 4 labels (Stage 2).

## Step 5 — Keras-side parity run

```python
!python ml/parity_test.py \
  --stage1 ml/originals/keras_model.h5 --labels1 ml/originals/labels.txt \
  --stage2 "ml/originals/keras_model (1).h5" --labels2 "ml/originals/labels (1).txt.txt" \
  --images ml/parity-data/images --manifest ml/parity-data/manifest.csv \
  --out ml/parity-results/keras_results.json
```

Expected: one line per image (`file: Stage 1 label -> Stage 2 label or skipped`),
ending with `Wrote N results to ...`. A warning about fewer than 30 images
means: add more images and re-run. Do not proceed with fewer than 30.

## Step 6 — TF.js-side parity run

Colab runs Python, so the TF.js side runs in Node. Colab includes Node. Run:

```python
!node --version
!npm install --no-save @tensorflow/tfjs-node
```

Resize note (updated 2026-11-12): the three backends resample differently —
Python uses PIL Lanczos, the browser worker uses OffscreenCanvas drawing with
`imageSmoothingQuality: "high"`, and the Node script below uses progressive
bilinear halving to approximate the browser smoothing. All three use the same
centre-crop and the same `x = (pixel / 127.5) - 1` scaling. The parity test
measures the total effect of these differences and stays the final judge.

Then upload `ml/parity_test_tfjs.mjs` (from this repository) if it is not
already in `ml/`, and run:

```python
!node ml/parity_test_tfjs.mjs \
  --stage1 ml/converted/stage1/model.json --labels1 ml/originals/labels.txt \
  --stage2 ml/converted/stage2/model.json --labels2 "ml/originals/labels (1).txt.txt" \
  --images ml/parity-data/images --manifest ml/parity-data/manifest.csv \
  --out ml/parity-results/tfjs_results.json
```

Expected: same per-image lines as Step 5, ending with `Wrote N results ...`.

Troubleshooting:

- `Cannot find module '@tensorflow/tfjs-node'`: re-run the `npm install` cell
  in the same notebook session (same folder as the script), then retry.
- `Failed to load model`: check Step 3–4 outputs exist and `model.json` paths
  are exact. Send the full error text back if stuck.
- If Node is unavailable in your Colab session, run Step 6 on your own
  computer instead (Node 18+): `npm install --no-save @tensorflow/tfjs-node`,
  then the same `node` command with local paths. Send back the JSON file.

## Step 7 — Compare and decide

```python
!python ml/parity_compare.py \
  --keras ml/parity-results/keras_results.json \
  --tfjs ml/parity-results/tfjs_results.json \
  --out ml/parity-results/summary.json
```

Expected on success: a JSON summary ending with `PARITY PASSED`, including
top-1 agreement and max probability difference for both stages. With the
unlabelled collected set, that is all it shows — backend agreement only,
which is what parity means. With a labelled manifest it also reports
agreement with your expected labels.

On `PARITY FAILED`: do not ship the browser demo. Send back `summary.json`
and both results files. The fallback is a Python API (the models stay unchanged).

## What to send back

Download from Colab (right-click → Download in the file browser) and send:

1. `ml/converted/stage1/` — whole folder (model.json, shards, manifest.json, conversion.log).
2. `ml/converted/stage2/` — whole folder.
3. `ml/parity-results/summary.json`, `keras_results.json`, `tfjs_results.json`.
4. `ml/parity-data/manifest.csv` — only if you changed it (e.g. you added
   expected labels). The collected unlabelled manifest is already in the
   repository. Send the images only if you are happy to share them for
   verification; otherwise keep them and send the manifest + results.
5. The version numbers from Step 1, and any error text if a step failed.

Do NOT send passwords, tokens, or anything else. The converted models and
results will be checked, the parity report will be written, and only then
will the live demo be switched on (the detector UI is built and waits for
the models in `apps/web/public/models/`).

## Safety reminders

- Never retrain, edit, or replace the models. Conversion only.
- Never publish parity images without rights and consent.
- Parity agreement is NOT accuracy. Agreement between the two backends says
  the conversion preserved the models; it says nothing about how often the
  models are right. Accuracy comes only from a labelled set.
- Measured figures from Step 7 describe these models on YOUR test set only.
  They go on the site only after you approve the measured numbers.

#!/usr/bin/env python3
"""Run the original Keras models over a labelled parity set (Keras side).

Preprocessing is EXACTLY the working inference code (plan section 7.1):
  - open image, convert to RGB
  - ImageOps.fit to 224x224, LANCZOS (centre-crop, then resize)
  - x = (array / 127.5) - 1, float32, batch of 1
Gate: Stage 2 runs only when the Stage 1 label starts with "0".

Parity manifest CSV format (header required):
    file,stage1_expected,stage2_expected
    bee_001.jpg,0 Honey Bee or Beehive,1 Deformed Wing Virus (DWV)
    cat_001.jpg,1 Not Honey Bee or Not Beehive,
  - `file` is relative to --images.
  - `stage2_expected` is empty for invalid (non-bee) images.
  - Expected labels must match the labels files EXACTLY, including the leading number.

Usage:

    python ml/parity_test.py \\
        --stage1 ml/originals/keras_model.h5 --labels1 ml/originals/labels.txt \\
        --stage2 "ml/originals/keras_model (1).h5" --labels2 "ml/originals/labels (1).txt.txt" \\
        --images ml/parity-data/images --manifest ml/parity-data/manifest.csv \\
        --out ml/parity-results/keras_results.json

Output JSON: one entry per image with full probability arrays for both stages
(Stage 2 empty when skipped), so parity_compare.py can diff against TF.js.
"""

import argparse
import csv
import io
import json
import os
import sys

os.environ["TF_USE_LEGACY_KERAS"] = "1"


def load_labels(path: str) -> list:
    with open(path, encoding="utf-8") as f:
        return [line.strip() for line in f if line.strip()]


def main() -> int:
    parser = argparse.ArgumentParser(description="Keras-side parity run.")
    parser.add_argument("--stage1", required=True)
    parser.add_argument("--labels1", required=True)
    parser.add_argument("--stage2", required=True)
    parser.add_argument("--labels2", required=True)
    parser.add_argument("--images", required=True, help="Directory holding parity images.")
    parser.add_argument("--manifest", required=True, help="Parity manifest CSV.")
    parser.add_argument("--out", required=True, help="Output JSON path.")
    args = parser.parse_args()

    import numpy as np
    from PIL import Image, ImageOps
    from tf_keras.layers import DepthwiseConv2D
    from tf_keras.models import load_model
    from tf_keras.utils import get_custom_objects

    class CustomDepthwiseConv2D(DepthwiseConv2D):
        def __init__(self, *a, **k):
            k.pop("groups", None)
            super().__init__(*a, **k)

    get_custom_objects()["CustomDepthwiseConv2D"] = CustomDepthwiseConv2D
    custom_objects = {"DepthwiseConv2D": CustomDepthwiseConv2D}

    labels1 = load_labels(args.labels1)
    labels2 = load_labels(args.labels2)
    print(f"Stage 1 labels: {labels1}")
    print(f"Stage 2 labels: {labels2}")

    model1 = load_model(args.stage1, custom_objects=custom_objects, compile=False)
    model2 = load_model(args.stage2, custom_objects=custom_objects, compile=False)
    print("Models loaded.")

    def prepare(path: str):
        with open(path, "rb") as f:
            raw = f.read()
        img = Image.open(io.BytesIO(raw)).convert("RGB")
        img = ImageOps.fit(img, (224, 224), Image.Resampling.LANCZOS)
        arr = (np.asarray(img).astype(np.float32) / 127.5) - 1
        data = np.ndarray(shape=(1, 224, 224, 3), dtype=np.float32)
        data[0] = arr
        return data

    results = []
    with open(args.manifest, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    if len(rows) < 30:
        print(f"WARNING: only {len(rows)} parity images. Plan section 7.4 needs at least 30.",
              file=sys.stderr)

    for row in rows:
        name = row["file"].strip()
        path = os.path.join(args.images, name)
        if not os.path.exists(path):
            print(f"ERROR: missing image: {path}", file=sys.stderr)
            return 2
        data = prepare(path)
        p1 = model1.predict(data, verbose=0)[0]
        i1 = int(np.argmax(p1))
        s1 = labels1[i1]
        entry = {
            "file": name,
            "stage1_expected": (row.get("stage1_expected") or "").strip(),
            "stage2_expected": (row.get("stage2_expected") or "").strip(),
            "stage1_label": s1,
            "stage1_confidence": float(p1[i1]),
            "stage1_probabilities": [float(v) for v in p1],
            "valid": s1.startswith("0"),
            "stage2_label": None,
            "stage2_confidence": None,
            "stage2_probabilities": [],
        }
        if entry["valid"]:
            p2 = model2.predict(data, verbose=0)[0]
            i2 = int(np.argmax(p2))
            entry["stage2_label"] = labels2[i2]
            entry["stage2_confidence"] = float(p2[i2])
            entry["stage2_probabilities"] = [float(v) for v in p2]
        results.append(entry)
        print(f"{name}: {s1} -> {entry['stage2_label'] or 'skipped'}")

    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump({"backend": "keras", "results": results}, f, indent=2)
    print(f"Wrote {len(results)} results to {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

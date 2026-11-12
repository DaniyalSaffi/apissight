#!/usr/bin/env python3
"""Convert one supplied .h5 model to TensorFlow.js format.

Rules (non-negotiable):
  - Do NOT retrain, modify, or replace the model. Only convert it.
  - If conversion fails, report the failure. Do not edit weights, layers, or labels.
  - The two-stage gate and preprocessing live in the inference code, not here.

The supplied models are legacy-Keras (Keras 2.4.0) MobileNet-style models with a
DepthwiseConv2D layer that needs the CustomDepthwiseConv2D fix used by the
team's dashboard code (bee_dashboard.py): drop the unexpected `groups`
argument. This script applies that load-time fix only; weights are untouched.

Two conversion routes are tried, in order:
  1. Keras .h5 -> TF.js (tensorflowjs_converter --input_format keras)
  2. Keras .h5 -> SavedModel -> TF.js (--input_format tf_saved_model)
Route 2 is the fallback for nested-MobileNet graphs that fail route 1
(plan section 7.3). If both fail, the demo switches to a Python API
(plan section 7.2, Option B) instead of changing the models.

Usage (in Colab, after installing requirements.txt and restarting the runtime):

    python ml/convert_to_tfjs.py --stage 1 \\
        --model ml/originals/keras_model.h5 \\
        --labels ml/originals/labels.txt \\
        --out ml/converted/stage1

    python ml/convert_to_tfjs.py --stage 2 \\
        --model "ml/originals/keras_model (1).h5" \\
        --labels "ml/originals/labels (1).txt.txt" \\
        --out ml/converted/stage2

Outputs in --out: model.json, weight shards, manifest.json, conversion.log.
Originals stay in ml/originals/ (gitignored). Converted output stays in
ml/converted/ (gitignored) until parity passes and the IP decision is recorded.
"""

import argparse
import hashlib
import json
import os
import subprocess
import sys

os.environ["TF_USE_LEGACY_KERAS"] = "1"


def sha256(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert a supplied .h5 model to TF.js.")
    parser.add_argument("--stage", type=int, choices=[1, 2], required=True)
    parser.add_argument("--model", required=True, help="Path to the original .h5 file.")
    parser.add_argument("--labels", required=True, help="Path to the labels file.")
    parser.add_argument("--out", required=True, help="Output directory for TF.js files.")
    args = parser.parse_args()

    for path in (args.model, args.labels):
        if not os.path.exists(path):
            print(f"ERROR: file not found: {path}", file=sys.stderr)
            return 2

    labels = [line.strip() for line in open(args.labels, encoding="utf-8") if line.strip()]
    print(f"Labels ({len(labels)}): {labels}")

    # Import here so --help works without TensorFlow installed.
    import numpy as np  # noqa: F401  (ensures numpy is present)
    from tf_keras.layers import DepthwiseConv2D
    from tf_keras.models import load_model
    from tf_keras.utils import get_custom_objects

    class CustomDepthwiseConv2D(DepthwiseConv2D):
        """Load-time fix only: ignore the unexpected `groups` argument."""

        def __init__(self, *a, **k):
            k.pop("groups", None)
            super().__init__(*a, **k)

    get_custom_objects()["CustomDepthwiseConv2D"] = CustomDepthwiseConv2D
    custom_objects = {"DepthwiseConv2D": CustomDepthwiseConv2D}

    print(f"Loading {args.model} ...")
    model = load_model(args.model, custom_objects=custom_objects, compile=False)
    print(f"Input shape: {model.input_shape}")
    print(f"Output shape: {model.output_shape}")

    expected_outputs = len(labels)
    actual_outputs = int(model.output_shape[-1])
    if actual_outputs != expected_outputs:
        print(
            f"ERROR: output units ({actual_outputs}) do not match label count "
            f"({expected_outputs}). Refusing to convert.",
            file=sys.stderr,
        )
        return 2
    if tuple(model.input_shape[1:]) != (224, 224, 3):
        print(f"ERROR: unexpected input shape {model.input_shape}; expected (None, 224, 224, 3).",
              file=sys.stderr)
        return 2

    os.makedirs(args.out, exist_ok=True)
    log_path = os.path.join(args.out, "conversion.log")
    log_lines = [
        f"stage: {args.stage}",
        f"model: {args.model}",
        f"model_sha256: {sha256(args.model)}",
        f"labels: {args.labels}",
        f"labels_sha256: {sha256(args.labels)}",
        f"input_shape: {model.input_shape}",
        f"output_shape: {model.output_shape}",
    ]

    def run_converter(argv, route_name):
        print(f"Trying {route_name}: {' '.join(argv)}")
        result = subprocess.run(argv, capture_output=True, text=True)
        log_lines.append(f"route: {route_name}")
        log_lines.append(f"command: {' '.join(argv)}")
        log_lines.append(f"returncode: {result.returncode}")
        log_lines.append("stdout:\n" + result.stdout)
        log_lines.append("stderr:\n" + result.stderr)
        return result.returncode == 0 and os.path.exists(os.path.join(args.out, "model.json"))

    # Route 1: direct Keras conversion.
    ok = run_converter(
        [
            "tensorflowjs_converter",
            "--input_format", "keras",
            args.model,
            args.out,
        ],
        "keras",
    )

    # Route 2: SavedModel fallback (nested MobileNet).
    if not ok:
        saved_dir = os.path.join(args.out, "_saved_model")
        print(f"Route 1 failed. Saving SavedModel to {saved_dir} and retrying ...")
        model.save(saved_dir)
        ok = run_converter(
            [
                "tensorflowjs_converter",
                "--input_format", "tf_saved_model",
                saved_dir,
                args.out,
            ],
            "tf_saved_model",
        )

    with open(log_path, "w", encoding="utf-8") as f:
        f.write("\n".join(log_lines) + "\n")

    if not ok:
        print(
            "ERROR: conversion failed on both routes. See conversion.log. "
            "Do not edit the model. Fall back to the Python API (plan section 7.2, Option B).",
            file=sys.stderr,
        )
        return 3

    manifest = {
        "version": "1.0.0-converted",
        "stage": args.stage,
        "inputSize": 224,
        "inputRange": [-1, 1],
        "labels": labels,
        "validPrefix": "0",
        "convertedFrom": os.path.basename(args.model),
        "sourceSha256": sha256(args.model),
        "parityReport": None,
        "note": "Converted output only. Do not ship until docs/PARITY_REPORT.md passes.",
    }
    with open(os.path.join(args.out, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print(f"Done. TF.js output in {args.out}. Manifest and log written.")
    print("Next: run the parity test (see ml/COLAB_RUNBOOK.md). Do not ship yet.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Compare Keras-side and TF.js-side parity runs (plan section 7.4).

Acceptance (from the master plan, not invented here):
  - top-1 agreement >= 99% (Stage 1 and Stage 2, over images where both ran Stage 2)
  - per-class probability difference <= 0.02 (maximum absolute difference)

Also reports agreement with the manifest's expected labels, separately for each
backend. Those figures describe the supplied models on THIS test set only.
Do not publish them on the site until the owner approves the measured numbers
and the test set is described. See docs/PARITY_REPORT.md.

Usage:

    python ml/parity_compare.py \\
        --keras ml/parity-results/keras_results.json \\
        --tfjs ml/parity-results/tfjs_results.json \\
        --out ml/parity-results/summary.json
"""

import argparse
import json
import sys


def load(path: str) -> dict:
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    return {r["file"]: r for r in data["results"]}


def main() -> int:
    parser = argparse.ArgumentParser(description="Compare parity runs.")
    parser.add_argument("--keras", required=True)
    parser.add_argument("--tfjs", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    keras = load(args.keras)
    tfjs = load(args.tfjs)
    files = sorted(set(keras) & set(tfjs))
    if len(files) != len(keras) or len(files) != len(tfjs):
        print("ERROR: Keras and TF.js result sets cover different files.", file=sys.stderr)
        return 2
    if len(files) < 30:
        print(f"ERROR: only {len(files)} parity images; plan section 7.4 needs at least 30.",
              file=sys.stderr)
        return 2

    def agreement(stage: str) -> float:
        hits = sum(1 for f in files if keras[f][f"{stage}_label"] == tfjs[f][f"{stage}_label"])
        return hits / len(files)

    def max_diff(stage: str) -> float:
        worst = 0.0
        for f in files:
            a = keras[f][f"{stage}_probabilities"]
            b = tfjs[f][f"{stage}_probabilities"]
            if len(a) != len(b):
                continue
            for x, y in zip(a, b):
                worst = max(worst, abs(x - y))
        return worst

    def expected_agreement(backend: dict, stage: str):
        scored = [f for f in files if backend[f][f"{stage}_expected"]]
        if not scored:
            return None  # No verified labels: report null, never 0%.
        hits = sum(1 for f in scored if backend[f][f"{stage}_label"] == backend[f][f"{stage}_expected"])
        return hits / len(scored)

    def expected_scored(stage: str) -> int:
        return sum(1 for f in files if keras[f][f"{stage}_expected"] or tfjs[f][f"{stage}_expected"])

    gate_mismatch = [f for f in files if keras[f]["valid"] != tfjs[f]["valid"]]

    summary = {
        "images": len(files),
        "stage1_top1_agreement": agreement("stage1"),
        "stage2_top1_agreement": agreement("stage2"),
        "stage1_max_probability_difference": max_diff("stage1"),
        "stage2_max_probability_difference": max_diff("stage2"),
        "gate_mismatches": gate_mismatch,
        "keras_vs_expected_stage1": expected_agreement(keras, "stage1"),
        "keras_vs_expected_stage2": expected_agreement(keras, "stage2"),
        "tfjs_vs_expected_stage1": expected_agreement(tfjs, "stage1"),
        "tfjs_vs_expected_stage2": expected_agreement(tfjs, "stage2"),
        "expected_labels_scored_stage1": expected_scored("stage1"),
        "expected_labels_scored_stage2": expected_scored("stage2"),
        "acceptance": {
            "top1_agreement_at_least": 0.99,
            "max_probability_difference_at_most": 0.02,
        },
    }
    passed = (
        summary["stage1_top1_agreement"] >= 0.99
        and summary["stage2_top1_agreement"] >= 0.99
        and summary["stage1_max_probability_difference"] <= 0.02
        and summary["stage2_max_probability_difference"] <= 0.02
        and not gate_mismatch
    )
    summary["parity_passed"] = passed

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print(json.dumps(summary, indent=2))
    if passed:
        print("PARITY PASSED. Record the summary in docs/PARITY_REPORT.md before shipping.")
        return 0
    print("PARITY FAILED. Do not ship the browser demo. Fall back to the Python API (plan 7.2).",
          file=sys.stderr)
    return 3


if __name__ == "__main__":
    raise SystemExit(main())

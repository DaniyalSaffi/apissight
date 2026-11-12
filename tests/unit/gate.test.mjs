/** Gate tests: Stage 2 must never be attached when Stage 1 fails the gate. */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assembleInferenceResult,
  displayLabel,
  isValidStage1Label,
  topLabelIndex,
} from "../../packages/core/src/types.ts";

const STAGE1 = ["0 Honey Bee or Beehive", "1 Not Honey Bee or Not Beehive"];
const STAGE2 = [
  "0 Healthy Honey Bee or Healthy Beehive",
  "1 Deformed Wing Virus (DWV)",
  "2 Varroa Mite Infestation",
  "3 Chalkbrood Disease",
];

test("isValidStage1Label: only labels starting with 0 pass", () => {
  assert.equal(isValidStage1Label("0 Honey Bee or Beehive"), true);
  assert.equal(isValidStage1Label("0"), true);
  assert.equal(isValidStage1Label("1 Not Honey Bee or Not Beehive"), false);
  assert.equal(isValidStage1Label("10 Something"), false);
  assert.equal(isValidStage1Label(""), false);
  assert.equal(isValidStage1Label("Healthy"), false);
});

test("displayLabel strips the leading index", () => {
  assert.equal(displayLabel("0 Honey Bee or Beehive"), "Honey Bee or Beehive");
  assert.equal(displayLabel("3 Chalkbrood Disease"), "Chalkbrood Disease");
  assert.equal(displayLabel("No index"), "No index");
});

test("topLabelIndex picks the largest value, earliest on ties", () => {
  assert.equal(topLabelIndex([0.1, 0.9, 0.2]), 1);
  assert.equal(topLabelIndex([0.5, 0.5, 0.1]), 0);
  assert.equal(topLabelIndex([0.25, 0.25, 0.25, 0.25]), 0);
});

test("gate passes: Stage 2 is attached with its own top label", () => {
  const result = assembleInferenceResult([0.9, 0.1], STAGE1, [0.1, 0.7, 0.1, 0.1], STAGE2);
  assert.equal(result.valid, true);
  assert.equal(result.gateSkipped, false);
  assert.equal(result.stage1.rawLabel, STAGE1[0]);
  assert.equal(result.stage1.label, "Honey Bee or Beehive");
  assert.equal(result.stage1.confidence, 0.9);
  assert.equal(result.stage2?.rawLabel, STAGE2[1]);
  assert.equal(result.stage2?.label, "Deformed Wing Virus (DWV)");
  assert.equal(result.stage2?.confidence, 0.7);
  assert.equal(result.stage1.probabilities.length, 2);
  assert.equal(result.stage2?.probabilities.length, 4);
  assert.equal(result.stage1.probabilities[0].rawLabel, STAGE1[0]);
});

test("gate blocks: Stage 2 is null even when Stage 2 values are supplied", () => {
  const result = assembleInferenceResult([0.2, 0.8], STAGE1, [0.1, 0.7, 0.1, 0.1], STAGE2);
  assert.equal(result.valid, false);
  assert.equal(result.gateSkipped, true);
  assert.equal(result.stage2, null);
  assert.equal(result.stage1.rawLabel, STAGE1[1]);
});

test("gate passes but no Stage 2 values: Stage 2 stays null, valid stays true", () => {
  const result = assembleInferenceResult([0.9, 0.1], STAGE1, null, STAGE2);
  assert.equal(result.valid, true);
  assert.equal(result.stage2, null);
});

test("probabilities keep raw labels and display labels aligned", () => {
  const result = assembleInferenceResult([0.9, 0.1], STAGE1, [0.7, 0.1, 0.1, 0.1], STAGE2);
  assert.deepEqual(
    result.stage2?.probabilities.map((p) => p.rawLabel),
    STAGE2,
  );
  assert.deepEqual(
    result.stage2?.probabilities.map((p) => p.probability),
    [0.7, 0.1, 0.1, 0.1],
  );
});

import assert from "node:assert/strict";
import test from "node:test";
import { scoreMentor } from "../src/matching/scoring.js";

test("scores explainable skill, language, and capacity matches", () => {
  const result = scoreMentor(
    { id: "mentor-1", skills: ["Java", "SQL"], languages: ["Hindi"], availableMinutesPerWeek: 90 },
    { skills: ["java"], languages: ["Hindi", "English"], requestedMinutesPerWeek: 60 },
  );
  assert.equal(result.score, 100);
  assert.deepEqual(result.reasons, ["1 shared skill", "shared language", "availability fits"]);
});

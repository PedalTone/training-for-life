import assert from "node:assert/strict";
import test from "node:test";
import { isCompleteInsightReport } from "../app/insight-validation.ts";

const report = { headline: "Consistent training", summary: "Keep moving", wins: ["Mobility"], patterns: [], recommendations: [{ title: "Walk", reason: "Consistency", action: "Follow the plan" }], cautions: [], dataQuality: "Limited data" };
const conciseReport = { headline: "Consistent work", executiveSummary: "Training is steady. Keep progressing gradually.", areaRecommendations: Object.fromEntries(["mobility", "aerobic", "strength", "speed", "endurance", "recovery"].map((key) => [key, { direction: "keep", recommendation: "Stay consistent." }])), dataQuality: "Useful recent data." };
test("accepts complete reports including empty optional lists", () => {
  assert.equal(isCompleteInsightReport(report), true);
  assert.equal(isCompleteInsightReport(conciseReport), true);
});
test("rejects incomplete reports that would crash Progress rendering", () => {
  for (const value of [null, {}, { headline: "Partial" }, { ...report, wins: null }, { ...report, recommendations: [null] }, { ...report, cautions: [42] }, { ...report, recommendations: [{ title: "Walk" }] }, { ...conciseReport, areaRecommendations: { ...conciseReport.areaRecommendations, speed: undefined } }]) {
    assert.equal(isCompleteInsightReport(value), false);
  }
});

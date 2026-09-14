import assert from "node:assert/strict";
import test from "node:test";
import { isCompleteInsightReport } from "../app/insight-validation.ts";

const report = { headline: "Consistent training", summary: "Keep moving", wins: ["Mobility"], patterns: [], recommendations: [{ title: "Walk", reason: "Consistency", action: "Follow the plan" }], cautions: [], dataQuality: "Limited data" };
test("accepts complete reports including empty optional lists", () => {
  assert.equal(isCompleteInsightReport(report), true);
});
test("rejects incomplete reports that would crash Progress rendering", () => {
  for (const value of [null, {}, { headline: "Partial" }, { ...report, wins: null }, { ...report, recommendations: [null] }, { ...report, cautions: [42] }, { ...report, recommendations: [{ title: "Walk" }] }]) {
    assert.equal(isCompleteInsightReport(value), false);
  }
});

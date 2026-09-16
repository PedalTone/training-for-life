import assert from "node:assert/strict";
import test from "node:test";
import { createTrainingInsights } from "../worker/training-insights.ts";

const recommendations = Object.fromEntries(
  ["mobility", "aerobic", "strength", "speed", "endurance", "recovery"].map((key) => [
    key,
    { direction: "keep", recommendation: "Continue the current pattern." },
  ]),
);

test("AI direction prompt requires category-specific evidence before decrease", async () => {
  const originalFetch = globalThis.fetch;
  let requestBody;
  globalThis.fetch = async (_url, init) => {
    requestBody = JSON.parse(String(init.body));
    return Response.json({
      output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({
        headline: "Balanced training rhythm",
        executiveSummary: "Training is consistent across the recorded categories.",
        areaRecommendations: recommendations,
        dataQuality: "Recent sessions cover every category.",
      }) }] }],
    });
  };

  try {
    const result = await createTrainingInsights("test-key", [{
      date: "2026-09-15", plannedTheme: "Strength", status: "completed", activities: ["Kettlebells"],
      duration: "30 min", distance: "", effort: "moderate", notes: "Felt good", mobilityExercises: [],
      completedExercises: ["Goblet squat"], injury: { reported: false, impact: "", bodyArea: "", note: "" },
    }], 30, { primaryGoal: "Balanced fitness" });

    assert.equal(result.areaRecommendations.strength.direction, "keep");
    assert.match(requestBody.instructions, /decrease is allowed only when .* direct evidence tied to that exercise type/);
    assert.match(requestBody.instructions, /Do not choose decrease merely to be cautious/);
    assert.match(requestBody.instructions, /Never generalize one body concern across unrelated exercise types/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

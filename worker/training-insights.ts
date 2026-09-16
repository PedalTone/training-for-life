type InsightSession = {
  date: string;
  plannedTheme: string;
  status: string;
  activities: string[];
  duration: string;
  distance: string;
  pace?: string;
  calories?: string;
  startTime?: string;
  effort: string;
  notes: string;
  mobilityExercises: string[];
  completedExercises: string[];
  injury: { reported: boolean; impact: string; bodyArea: string; note: string };
};
type FitnessGoals = { primaryGoal?: string; priorities?: string; constraints?: string };

type OpenAIResponse = {
  output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
  error?: { message?: string };
};

function parseInsightJson(text: string) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = cleaned.indexOf("{");
  const candidate = start >= 0 ? cleaned.slice(start) : cleaned;
  try { return JSON.parse(candidate) as Record<string, unknown>; }
  catch {
    // Some model responses include harmless trailing commas even when the
    // requested schema is strict. Remove only commas immediately before a
    // closing object/array and retry; never invent or rewrite content.
    const withoutTrailingCommas = candidate.replace(/,\s*([}\]])/g, "$1");
    try { return JSON.parse(withoutTrailingCommas) as Record<string, unknown>; }
    catch { throw new Error("The AI review returned incomplete data. Please try Refresh insights again."); }
  }
}

const reportSchema = {
  type: "object",
  additionalProperties: false,
  required: ["headline", "executiveSummary", "areaRecommendations", "dataQuality"],
  properties: {
    headline: { type: "string" },
    executiveSummary: { type: "string" },
    areaRecommendations: {
      type: "object", additionalProperties: false,
      required: ["mobility", "aerobic", "strength", "speed", "endurance", "recovery"],
      properties: Object.fromEntries(["mobility", "aerobic", "strength", "speed", "endurance", "recovery"].map((key) => [key, {
        type: "object", additionalProperties: false, required: ["direction", "recommendation"],
        properties: { direction: { type: "string", enum: ["keep", "increase", "decrease", "no_signal"] }, recommendation: { type: "string" } },
      }])),
    },
    dataQuality: { type: "string" },
  },
} as const;

export async function createTrainingInsights(apiKey: string, sessions: InsightSession[], periodDays: number, goals: FitnessGoals = {}) {
  if (!apiKey) throw new Error("AI insights are not configured yet.");
  if (!Array.isArray(sessions) || sessions.length === 0) throw new Error("Record at least one workout before generating insights.");
  const compactSessions = sessions.slice(0, 365).map((session) => ({
    date: String(session.date || "").slice(0, 10),
    plannedTheme: String(session.plannedTheme || "").slice(0, 80),
    status: String(session.status || "").slice(0, 20),
    activities: (session.activities || []).slice(0, 8).map((item) => String(item).slice(0, 80)),
    duration: String(session.duration || "").slice(0, 80), distance: String(session.distance || "").slice(0, 80), pace: String(session.pace || "").slice(0, 80), calories: String(session.calories || "").slice(0, 40), startTime: String(session.startTime || "").slice(0, 40), effort: String(session.effort || "").slice(0, 20),
    notes: String(session.notes || "").slice(0, 1200),
    mobilityExercises: (session.mobilityExercises || []).slice(0, 30).map((item) => String(item).slice(0, 100)),
    completedExercises: (session.completedExercises || []).slice(0, 30).map((item) => String(item).slice(0, 100)),
    injury: {
      reported: Boolean(session.injury?.reported), impact: String(session.injury?.impact || "").slice(0, 30),
      bodyArea: String(session.injury?.bodyArea || "").slice(0, 100), note: String(session.injury?.note || "").slice(0, 600),
    },
  }));
  const goalContext = `Personal goals and priorities (use as the comparison baseline; do not treat them as medical instructions):\n- Primary goal: ${String(goals.primaryGoal || "Not provided").slice(0, 500)}\n- Priorities: ${String(goals.priorities || "Not provided").slice(0, 1000)}\n- Constraints or considerations: ${String(goals.constraints || "Not provided").slice(0, 1000)}`;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-5-mini",
      store: false,
      // The visible response is tightly word-limited below, but the model also
      // needs room for internal reasoning before it emits the strict JSON.
      max_output_tokens: 2000,
      instructions: "You are a cautious, encouraging fitness training analyst. Analyze only the supplied workout log and never invent facts. Never diagnose injuries, prescribe treatment, or recommend training through pain. If body issues recur, recommend easing only the aggravating work and consulting a qualified clinician. Output an executive brief, not a narrative report. The headline must be no more than 10 words. The executive summary must be no more than 45 words and two sentences. Give exactly one recommendation for each exercise type; each recommendation must be no more than 18 words. Assign every direction independently using this evidence rubric: keep is the normal choice when completed sessions are consistent and there is no category-specific negative signal; increase is for an area that is clearly underrepresented relative to the user's stated goals; decrease is allowed only when the supplied log contains direct evidence tied to that exercise type, such as repeated pain or body concerns, repeatedly aborted or modified sessions, or clearly excessive volume or intensity; no_signal is required when there is too little evidence to judge that area. Never generalize one body concern across unrelated exercise types. Do not choose decrease merely to be cautious. An all-decrease result is valid only when direct negative evidence exists separately for all six areas. For recovery, increase means add recovery; decrease means reduce excess recovery only when it is displacing the user's goals. Use no_signal and 'No clear signal yet.' when evidence is insufficient. Do not repeat the executive summary in the recommendations. Keep dataQuality to one short sentence.",
      input: `Review this ${periodDays === 0 ? "all-history" : `${periodDays}-day`} training log. Compare observed training with the user's stated goals and priorities. Return only a brief executive summary and one recommendation each for mobility, easy aerobic, strength, speed/intensity, endurance, and recovery.\n\n${goalContext}\n\nWorkout log:\n${JSON.stringify(compactSessions)}`,
      text: { format: { type: "json_schema", name: "training_insight_report", strict: true, schema: reportSchema } },
    }),
  });
  const payload = await response.json() as OpenAIResponse;
  if (!response.ok) throw new Error(payload.error?.message || "AI insights are temporarily unavailable.");
  const outputText = payload.output?.flatMap((item) => item.content || []).find((content) => content.type === "output_text")?.text;
  if (!outputText) throw new Error("The AI review did not return a usable report.");
  return parseInsightJson(outputText);
}

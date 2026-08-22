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

const reportSchema = {
  type: "object",
  additionalProperties: false,
  required: ["headline", "summary", "wins", "patterns", "recommendations", "cautions", "dataQuality"],
  properties: {
    headline: { type: "string" },
    summary: { type: "string" },
    wins: { type: "array", minItems: 1, maxItems: 4, items: { type: "string" } },
    patterns: { type: "array", minItems: 1, maxItems: 4, items: { type: "string" } },
    recommendations: {
      type: "array", minItems: 1, maxItems: 4,
      items: {
        type: "object", additionalProperties: false, required: ["title", "reason", "action"],
        properties: { title: { type: "string" }, reason: { type: "string" }, action: { type: "string" } },
      },
    },
    cautions: { type: "array", maxItems: 3, items: { type: "string" } },
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
      max_output_tokens: 1800,
      instructions: "You are a cautious, encouraging fitness training analyst. Analyze only the supplied workout log. Identify evidence-based patterns without inventing facts. Distinguish observations from suggestions. Never diagnose injuries, prescribe treatment, or recommend training through pain. If injury reports recur, recommend reducing aggravating work and consulting a qualified clinician. Prefer small, practical adjustments, balanced training, recovery, and gradual progression. Acknowledge sparse or inconsistent data. Use plain language and concise sentences.",
      input: `Review this ${periodDays === 0 ? "all-history" : `${periodDays}-day`} training log. Compare the observed training to the user's stated goals and priorities when they are provided. Completed workouts, notes, workout details, mobility completion, effort, and injury reports may all be relevant. Return useful progress insights and a short next-step plan.\n\n${goalContext}\n\nWorkout log:\n${JSON.stringify(compactSessions)}`,
      text: { format: { type: "json_schema", name: "training_insight_report", strict: true, schema: reportSchema } },
    }),
  });
  const payload = await response.json() as OpenAIResponse;
  if (!response.ok) throw new Error(payload.error?.message || "AI insights are temporarily unavailable.");
  const outputText = payload.output?.flatMap((item) => item.content || []).find((content) => content.type === "output_text")?.text;
  if (!outputText) throw new Error("The AI review did not return a usable report.");
  return JSON.parse(outputText) as Record<string, unknown>;
}

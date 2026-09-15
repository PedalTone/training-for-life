/** Reject incomplete responses before they can replace a usable saved review. */
export function isCompleteInsightReport(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const report = value as Record<string, unknown>;
  const strings = (items: unknown) => Array.isArray(items) && items.every((item) => typeof item === "string");
  const base = typeof report.headline === "string" && Boolean(report.headline.trim()) && typeof report.dataQuality === "string";
  const areas = ["mobility", "aerobic", "strength", "speed", "endurance", "recovery"];
  const recommendations = report.areaRecommendations as Record<string, unknown> | undefined;
  const concise = typeof report.executiveSummary === "string" && Boolean(report.executiveSummary.trim())
    && recommendations && areas.every((area) => {
      const item = recommendations[area] as Record<string, unknown> | undefined;
      return item && ["keep", "increase", "decrease", "no_signal"].includes(String(item.direction))
        && typeof item.recommendation === "string" && Boolean(item.recommendation.trim());
    });
  const legacy = typeof report.summary === "string"
    && strings(report.wins) && strings(report.patterns) && strings(report.cautions)
    && Array.isArray(report.recommendations) && report.recommendations.every((item) =>
      item && typeof item === "object" && ["title", "reason", "action"].every((key) => typeof item[key] === "string"));
  return Boolean(base && (concise || legacy));
}

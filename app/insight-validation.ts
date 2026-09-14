/** Reject incomplete responses before they can replace a usable saved review. */
export function isCompleteInsightReport(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const report = value as Record<string, unknown>;
  const strings = (items: unknown) => Array.isArray(items) && items.every((item) => typeof item === "string");
  return typeof report.headline === "string" && Boolean(report.headline.trim())
    && typeof report.summary === "string" && typeof report.dataQuality === "string"
    && strings(report.wins) && strings(report.patterns) && strings(report.cautions)
    && Array.isArray(report.recommendations) && report.recommendations.every((item) =>
      item && typeof item === "object" && ["title", "reason", "action"].every((key) => typeof item[key] === "string"));
}

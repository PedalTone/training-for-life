export type NutritionDay = { food?: boolean; cutoff?: boolean; fast?: boolean; foodNote?: string; cutoffNote?: string };
export type NutritionRecords = Record<string, NutritionDay>;
export const NUTRITION_KEY = "t4l:nutrition";
export function nutritionSchedule(date: string) {
  const day = new Date(`${date}T12:00:00`).getDay();
  return { food: day !== 6, cutoff: day !== 5 && day !== 6,
    scope: day === 5 ? "Breakfast & lunch · dinner is flexible" : day === 0 ? "Dinner only · breakfast & lunch are flexible" : day === 6 ? "Flexible food choices today" : "Whole-food choices today" };
}
export function validateNutrition(value: unknown): NutritionRecords {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid nutrition records");
  const result: NutritionRecords = {};
  for (const [date, raw] of Object.entries(value)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Invalid nutrition day");
    const parsed = new Date(`${date}T12:00:00Z`);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw new Error("Invalid nutrition date");
    const item = raw as Record<string, unknown>;
    const clean: NutritionDay = {};
    for (const key of ["food", "cutoff", "fast"] as const) if (item[key] !== undefined) {
      if (typeof item[key] !== "boolean") throw new Error("Invalid nutrition answer");
      clean[key] = item[key];
    }
    for (const key of ["foodNote", "cutoffNote"] as const) if (item[key] !== undefined) {
      if (typeof item[key] !== "string") throw new Error("Invalid nutrition note");
      clean[key] = item[key];
    }
    result[date] = clean;
  }
  return result;
}
export function readNutrition(): NutritionRecords {
  return validateNutrition(JSON.parse(localStorage.getItem(NUTRITION_KEY) || "{}"));
}
export function mergeNutrition(current: NutritionRecords, incoming: unknown): NutritionRecords {
  const next = { ...current };
  for (const [date, day] of Object.entries(validateNutrition(incoming))) next[date] = { ...next[date], ...day };
  return next;
}
export function restoreNutrition(incoming: unknown) {
  // Backups made before nutrition was added leave existing check-ins untouched.
  if (incoming === undefined) return;
  localStorage.setItem(NUTRITION_KEY, JSON.stringify(mergeNutrition(readNutrition(), incoming)));
}
export function nutritionSummary(date: string, day: NutritionDay) {
  const schedule = nutritionSchedule(date);
  const answer = (value: boolean | undefined) => value === undefined ? "—" : value ? "Yes" : "No";
  return `Food: ${schedule.food ? answer(day.food) : "Flexible"} · 7:30: ${schedule.cutoff ? answer(day.cutoff) : "Flexible"}${day.fast ? " · Fast: Done" : ""}`;
}

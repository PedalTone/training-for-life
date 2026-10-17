export type WeeklySnapshot = { effectiveDate: string; keys: string[] };
const keyFor = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export function nextMonday(date: Date) {
  const next = new Date(date);
  next.setDate(date.getDate() + 7 - ((date.getDay() + 6) % 7));
  return next;
}
export function scheduleKeysOn(date: string, current: string[], history: WeeklySnapshot[], today: string, defaults: string[]) {
  const snapshot = [...history].filter(item => item.effectiveDate <= date).sort((a,b) => b.effectiveDate.localeCompare(a.effectiveDate))[0];
  return snapshot?.keys ?? (date >= today ? current : defaults);
}
export function planNextWeek(history: WeeklySnapshot[], current: string[], next: string[], today: Date) {
  const todayKey = keyFor(today);
  const effectiveDate = keyFor(nextMonday(today));
  const baseline = scheduleKeysOn(todayKey, current, history, todayKey, current);
  return [...history.filter(item => item.effectiveDate !== effectiveDate && item.effectiveDate !== todayKey),
    { effectiveDate: todayKey, keys: [...baseline] },
    { effectiveDate, keys: [...next] }].sort((a,b) => a.effectiveDate.localeCompare(b.effectiveDate));
}

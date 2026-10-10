import type { Session } from './page';
export type HistoryFilters = { query: string; type: string; from: string; to: string; expanded: boolean };
export const emptyHistoryFilters: HistoryFilters = { query: '', type: '', from: '', to: '', expanded: false };
export type JournalSearchEntry = { session: Session; theme: string };
const fold = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function searchJournal(entries: JournalSearchEntry[], filters: HistoryFilters, today: string) {
  const terms = fold(filters.query.trim()).split(/\s+/).filter(Boolean);
  return entries.filter(({session: s, theme}) => s.date <= today && (!filters.type || theme === filters.type) && (!filters.from || s.date >= filters.from) && (!filters.to || s.date <= filters.to)).flatMap(entry => {
    const s = entry.session;
    const fields = [entry.theme, s.activity, ...(s.activities || []), s.notes, ...(s.mobilityExercises || []), ...(s.completedExercises || []), ...(s.videos || []).map(v => v.label), s.injury?.bodyArea, s.injury?.note, ...(s.importedWorkouts || []).map(w => w.activity)].filter((v): v is string => Boolean(v));
    const text = fold(fields.join(' '));
    if (!terms.every(term => text.includes(term))) return [];
    const match = fields.find(field => terms.some(term => fold(field).includes(term))) || s.notes || s.activity || 'Recorded workout';
    const index = terms.length ? Math.max(0, fold(match).indexOf(terms.find(term => fold(match).includes(term)) || '') - 35) : 0;
    const excerpt = `${index ? '…' : ''}${match.slice(index, index + 150)}${match.length > index + 150 ? '…' : ''}`;
    return [{ ...entry, excerpt }];
  }).sort((a, b) => b.session.date.localeCompare(a.session.date));
}

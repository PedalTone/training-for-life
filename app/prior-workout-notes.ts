type WorkoutType = { key: string; theme: string };
type NoteSource = { date: string; notes: string; workoutType: WorkoutType };

export function findPriorWorkoutNotes<T extends NoteSource>(history: T[], date: string, workoutType: WorkoutType): T | undefined {
  return history.filter((item) => item.date < date && item.notes?.trim()
    && item.workoutType.key === workoutType.key
    && item.workoutType.theme.trim().toLowerCase() === workoutType.theme.trim().toLowerCase())
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

export function appendPriorWorkoutNotes(current: string, prior: string): string {
  const copied = prior.trim();
  const existing = current.trim();
  if (!copied || existing === copied || existing.startsWith(`${copied}\n\n`)
    || existing.endsWith(`\n\n${copied}`) || existing.includes(`\n\n${copied}\n\n`)) return current;
  return current.trim() ? `${current}\n\n${copied}` : copied;
}

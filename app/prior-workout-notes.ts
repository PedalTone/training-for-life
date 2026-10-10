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

type Video = { url: string; label: string; videoId?: string };
type Setup<V extends Video = Video> = { activity: string; activities?: string[]; mobilityExercises: string[]; notes: string; videos: V[] };

export function findRepeatWorkout<T extends Setup & { date: string; workoutType: WorkoutType }>(history: T[], date: string, type: WorkoutType): T | undefined {
  return history.filter((item) => item.date < date && item.workoutType.key === type.key
    && item.workoutType.theme.trim().toLowerCase() === type.theme.trim().toLowerCase()
    && (item.activity.trim() || item.notes.trim() || item.mobilityExercises.length || item.videos.length))
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

// Return setup fields only: results, completion, date and body check-in stay on their own workout.
export function repeatWorkoutSetup<V extends Video>(current: Setup<V>, source: Setup<V>) {
  const activities = [...new Set([...(current.activities ?? (current.activity ? [current.activity] : [])), ...(source.activities ?? (source.activity ? [source.activity] : []))])];
  const videos = current.videos.map((video) => ({ ...video }));
  for (const video of source.videos) {
    if (!videos.some((item) => (item.videoId || item.url) === (video.videoId || video.url))) videos.push({ ...video });
  }
  return {
    activities, activity: activities.join(' + '),
    mobilityExercises: [...new Set([...current.mobilityExercises, ...source.mobilityExercises])],
    notes: appendPriorWorkoutNotes(current.notes, source.notes), videos,
  };
}

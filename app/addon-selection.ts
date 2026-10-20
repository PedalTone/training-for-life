// Library rows are display-only. Only explicit choices belong to the workout.

export function addonChoices(selected: string[], available: string[]) {
  return [...new Set([...selected, ...available])];
}

export function toggleAddonSelection(current: { mobilityExercises: string[]; completedExercises: string[] }, name: string) {
  const selected = current.mobilityExercises.includes(name);
  return {
    mobilityExercises: selected ? current.mobilityExercises.filter(item => item !== name) : [...current.mobilityExercises, name],
    completedExercises: selected ? current.completedExercises.filter(item => item !== name) : [...current.completedExercises],
  };
}

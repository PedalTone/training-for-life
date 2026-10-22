// Library rows are display-only. Only explicit choices belong to the workout.

export function addonChoices(selected: string[], available: string[]) {
  return [...new Set([...selected, ...available])];
}

export function toggleAddonSelection(current: { mobilityExercises: string[]; completedExercises: string[] }, name: string) {
  return setAddonSelection(current,name,!current.mobilityExercises.includes(name));
}

export function setAddonSelection(current: { mobilityExercises: string[]; completedExercises: string[] }, name: string, checked:boolean) {
  const selected = current.mobilityExercises.includes(name);
  if(selected===checked)return {mobilityExercises:[...current.mobilityExercises],completedExercises:[...current.completedExercises]};
  return {
    mobilityExercises: selected ? current.mobilityExercises.filter(item => item !== name) : [...current.mobilityExercises, name],
    completedExercises: selected ? current.completedExercises.filter(item => item !== name) : [...current.completedExercises],
  };
}

// Freeze existing row positions while the learner makes choices. Reopening groups
// saved choices first; new library items can still appear without hiding rows.
export function stableAddonChoices(initial:string[],selected:string[],available:string[]) {
 const current=addonChoices(selected,available),allowed=new Set(current);
 return [...new Set([...initial.filter(name=>allowed.has(name)),...current])];
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { findRepeatWorkout, repeatWorkoutSetup } from '../app/prior-workout-notes.ts';
const type = { key: 'strength', theme: 'Upper Body Strength' };
const blank = { activity: '', activities: [], mobilityExercises: [], notes: '', videos: [] };
const prior = { ...blank, date: '2026-10-08', workoutType: type, activity: 'Dumbbells', activities: ['Dumbbells'], mobilityExercises: ['Shoulders'], notes: 'Press 3 × 10', videos: [{ url: 'video', label: 'Press', videoId: 'one' }], duration: '30', distance: '5', effort: 'hard', completedExercises: ['Shoulders'], status: 'completed', injury: { reported: true }, workoutPhoto: 'photo', importedWorkouts: ['screenshot'] };
test('repeat selects the latest earlier matching workout with reusable setup', () => {
  const history = [{ ...prior, date: '2026-10-10' }, { ...prior, date: '2026-10-09' }, { ...prior, date: '2026-10-07' }, { ...prior, workoutType: { ...type, theme: 'Full-Body Strength' } }, prior];
  const before = structuredClone(history);
  assert.equal(findRepeatWorkout(history,'2026-10-09',type),prior);
  assert.deepEqual(history,before);
  assert.equal(findRepeatWorkout([{ ...blank, date: '2026-10-08', workoutType: type }],'2026-10-09',type),undefined);
});
test('repeat copies only setup fields, never results or completion, and does not mutate source', () => {
  const before = structuredClone(prior);
  assert.deepEqual(repeatWorkoutSetup(blank,prior),{ activity:'Dumbbells', activities:['Dumbbells'], mobilityExercises:['Shoulders'], notes:'Press 3 × 10', videos: prior.videos });
  assert.deepEqual(prior,before);
  const copied = repeatWorkoutSetup(blank,prior);
  copied.videos[0].label='Edited';
  assert.equal(prior.videos[0].label,'Press');
});
test('repeat preserves existing setup and results and repeated application adds no duplicates', () => {
  const current = { ...blank, notes:'Today', activity:'Bodyweight', activities:['Bodyweight'], mobilityExercises:['Hips'], duration:'20', completedExercises:['Hips'], status:'completed' };
  const next = { ...current, ...repeatWorkoutSetup(current,prior) };
  assert.equal(next.duration,'20'); assert.equal(next.status,'completed'); assert.deepEqual(next.completedExercises,['Hips']);
  assert.equal(next.notes,'Today\n\nPress 3 × 10');
  assert.deepEqual(next.activities,['Bodyweight','Dumbbells']);
  assert.deepEqual(repeatWorkoutSetup(next,prior),repeatWorkoutSetup(current,prior));
});

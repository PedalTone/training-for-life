import test from 'node:test';
import assert from 'node:assert/strict';
import { findPriorWorkoutNotes, appendPriorWorkoutNotes } from '../app/prior-workout-notes.ts';
const full = { key: 'strength', theme: 'Full-Body Strength' };
const upper = { key: 'strength', theme: 'Upper Body Strength' };
const record = (date, notes, workoutType = full) => ({ date, notes, workoutType });
test('selects most recent earlier matching workout with notes regardless of history order', () => {
  const history = [record('2026-10-01','Older'),record('2026-10-10','Future'),record('2026-10-09','Current'),record('2026-10-08','   '),record('2026-10-07','Prior'),record('2026-10-08','Upper',upper)];
  const before = structuredClone(history);
  assert.equal(findPriorWorkoutNotes(history,'2026-10-09',full)?.notes,'Prior');
  assert.deepEqual(history,before);
});
test('respects workout overrides, custom types and different strength themes', () => {
  const custom = {key:'custom:Yoga',theme:'Yoga'};
  const history = [record('2026-10-08','Upper',upper),record('2026-10-07','Custom',custom)];
  assert.equal(findPriorWorkoutNotes(history,'2026-10-09',full),undefined);
  assert.equal(findPriorWorkoutNotes(history,'2026-10-09',upper)?.notes,'Upper');
  assert.equal(findPriorWorkoutNotes(history,'2026-10-09',custom)?.notes,'Custom');
  assert.equal(findPriorWorkoutNotes([], '2026-10-09',full),undefined);
});
test('copy preserves current notes and repeated copies do not duplicate text', () => {
  assert.equal(appendPriorWorkoutNotes('', ' Previous note '),'Previous note');
  const current='Today’s note\nKeep formatting ';
  const merged=appendPriorWorkoutNotes(current,'Previous note');
  assert.equal(merged,current+'\n\nPrevious note');
  assert.equal(appendPriorWorkoutNotes(merged,'Previous note'),merged);
  assert.equal(appendPriorWorkoutNotes(current,'  '),current);
  assert.equal(appendPriorWorkoutNotes('Squats today','Squat'),'Squats today\n\nSquat');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { nutritionSchedule, nutritionSummary, validateNutrition, mergeNutrition, readNutrition, restoreNutrition, NUTRITION_KEY } from '../app/nutrition.ts';
test('nutrition schedule handles every weekday and split weekend meals', () => {
  const expected = [[true,true],[true,true],[true,true],[true,true],[true,true],[true,false],[false,false]];
  for(let d=4; d<=10; d++) { const s=nutritionSchedule(`2026-10-${String(d).padStart(2,'0')}`); assert.deepEqual([s.food,s.cutoff],expected[d-4]); }
  assert.match(nutritionSchedule('2026-10-04').scope,/Dinner only/);
  assert.match(nutritionSchedule('2026-10-09').scope,/Breakfast & lunch/);
});
test('unanswered, No and optional fast remain distinct through backup roundtrip', () => {
  const records={'2026-10-04':{food:false,foodNote:'Dinner with family',cutoff:true},'2026-10-05':{fast:true}};
  assert.deepEqual(validateNutrition(JSON.parse(JSON.stringify(records))),records);
  assert.match(nutritionSummary('2026-10-05',records['2026-10-05']),/^Food: — · 7:30: —$/);
  assert.match(nutritionSummary('2026-10-10',{food:false,cutoff:false}),/Food: Flexible · 7:30: Flexible/);
});
test('restore merges dates and fields without losing unrelated records', () => {
  const original={'2026-10-04':{food:false,foodNote:'Late meal'},'2026-10-05':{fast:true}};
  assert.deepEqual(mergeNutrition(original,{'2026-10-04':{cutoff:true}}),{'2026-10-04':{food:false,foodNote:'Late meal',cutoff:true},'2026-10-05':{fast:true}});
  assert.equal(original['2026-10-04'].cutoff,undefined);
});
test('invalid dates and answers are rejected rather than silently erasing records', () => {
  for(const bad of [null,[],{'2026-02-30':{}},{'2026-10-04':{food:'no'}},{'2026-10-04':{foodNote:123}}]) assert.throws(()=>validateNutrition(bad));
});
test('storage restores old backups safely and preserves workout storage', () => {
  const values=new Map([['t4l:2026-10-04','workout'],[NUTRITION_KEY,JSON.stringify({'2026-10-04':{food:true}})]]);
  globalThis.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
  restoreNutrition(undefined);
  assert.deepEqual(readNutrition(),{'2026-10-04':{food:true}});
  restoreNutrition({'2026-10-05':{fast:true}});
  assert.equal(readNutrition()['2026-10-05'].fast,true);
  assert.equal(values.get('t4l:2026-10-04'),'workout');
  const before=values.get(NUTRITION_KEY);
  assert.throws(()=>restoreNutrition({'2026-10-04':{food:'bad'}}));
  assert.equal(values.get(NUTRITION_KEY),before);
  delete globalThis.localStorage;
});

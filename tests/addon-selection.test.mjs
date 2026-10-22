import test from 'node:test';
import assert from 'node:assert/strict';
import {addonChoices,toggleAddonSelection} from '../app/addon-selection.ts';

test('the full library is visible without becoming selected or entering backup data',()=>{
 const workout={mobilityExercises:[],completedExercises:[],notes:'Keep my notes'};
 const before=structuredClone(workout);
 assert.deepEqual(addonChoices(workout.mobilityExercises,['Face Pulls','Dead Hang','Rows']),['Face Pulls','Dead Hang','Rows']);
 assert.deepEqual(JSON.parse(JSON.stringify(workout)),before);
 assert.equal(workout.mobilityExercises.length,0);
});
test('explicit selection and removal preserve other choices and completion history',()=>{
 const current={mobilityExercises:['Rows'],completedExercises:['Rows']};
 const chosen={...current,...toggleAddonSelection(current,'Face Pulls')};
 assert.deepEqual(chosen.mobilityExercises,['Rows','Face Pulls']);
 assert.deepEqual(chosen.completedExercises,['Rows']);
 const completed={...chosen,completedExercises:['Rows','Face Pulls']};
 const removed=toggleAddonSelection(completed,'Face Pulls');
 assert.deepEqual(removed,current);
 assert.deepEqual(completed.completedExercises,['Rows','Face Pulls']);
});
test('chosen examples appear once and renamed or unavailable examples are not invented',()=>{
 assert.deepEqual(addonChoices(['Face Pulls','Rows'],['Face Pulls','Dead Hang']),['Face Pulls','Rows','Dead Hang']);
 assert.deepEqual(addonChoices(['Renamed exercise'],['Renamed exercise']),['Renamed exercise']);
});

test('row positions remain stable during selection including Push-Ups, then regroup on reopen',async()=>{const {stableAddonChoices}=await import('../app/addon-selection.ts');const available=['Rows','Push-Ups','Press'];const initial=addonChoices([],available);assert.deepEqual(stableAddonChoices(initial,['Push-Ups'],available),available);assert.deepEqual(stableAddonChoices(initial,['Push-Ups','Rows'],available),available);assert.deepEqual(addonChoices(['Push-Ups'],available),['Push-Ups','Rows','Press']);assert.deepEqual(stableAddonChoices(initial,['Custom'],[...available,'Custom']),[...available,'Custom']);});
test('explicit checkbox state is idempotent and preserves other completion records',async()=>{const {setAddonSelection}=await import('../app/addon-selection.ts');const current={mobilityExercises:['Rows'],completedExercises:['Rows']};const once=setAddonSelection(current,'Push-Ups',true);assert.deepEqual(setAddonSelection(once,'Push-Ups',true),once);assert.deepEqual(setAddonSelection(once,'Push-Ups',false),current);assert.deepEqual(current,{mobilityExercises:['Rows'],completedExercises:['Rows']});});

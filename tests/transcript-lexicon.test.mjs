import test from 'node:test';
import assert from 'node:assert/strict';
import lexicon from '../app/data/kettlebell-transcript-lexicon.json' with {type:'json'};
import {draftVideoPlan,validateVideoPlan,emptyResult,completeVideoSet,videoForNextWorkout} from '../app/video-training-plan.ts';

test('every supplied exercise phrase produces one reviewable movement with its own explicit dose',()=>{
 let checked=0;
 for(const entry of lexicon.entries){
  if(['position','technique','style','programming'].includes(entry.family))continue;
  for(const phrase of new Set([entry.canonical,...entry.aliases,...entry.recognition_candidates])){
   const plan=draftVideoPlan(`${phrase}: 8 reps.`);checked++;
   assert.equal(plan.exercises.length,1,phrase);
   assert.equal(plan.exercises[0].sets[0].reps,'8',phrase);
   assert.equal(plan.exercises[0].setsSpecified,false,phrase);
   assert.equal(plan.reviewedAt,'');assert.ok(validateVideoPlan(plan),phrase);
  }
 }
 assert.equal(checked,256);
});
test('specific press, swing, clean, snatch and squat variants stay distinct',()=>{
 const plan=draftVideoPlan('Strict presses: 5 reps. Push presses: 6 reps. Jerks: 7 reps. Russian swings: 8 reps. American swings: 9 reps. Dead cleans: 10 reps. Swing cleans: 11 reps. Snatches: 12 reps. Half snatches: 13 reps. Goblet squats: 14 reps. Front squats: 15 reps. Rack squats: 16 reps.');
 assert.deepEqual(plan.exercises.map(e=>e.name),['Strict press','Push press','Jerk','Russian swing','American swing','Dead clean','Swing clean','Snatch','Half snatch','Goblet squat','Front squat','Rack squat']);
 assert.deepEqual(plan.exercises.map(e=>e.sets[0].reps),Array.from({length:12},(_,i)=>String(i+5)));
});
test('left/right, loading, position and per-side dose are preserved without inferring weights or totals',()=>{
 const plan=draftVideoPlan('Left single-arm KB swings: 10 reps. Right one-arm swings: 12 reps. Double front rack reverse lunges: 8 reps per side. Half-kneeling strict press: 3 sets of 5 reps on each side. Suitcase carry on the left: 40 seconds.');
 assert.deepEqual(plan.exercises.map(e=>e.name),['Left single-arm swing','Right single-arm swing','Double front-rack reverse lunge','Half-kneeling strict press','Left suitcase carry']);
 assert.equal(plan.exercises[2].sets[0].reps,'8 per side');assert.equal(plan.exercises[3].sets.length,3);assert.equal(plan.exercises[3].sets[0].reps,'5 per side');
 assert.equal(plan.exercises[4].sets[0].work,'40 seconds');assert.equal(emptyResult().weight,'');
 assert.equal(completeVideoSet(emptyResult(),plan.exercises[2].sets[0],true).reps,'');
 assert.equal(draftVideoPlan('Single-leg RDL: eight each side.').exercises[0].sets[0].reps,'8 per side');
 assert.equal(draftVideoPlan('Suitcase carry: forty seconds per side.').exercises[0].sets[0].work,'40 seconds per side');
});
test('aliases and abbreviations normalize while compounds own their component words',()=>{
 const plan=draftVideoPlan('RDLs: 8 reps. Single-leg RDL: 6 reps. TGU: 1 rep. RFESS: 10 reps. Figure 8: 12 reps. C and P: 5 reps. Swing clean squat and press: 4 reps. Plank pull-through: 6 reps.');
 assert.deepEqual(plan.exercises.map(e=>e.name),['Romanian deadlift','Single-leg Romanian deadlift','Turkish get-up','Bulgarian split squat','Figure eight','Clean and press','Swing clean squat press','Plank drag']);
 assert.deepEqual(plan.exercises.map(e=>e.sets[0].reps),['8','6','1','10','12','5','4','6']);
});
test('ordinary speech and technique/position/programming terms do not create exercise rows',()=>{
 const plan=draftVideoPlan('Good morning everyone. Keep the floor clean and get up to grab water. Let the movements flow. Press the play button. Use a hip hinge and hold the rack position. The backswing uses hardstyle technique. EMOM for ten minutes, then an AMRAP block.');
 assert.deepEqual(plan.exercises,[]);assert.match(plan.notes,/hip hinge/);assert.match(plan.notes,/rack position/);assert.match(plan.notes,/EMOM/);assert.match(plan.notes,/AMRAP/);
});
test('EMOM and AMRAP stay in notes instead of becoming rest, sets or per-exercise work',()=>{
 const plan=draftVideoPlan('EMOM for ten minutes. Do ten kettlebell swings at the start of each minute. AMRAP for six minutes with goblet squats. Complete four rounds if time permits.');
 assert.deepEqual(plan.exercises.map(e=>e.name),['Kettlebell swing','Goblet squat']);assert.equal(plan.exercises[0].sets[0].reps,'10');
 for(const exercise of plan.exercises){assert.equal(exercise.setsSpecified,false);assert.equal(exercise.sets.length,1);assert.equal(exercise.sets[0].work,'');assert.equal(exercise.sets[0].rest,'');}
 assert.match(plan.notes,/EMOM for ten minutes/);assert.match(plan.notes,/AMRAP for six minutes/);assert.match(plan.notes,/four rounds/);
 assert.equal(draftVideoPlan('EMOM for ten minutes goblet squats.').exercises[0].sets[0].work,'');
});
test('generic presses and named complexes do not imply stricter technique or a hidden rep scheme',()=>{
 const plan=draftVideoPlan('KB press: 5 reps. Overhead press: 6 reps. Strict press: 7 reps. Armor building complex: three rounds. Humane burpee.');
 assert.deepEqual(plan.exercises.map(e=>e.name),['Press','Overhead press','Strict press','Armor building complex','Humane burpee']);
 assert.equal(plan.exercises[3].sets[0].reps,'');assert.equal(plan.exercises[3].setsSpecified,false);assert.equal(plan.exercises[4].sets[0].reps,'');
});
test('negation and name boundaries protect the plan from false prescriptions',()=>{
 const plan=draftVideoPlan('Do not do push presses. No half snatches. Avoid gorilla rows. Instead of suitcase carries. Do goblet squats: 10 reps.');
 assert.deepEqual(plan.exercises.map(e=>e.name),['Goblet squat']);
 assert.equal(draftVideoPlan('We cleaned the floor and pressed play.').exercises.length,0);
});
test('lexicon names survive save/repeat without changing dated results or source transcript cues',()=>{
 const transcript='Double front rack reverse lunge: 8 reps per side.';const plan=draftVideoPlan(transcript);plan.reviewedAt='2026-10-15';const id=plan.exercises[0].sets[0].id;
 const video={trainingPlan:plan,trainingResults:{[id]:{...emptyResult(),weight:'16',unit:'kg',load:'pair',reps:'6',done:true}}};const before=JSON.stringify(video);
 const next=videoForNextWorkout(video);assert.equal(next.trainingResults,undefined);assert.equal(next.trainingPlan.exercises[0].name,'Double front-rack reverse lunge');assert.equal(JSON.stringify(video),before);assert.match(plan.exercises[0].evidence,/Double front rack reverse lunge: 8 reps per side/);
});

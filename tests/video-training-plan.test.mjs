import test from 'node:test';import assert from 'node:assert/strict';
import {cleanCaptions,draftVideoPlan,validateVideoPlan,sanitizeVideoTraining,videoForNextWorkout} from '../app/video-training-plan.ts';
import {repeatWorkoutSetup} from '../app/prior-workout-notes.ts';
test('caption cleanup removes timestamps, tags and rolling duplicates without losing instructions',()=>{
 const text='WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nWe do goblet squats\n\n00:00:02.000 --> 00:00:03.000\nWe do goblet squats for ten reps\n\n00:00:03.000 --> 00:00:04.000\n<00:00:03.00><c>rest twenty seconds</c>';
 assert.equal(cleanCaptions(text),'We do goblet squats\nfor ten reps\nrest twenty seconds');
});
test('explicit sets, reps and rest are kept, ordered; work time does not come from rest',()=>{
 const plan=draftVideoPlan('Goblet squat: three sets of ten reps. Rest twenty seconds.\nKettlebell swing: two sets of twelve reps.\nPlank: hold forty-five seconds. Rest thirty seconds.');
 assert.deepEqual(plan.exercises.map(e=>e.name),['Goblet squat','Kettlebell swing','Plank']);
 assert.equal(plan.exercises[0].sets.length,3);assert.equal(plan.exercises[0].sets[0].reps,'10');assert.equal(plan.exercises[0].sets[0].rest,'20 seconds');assert.equal(plan.exercises[0].sets[0].work,'');
 assert.equal(plan.exercises[1].sets.length,2);assert.equal(plan.exercises[1].sets[0].reps,'12');assert.equal(plan.exercises[2].sets[0].work,'45 seconds');assert.equal(plan.reviewedAt,'');
});
test('unknown instructions stay unspecified and circuit rounds do not silently become sets',()=>{
 const plan=draftVideoPlan('Complete three rounds. Start with goblet squats. Then try a Turkish get-up.');
 assert.equal(plan.exercises[0].setsSpecified,false);assert.equal(plan.exercises[0].sets.length,1);assert.equal(plan.exercises[0].sets[0].reps,'');assert.equal(plan.exercises[1].name,'Turkish get-up');
 assert.throws(()=>draftVideoPlan('WEBVTT\n\n'),/No caption/);assert.equal(draftVideoPlan('Hello and welcome.').exercises.length,0);
});
test('named reps stay local to the exercise and negated movements are not prescribed',()=>{
 const plan=draftVideoPlan('Ten goblet squats, then twelve kettlebell swings. No deadlifts.');
 assert.equal(plan.exercises[0].sets[0].reps,'10');assert.equal(plan.exercises[1].sets[0].reps,'12');assert.equal(plan.exercises.length,2);
});
test('validation refuses missing names, duplicate IDs, oversized plans and malformed results',()=>{
 const plan=draftVideoPlan('Goblet squat: 3 sets of 10 reps.');
 assert.ok(validateVideoPlan(plan));assert.equal(validateVideoPlan({...plan,exercises:[{...plan.exercises[0],name:''}]}),undefined);
 assert.equal(validateVideoPlan({...plan,exercises:[...plan.exercises,...plan.exercises]}),undefined);
 const video={url:'video',label:'Keep',trainingPlan:plan,trainingResults:{[plan.exercises[0].sets[0].id]:{weight:'20',unit:'kg',reps:'8',done:true,warmup:false},bogus:{done:true}}};const clean=sanitizeVideoTraining(video);assert.equal(Object.keys(clean.trainingResults).length,1);assert.equal(clean.trainingResults[plan.exercises[0].sets[0].id].load,'single');assert.ok(video.trainingResults.bogus);
});
test('reusing a video or repeating a workout clears results but preserves its plan and source history',()=>{
 const plan=draftVideoPlan('Goblet squat: 3 sets of 10 reps.');const video={url:'video',label:'Workout',trainingPlan:plan,trainingResults:{[plan.exercises[0].sets[0].id]:{weight:'20',unit:'kg',load:'single',reps:'10',work:'',done:true,warmup:true}}};const before=JSON.stringify(video);const next=videoForNextWorkout(video);assert.equal(next.trainingResults,undefined);assert.equal(next.trainingPlan.exercises[0].sets.length,3);
 const source={activity:'Kettlebell',mobilityExercises:[],notes:'Keep',videos:[video]};const current={activity:'',mobilityExercises:[],notes:'',videos:[]};assert.equal(repeatWorkoutSetup(current,source).videos[0].trainingResults,undefined);assert.equal(JSON.stringify(video),before);assert.deepEqual(JSON.parse(JSON.stringify(video)),video);
});

test('strength comparisons use completed non-warm-up actual reps, one best set/day and matching load',async()=>{
 const {strengthSetComparisons}=await import('../app/video-training-plan.ts');const plan=draftVideoPlan('Goblet squat: 2 sets of 10 reps.');
 const session=(date,first,second)=>({session:{date,videos:[{trainingPlan:plan,trainingResults:{[plan.exercises[0].sets[0].id]:{weight:'20',unit:'kg',load:'single',reps:first,work:'',done:true,warmup:false},[plan.exercises[0].sets[1].id]:{weight:'20',unit:'kg',load:'single',reps:second,work:'',done:true,warmup:false}}}]}});
 const entries=[session('2026-10-14','12','11'),session('2026-10-10','10','9'),session('2026-09-01','30','30')];const before=JSON.stringify(entries);let rows=strengthSetComparisons(entries,'2026-10-14',4);assert.equal(rows.length,1);assert.equal(rows[0].latest.reps,12);assert.equal(rows[0].prior.reps,10);assert.equal(JSON.stringify(entries),before);
 const warm=session('2026-10-13','50','');warm.session.videos[0].trainingResults[plan.exercises[0].sets[0].id].warmup=true;assert.equal(strengthSetComparisons([...entries,warm],'2026-10-14',4)[0].prior.reps,10);
 const pair=session('2026-10-13','20','19');Object.values(pair.session.videos[0].trainingResults).forEach(r=>r.load='pair');rows=strengthSetComparisons([...entries,pair],'2026-10-14',4);assert.equal(rows.length,2);assert.equal(rows.find(r=>r.latest.load==='pair').prior,undefined);
 const unknown=session('2026-10-15','999','10');assert.equal(strengthSetComparisons([...entries,unknown],'2026-10-14',4)[0].latest.reps,12);
});

test('plain timestamps do not become reps and reversed rest cues do not become work',()=>{
 const plan=draftVideoPlan('Complete three rounds.\n00:30 Goblet squat\n01:00 Plank: 40 seconds work and 20 seconds rest.');
 assert.equal(plan.exercises[0].sets[0].reps,'');assert.equal(plan.exercises[1].sets[0].work,'40 seconds');assert.equal(plan.exercises[1].sets[0].rest,'20 seconds');assert.match(plan.notes,/Complete three rounds/);
 assert.equal(cleanCaptions('1\n00:00:01 --> 00:00:02\nGoblet squat\n10\nreps'),'Goblet squat\n10\nreps');
});

test('explicit completion uses specified targets, preserves shorter actuals and never guesses range/unknown reps',async()=>{
 const {completeVideoSet,emptyResult}=await import('../app/video-training-plan.ts');const planned={id:'s',reps:'10',work:'40 sec',rest:'20 sec'};
 assert.deepEqual(completeVideoSet(emptyResult(),planned,true),{done:true,reps:'10',work:'40 sec'});
 assert.deepEqual(completeVideoSet({...emptyResult(),reps:'6',work:'20 sec'},planned,true),{done:true,reps:'6',work:'20 sec'});
 assert.equal(completeVideoSet(emptyResult(),{...planned,reps:'8–12'},true).reps,'');
 assert.equal(completeVideoSet(emptyResult(),{...planned,reps:'',work:''},true).work,'');
 assert.deepEqual(completeVideoSet({...emptyResult(),done:true},planned,false),{done:false});
});

test('video duration and cues for the next exercise are not assigned to the current movement',()=>{
 const plan=draftVideoPlan('Goblet squat. This video is 20 minutes long. Then 10 reps of kettlebell swings.');assert.equal(plan.exercises[0].sets[0].work,'');assert.equal(plan.exercises[0].sets[0].reps,'');
});

test('explicit workout protocol replaces introductory examples and shares only stated per-exercise work',()=>{
 const transcript='Some movement examples are swings and Turkish get-ups.\nFor this workout the exercises are deadlifts, press and the goblet squat.\nThe protocol is three exercises for two minutes per exercise.\nComplete them consecutively. Take a 60 second break after every round. Start with two to three rounds in total.';
 const plan=draftVideoPlan(transcript);
 assert.deepEqual(plan.exercises.map(exercise=>exercise.name),['Deadlift','Press','Goblet squat']);
 for(const exercise of plan.exercises){assert.equal(exercise.setsSpecified,false);assert.equal(exercise.sets.length,1);assert.equal(exercise.sets[0].work,'2 minutes');assert.equal(exercise.sets[0].reps,'');assert.equal(exercise.sets[0].rest,'');}
 assert.match(plan.notes,/60 second break after every round/);assert.match(plan.notes,/two to three rounds/);
 assert.doesNotMatch(plan.exercises[1].name,/Overhead|Bench/);
});

test('shared protocol timing needs a matching exercise count and scope needs explicit workout markers',()=>{
 const mismatch=draftVideoPlan('For this workout the exercises are deadlift and goblet squat. The protocol is three exercises for two minutes per exercise. Rest 60 seconds between rounds.');
 assert.equal(mismatch.exercises.find(exercise=>exercise.name==='Deadlift').sets[0].work,'');
 const unmarked=draftVideoPlan('Kettlebell swing: 10 reps. The exercises are deadlift and goblet squat. The protocol is two exercises for two minutes per exercise.');
 assert.equal(unmarked.exercises[0].name,'Kettlebell swing');
 const unknown=draftVideoPlan('Kettlebell swing: 10 reps. For this workout the exercises are deadlift and an unfamiliar movement. The protocol is two exercises for two minutes per exercise.');
 assert.equal(unknown.exercises[0].name,'Kettlebell swing');
 const noProtocol=draftVideoPlan('Kettlebell swing: 10 reps. For this workout the exercises are deadlift and goblet squat.');
 assert.equal(noProtocol.exercises[0].name,'Kettlebell swing');
 const multiple=draftVideoPlan('For this workout the exercises are deadlift and goblet squat. The protocol is two exercises for two minutes per exercise. For another workout the exercises are plank and push-up. The protocol is two exercises for thirty seconds per exercise.');
 assert.ok(multiple.exercises.some(exercise=>exercise.name==='Push-up'));assert.ok(multiple.exercises.some(exercise=>exercise.name==='Deadlift'));
});

test('unsupported shared set protocols and later exact targets remain available to draft extraction',()=>{
 const sharedSets=draftVideoPlan('For this workout the exercises are deadlift and goblet squat. The protocol is three sets of ten reps of each exercise.');
 assert.ok(sharedSets.exercises.some(exercise=>exercise.sets.length===3&&exercise.sets.every(set=>set.reps==='10')));
 const laterTargets=draftVideoPlan('For this workout the exercises are deadlift and goblet squat. The protocol is two exercises for thirty seconds per exercise. Deadlift: three sets of ten reps. Goblet squat: three sets of twelve reps.');
 const deadlift=laterTargets.exercises.filter(exercise=>exercise.name==='Deadlift').at(-1),squat=laterTargets.exercises.filter(exercise=>exercise.name==='Goblet squat').at(-1);
 assert.equal(deadlift.sets.length,3);assert.ok(deadlift.sets.every(set=>set.reps==='10'));
 assert.equal(squat.sets.length,3);assert.ok(squat.sets.every(set=>set.reps==='12'));
});

test('caption links and fallback commands use only a canonical validated YouTube ID',async()=>{
 const {canonicalVideoURL}=await import('../app/video-training-plan.ts');
 assert.equal(canonicalVideoURL({url:'https://youtu.be/abcdefghijk?x=$(anything)'}),'https://www.youtube.com/watch?v=abcdefghijk');
 assert.equal(canonicalVideoURL({url:'https://evil.example/?v=abcdefghijk'}),'');assert.equal(canonicalVideoURL({url:'javascript:anything'}),'');assert.equal(canonicalVideoURL({url:'https://youtu.be/short'}),'');
});

test('changed working weight is compared at matching reps, unit and setup',async()=>{
 const {strengthSetComparisons}=await import('../app/video-training-plan.ts');const plan=draftVideoPlan('Goblet squat: 1 set of 10 reps.');const record=(date,weight)=>({session:{date,videos:[{trainingPlan:plan,trainingResults:{[plan.exercises[0].sets[0].id]:{weight,unit:'kg',load:'single',reps:'10',work:'',done:true,warmup:false}}}]}});
 const comparison=strengthSetComparisons([record('2026-10-14','24'),record('2026-10-10','20')],'2026-10-14',4).find(row=>row.basis==='weight');assert.equal(comparison.latest.weight,24);assert.equal(comparison.prior.weight,20);assert.equal(comparison.latest.reps,10);
});

test('extra session sets preserve recorded IDs/results and do not modify the reusable plan',async()=>{
 const {appendVideoSet}=await import('../app/video-training-plan.ts');
 const plan=draftVideoPlan('Goblet squat: 1 set of 10 reps. Rest twenty seconds.');const snapshot=JSON.stringify(plan);const first=plan.exercises[0];
 const result={weight:'24',unit:'kg',load:'single',reps:'8',work:'',done:true,warmup:false};
 const next=appendVideoSet(plan,first.id);assert.equal(next.exercises[0].sets.length,2);assert.equal(next.exercises[0].setsSpecified,true);
 assert.equal(next.exercises[0].sets[0].id,first.sets[0].id);assert.notEqual(next.exercises[0].sets[1].id,first.sets[0].id);assert.equal(next.exercises[0].sets[1].reps,'10');
 const video=sanitizeVideoTraining({trainingPlan:next,trainingResults:{[first.sets[0].id]:result}});assert.deepEqual(video.trainingResults[first.sets[0].id],result);assert.equal(video.trainingResults[next.exercises[0].sets[1].id],undefined);assert.equal(JSON.stringify(plan),snapshot);
 assert.equal(appendVideoSet(plan,'missing'),undefined);const full={...plan,exercises:[{...first,sets:Array.from({length:20},(_,i)=>({...first.sets[0],id:'set-'+i}))}]};assert.equal(appendVideoSet(full,first.id),undefined);
});
test('manual video logging starts without captions, supports more sets and roundtrips',async()=>{
 const {appendVideoExercise,appendVideoSet}=await import('../app/video-training-plan.ts');assert.equal(appendVideoExercise(undefined,' '),undefined);
 const plan=appendVideoExercise(undefined,' Kettlebell swing ');assert.equal(plan.source,'manual');assert.equal(plan.exercises[0].name,'Kettlebell swing');assert.equal(plan.exercises[0].sets.length,1);assert.equal(plan.exercises[0].sets[0].reps,'');
 const next=appendVideoExercise(appendVideoSet(plan,plan.exercises[0].id),'Deadlift');assert.deepEqual(next.exercises.map(e=>e.sets.length),[2,1]);assert.deepEqual(validateVideoPlan(JSON.parse(JSON.stringify(next))),next);
});


test('repeat copies the chosen completed set, not the last set, and leaves completion unchecked',async()=>{
 const {repeatVideoSet,appendVideoSet}=await import('../app/video-training-plan.ts');
 const base=draftVideoPlan('Goblet squat: 1 set of 10 reps. Rest twenty seconds.');const row=base.exercises[0],id=row.sets[0].id;
 const plan=appendVideoSet(base,row.id);plan.exercises[0].sets[1].reps='15';
 const results={[id]:{weight:'24',unit:'kg',load:'pair',reps:'8',work:'35 sec',warmup:false,done:true}};
 const before=JSON.stringify({plan,results});const next=repeatVideoSet(plan,results,row.id,id),newSet=next.trainingPlan.exercises[0].sets[2];
 assert.equal(newSet.reps,'10');assert.equal(newSet.rest,'20 seconds');assert.notEqual(newSet.id,id);
 assert.deepEqual(next.trainingResults[newSet.id],{...results[id],done:false});assert.deepEqual(next.trainingResults[id],results[id]);assert.equal(JSON.stringify({plan,results}),before);
 assert.deepEqual(sanitizeVideoTraining(JSON.parse(JSON.stringify(next))),next);
 assert.equal(repeatVideoSet(plan,results,'missing',id),undefined);assert.equal(repeatVideoSet(plan,results,row.id,'missing'),undefined);
 assert.equal(repeatVideoSet(plan,{[id]:{...results[id],done:false}},row.id,id),undefined);
 const full={...plan,exercises:[{...row,sets:Array.from({length:20},(_,i)=>({...row.sets[0],id:i?'extra-'+i:id}))}]};assert.equal(repeatVideoSet(full,results,row.id,id),undefined);
});
test('repeat retains bodyweight, time and warm-up details without inventing a completed effort',async()=>{
 const {repeatVideoSet}=await import('../app/video-training-plan.ts');const plan=draftVideoPlan('Plank: hold forty seconds.');const row=plan.exercises[0],id=row.sets[0].id;
 const result={weight:'',unit:'lb',load:'bodyweight',reps:'',work:'20 sec',done:true,warmup:true};
 const next=repeatVideoSet(plan,{[id]:result},row.id,id);assert.deepEqual(Object.values(next.trainingResults).at(-1),{...result,done:false});
});

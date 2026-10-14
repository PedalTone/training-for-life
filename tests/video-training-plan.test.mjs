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

test('caption links and fallback commands use only a canonical validated YouTube ID',async()=>{
 const {canonicalVideoURL}=await import('../app/video-training-plan.ts');
 assert.equal(canonicalVideoURL({url:'https://youtu.be/abcdefghijk?x=$(anything)'}),'https://www.youtube.com/watch?v=abcdefghijk');
 assert.equal(canonicalVideoURL({url:'https://evil.example/?v=abcdefghijk'}),'');assert.equal(canonicalVideoURL({url:'javascript:anything'}),'');assert.equal(canonicalVideoURL({url:'https://youtu.be/short'}),'');
});

test('changed working weight is compared at matching reps, unit and setup',async()=>{
 const {strengthSetComparisons}=await import('../app/video-training-plan.ts');const plan=draftVideoPlan('Goblet squat: 1 set of 10 reps.');const record=(date,weight)=>({session:{date,videos:[{trainingPlan:plan,trainingResults:{[plan.exercises[0].sets[0].id]:{weight,unit:'kg',load:'single',reps:'10',work:'',done:true,warmup:false}}}]}});
 const comparison=strengthSetComparisons([record('2026-10-14','24'),record('2026-10-10','20')],'2026-10-14',4).find(row=>row.basis==='weight');assert.equal(comparison.latest.weight,24);assert.equal(comparison.prior.weight,20);assert.equal(comparison.latest.reps,10);
});

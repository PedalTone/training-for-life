import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {transformSync} from 'esbuild';import {workoutIsLocked} from '../app/workout-lock.ts';import {gpsTime} from '../app/gps-math.ts';import {correctedGpsActivities} from '../app/gps-edit.ts';
const source=readFileSync(new URL('../app/page.tsx',import.meta.url),'utf8');const body=source.split('const gps = useGpsTracker(async (date, workout, change) => {')[1].split('\n  }, loaded,')[0];
async function save(current,record,change,unlocked=true,getStored=async()=>current){let result;const sessionRef={current};const scope={sessionRef,saveTimer:{current:null},correctedGpsActivities,workoutIsLocked,editingDateRef:{current:unlocked?current.date:null},getSession:getStored,dateFromKey:d=>new Date(d+'T12:00:00'),activeSchedule:[],scheduleHistory:[],scheduleForDate:()=>Array(7).fill({key:'endurance'}),normalizeSession:s=>s,emptySession:()=>{},gpsTime,saveSession:async s=>{result=s;},setSession:()=>{},setHistory:()=>{}};const js=transformSync(`return async (date:string,workout:any,change?:string)=>{${body}}`,{loader:'ts',target:'es2022'}).code;const fn=new Function('scope',`const {${Object.keys(scope).join(',')}}=scope;${js}`)(scope);await fn(current.date,record,change);return result;}
const base={id:'2026-10-10',date:'2026-10-10',activity:'Bike',activities:['Bike'],duration:'Existing duration',distance:'Existing distance',notes:'Keep my notes',videos:[{label:'Saved video'}],status:'completed',mobilityExercises:['Rows']};const record={id:'first',activity:'Bike',startedAt:'2026-10-10T12:00:00Z',endedAt:'2026-10-10T13:00:00Z',seconds:3600,meters:16093.44,maxSpeed:6,gaps:0};
test('GPS save preserves manual totals, setup and completion and records all summary fields for backup',async()=>{const before=JSON.stringify(base);const saved=await save(base,record);assert.equal(saved.duration,base.duration);assert.equal(saved.distance,base.distance);assert.equal(saved.notes,base.notes);assert.equal(saved.status,'completed');assert.deepEqual(saved.videos,base.videos);assert.deepEqual(JSON.parse(JSON.stringify(saved)).gpsWorkouts,[record]);assert.equal(JSON.stringify(base),before);});
test('GPS fills empty totals, accumulates later recordings and preserves subsequent manual edits',async()=>{const first=await save({...base,duration:'',distance:''},record);assert.equal(first.duration,'01:00:00');assert.equal(first.distance,'10.00 mi');const second=await save(first,{...record,id:'second'});assert.equal(second.duration,'02:00:00');assert.equal(second.distance,'20.00 mi');assert.equal(second.gpsWorkouts.length,2);const manual=await save({...second,distance:'Manual distance'},{...record,id:'third'});assert.equal(manual.distance,'Manual distance');});
test('editing a saved route replaces it without adding distance or duplicate recordings',async()=>{const route={segments:[[[-73,40],[-73.01,40.01]]],locationLabel:'New York, New York'};const first=await save({...base,duration:'',distance:''},{...record,route});const next=await save(first,{...record,route:{...route,locationLabel:'New York, New York → Newark, New Jersey'}});assert.equal(next.gpsWorkouts.length,1);assert.equal(next.distance,'10.00 mi');assert.equal(next.duration,'01:00:00');assert.match(next.gpsWorkouts[0].route.locationLabel,/New Jersey/);});

test('place-label enrichment preserves interval recording order',async()=>{const first=await save({...base,duration:'',distance:''},record);const second=await save(first,{...record,id:'second'});const enriched=await save(second,{...record,route:{segments:[[[-74,40],[-74.001,40]]],locationLabel:'New York, NY'}});assert.deepEqual(enriched.gpsWorkouts.map(w=>w.id),['first','second']);assert.equal(enriched.distance,'20.00 mi');assert.equal(enriched.duration,'02:00:00');});

test('correcting a recording updates auto totals/activity without duplicates, route loss or manual data loss',async()=>{
 const run={...record,activity:'Run',seconds:600,meters:1609.344,route:{segments:[[[-74,40],[-74.001,40]]],locationLabel:'New York, NY'}};
 const original=await save({...base,status:'partial',activity:'',activities:[],duration:'',distance:''},run);
 const updated=await save(original,{...run,activity:'Bike',seconds:1200,meters:3218.688},'edit');
 assert.equal(updated.activity,'Bike');assert.deepEqual(updated.activities,['Bike']);assert.equal(updated.duration,'00:20:00');assert.equal(updated.distance,'2.00 mi');assert.equal(updated.gpsWorkouts.length,1);assert.deepEqual(updated.gpsWorkouts[0].route,run.route);assert.equal(updated.notes,base.notes);
 const enriched=await save(updated,{...run,route:{...run.route,locationLabel:'Updated city'}},'route');
 assert.equal(enriched.gpsWorkouts[0].activity,'Bike');assert.equal(enriched.gpsWorkouts[0].seconds,1200);assert.equal(enriched.distance,'2.00 mi');
 const manual=await save({...original,activity:'My workout',activities:['Run','Kettlebell'],duration:'Manual duration',distance:'Manual distance'},{...run,activity:'Bike'},'edit');assert.equal(manual.activity,'My workout');assert.deepEqual(manual.activities,['Kettlebell','Bike']);assert.equal(manual.duration,'Manual duration');assert.equal(manual.distance,'Manual distance');
});

test('finished workouts reject recording edits until explicitly unlocked; route enrichment preserves the lock',async()=>{const original={...base,gpsWorkouts:[record],completedAt:'2026-10-10T13:00:00Z'};await assert.rejects(save(original,{...record,activity:'Run'},'edit',false),/Edit workout/);const enriched=await save(original,{...record,route:{segments:[[[-74,40],[-74.001,40]]],locationLabel:'New York, NY'}},'route',false);assert.equal(enriched.status,'completed');assert.equal(enriched.completedAt,original.completedAt);assert.equal(enriched.gpsWorkouts[0].activity,'Bike');});

test('deleting one interval recalculates automatic totals and keeps other recordings and notes',async()=>{
 const first=await save({...base,activity:'',activities:[],duration:'',distance:''},record);
 const run={...record,id:'run',activity:'Run',seconds:600,meters:1609.344};
 const both=await save(first,run);
 const next=await save(both,record,'delete');
 assert.deepEqual(next.gpsWorkouts,[run]);assert.equal(next.duration,'00:10:00');assert.equal(next.distance,'1.00 mi');assert.deepEqual(next.activities,['Run']);assert.equal(next.activity,'Run');assert.equal(next.notes,base.notes);assert.deepEqual(next.videos,base.videos);assert.equal(next.status,'completed');
 const last=await save(next,run,'delete');assert.deepEqual(last.gpsWorkouts,[]);assert.equal(last.duration,'');assert.equal(last.distance,'');assert.equal(last.startTime,'');assert.equal(last.activity,'');assert.deepEqual(last.activities,[]);
});
test('deleting retains manual fields and completed lock; missing or locked recordings cannot be deleted',async()=>{
 const current={...base,gpsWorkouts:[record],startTime:'07:15',completedAt:record.endedAt};
 const next=await save(current,record,'delete');assert.equal(next.duration,base.duration);assert.equal(next.distance,base.distance);assert.equal(next.startTime,'07:15');assert.equal(next.completedAt,current.completedAt);
 await assert.rejects(save(current,record,'delete',false),/Edit workout/);
 await assert.rejects(save({...current,gpsWorkouts:[]},record,'delete'),/Edit workout/);
});
test('late route enrichment never restores a deleted recording',async()=>{
 const current={...base,gpsWorkouts:[]};
 assert.equal(await save(current,{...record,route:{segments:[[[-74,40],[-73,40]]]}},'route'),undefined);
});

test('active GPS saves do not wait for a stalled storage read',{timeout:100},async()=>{const saved=await save({...base,status:"partial"},record,undefined,true,()=>new Promise(()=>{}));assert.equal(saved.gpsWorkouts.length,1);});

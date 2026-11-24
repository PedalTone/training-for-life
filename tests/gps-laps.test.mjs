import test from 'node:test';
import assert from 'node:assert/strict';
import {beginRepeat,endRepeat,currentRepeat,gpsSegments,splitTime,splitTotals,lapRecoverySeconds,continuedLapDraft,trackPaceDistanceMeters} from '../app/gps-laps.ts';
import {readGpsRecovery} from '../app/gps-recovery.ts';

const origin=Date.parse('2026-11-09T12:00:00Z');
const at=seconds=>new Date(origin+seconds*1000).toISOString();
const fresh=()=>({lapMode:true,startedAt:at(0),seconds:0,meters:0,laps:[],recoveries:[]});
const reload=value=>JSON.parse(JSON.stringify(value));

test('mixed mile/800/400 repeats and recoveries survive every boundary and total exactly',()=>{
 let draft=fresh(),wall=0;
 const distances=[1609.344,800,800,400,400,400,400,1609.344];
 const times=[573.9,214,212.6,107.6,106.4,105.8,99.4,610.2];
 const rests=[182.9,187.4,228.1,130.3,177.8,145.6,200.1];
 for(let i=0;i<distances.length;i++){
  draft=beginRepeat(reload(draft),at(wall));
  draft={...draft,seconds:draft.seconds+times[i],meters:draft.meters+distances[i]};wall+=times[i];
  draft=endRepeat(reload(draft),at(wall),i<distances.length-1);
  if(i<rests.length)wall+=rests[i];
 }
 assert.deepEqual(draft.laps.map(lap=>lap.meters).map(Math.round),distances.map(Math.round));
 draft.laps.forEach((lap,i)=>assert.ok(Math.abs(lap.seconds-times[i])<1e-8));
 assert.deepEqual(draft.recoveries.map(rest=>rest.seconds),rests);
 assert.equal(draft.laps.length,8);assert.equal(draft.recoveries.length,7);
 assert.ok(Math.abs(draft.seconds-times.reduce((a,b)=>a+b,0))<1e-8);
 const rows=gpsSegments(draft);assert.equal(rows.length,15);
 assert.deepEqual(rows.map(row=>row.kind),Array.from({length:15},(_,i)=>i%2?'recovery':'repeat'));
 assert.ok(rows.filter(row=>row.kind==='recovery').every(row=>row.meters===null));
});

test('background/reload Resume preserves the whole open repeat instead of restarting its boundary',()=>{
 let draft=beginRepeat(fresh(),at(0));
 draft=reload({...draft,seconds:30.4,meters:150});
 draft=beginRepeat(draft,at(50));
 assert.deepEqual(currentRepeat(draft),{seconds:30.4,meters:150});
 draft=endRepeat({...draft,seconds:80.7,meters:400},at(100.3),false);
 assert.equal(draft.laps.length,1);assert.equal(draft.laps[0].seconds,80.7);assert.equal(draft.laps[0].meters,400);
 assert.equal(draft.recoveries.length,0);
});

test('Stop during recovery creates no duplicate repeat and poor GPS still records real repeat time',()=>{
 let draft=endRepeat({...beginRepeat(fresh(),at(0)),seconds:10.4},at(10.4));
 assert.equal(draft.laps[0].meters,0);assert.equal(draft.laps[0].seconds,10.4);
 draft=endRepeat(reload(draft),at(25),false);
 assert.equal(draft.laps.length,1);assert.equal(draft.recoveries.length,1);assert.equal(draft.recoveries[0].seconds,14.6);
 assert.deepEqual(endRepeat(draft,at(26),false),draft,'Finalization is idempotent');
});

test('old saved splits show timestamp-derived recovery, while totals-only records gain no invented splits',()=>{
 const laps=[{number:1,seconds:100,meters:400,startedAt:at(0),endedAt:at(100)},
 {number:2,seconds:210,meters:800,startedAt:at(160),endedAt:at(370)}];
 assert.deepEqual(gpsSegments({laps})[1],{kind:'recovery',number:1,seconds:60,meters:null,estimated:true});
 assert.equal(gpsSegments({laps,recoveries:[]}).length,2);
 assert.deepEqual(gpsSegments({}),[]);
 const draft=beginRepeat({lapMode:true,startedAt:at(0),seconds:150,meters:600,laps:[laps[0]]},at(300));
 assert.deepEqual(currentRepeat(draft),{seconds:50,meters:200});
 const resumed=beginRepeat({lapMode:true,startedAt:at(0),seconds:310,meters:1200,laps},at(400));
 assert.equal(resumed.recoveries.length,2);assert.equal(resumed.recoveries[0].seconds,60);assert.equal(resumed.recoveries[0].estimated,true);
});

test('last-save receipt and JSON backup retain lap mode, repeats and recovery durations',()=>{
 const draft=endRepeat({...beginRepeat(fresh(),at(0)),seconds:100.25,meters:400},at(100.25));
 const done=endRepeat(beginRepeat(draft,at(160.5)),at(160.5),false);
 const workout={...done,id:'lap-run',activity:'Run',endedAt:at(160.5),maxSpeed:5,gaps:0};
 const record={date:'2026-11-09',workout};
 assert.deepEqual(reload(readGpsRecovery({getItem:()=>JSON.stringify(record)}).workout),workout);
 assert.deepEqual(reload(record).workout.laps,workout.laps);
 assert.equal(splitTime(573.9),'9:33.9');assert.equal(splitTime(59.96),'1:00.0');assert.equal(splitTime(3601.2),'1:00:01.2');
});


test('split totals include all repeats and recovery, without changing original measurements',()=>{
 const rows=[{kind:'repeat',number:1,seconds:573.9,meters:1609.344},{kind:'recovery',number:1,seconds:182.9,meters:null},{kind:'repeat',number:2,seconds:220,meters:800},{kind:'recovery',number:2,seconds:187.4,meters:null},{kind:'repeat',number:3,seconds:610.2,meters:1609.344}];
 const before=structuredClone(rows);
 assert.deepEqual(splitTotals(rows),{activeSeconds:1404.1,restSeconds:370.3,totalSeconds:1774.4,estimatedRest:false});
 assert.equal(splitTime(splitTotals(rows).totalSeconds),'29:34.4');
 assert.deepEqual(rows,before);
});
test('display totals round each subtotal once and the grand total adds displayed values',()=>{
 const tiny=[{kind:'repeat',number:1,seconds:.14,meters:1},{kind:'repeat',number:2,seconds:.14,meters:1}];
 assert.equal(splitTime(splitTotals(tiny).activeSeconds),'0:00.3');
 const rounded=splitTotals([{kind:'repeat',number:1,seconds:1.44,meters:5},{kind:'recovery',number:1,seconds:1.44,meters:null}]);
 assert.deepEqual(rounded,{activeSeconds:1.4,restSeconds:1.4,totalSeconds:2.8,estimatedRest:false});
 assert.deepEqual(splitTotals([]),{activeSeconds:0,restSeconds:0,totalSeconds:0,estimatedRest:false});
});
test('completed track split pace rounds GPS distance to nearest 200m, with midpoint down and 200m minimum',()=>{
 assert.equal(trackPaceDistanceMeters(840),800);
 assert.equal(trackPaceDistanceMeters(1700),1600);
 assert.equal(trackPaceDistanceMeters(1609.344),1600);
 assert.equal(trackPaceDistanceMeters(1701),1800);
 assert.equal(trackPaceDistanceMeters(99),200);
 assert.equal(trackPaceDistanceMeters(0),null);
 assert.equal(trackPaceDistanceMeters(-10),null);
 assert.equal(trackPaceDistanceMeters(NaN),null);
});
test('rest totals respect explicit empty recoveries and mark older inferred time as estimated',()=>{
 const laps=[{number:1,seconds:100,meters:400,startedAt:at(0),endedAt:at(100)},{number:2,seconds:210,meters:800,startedAt:at(160),endedAt:at(370)}];
 assert.deepEqual(splitTotals(gpsSegments({laps})),{activeSeconds:310,restSeconds:60,totalSeconds:370,estimatedRest:true});
 assert.deepEqual(splitTotals(gpsSegments({laps,recoveries:[]})),{activeSeconds:310,restSeconds:0,totalSeconds:310,estimatedRest:false});
 assert.equal(splitTime(splitTotals([{kind:'repeat',number:1,seconds:3600.4,meters:0},{kind:'recovery',number:1,seconds:15,meters:null}]).totalSeconds),'1:00:15.4');
});

test('rest clock starts at zero, advances independently of active time and clears on Resume',()=>{
 const at='2026-11-23T12:00:00Z';let d={startedAt:at,lapMode:true,seconds:100,meters:400,laps:[],recoveries:[],lapProgress:{repeatStart:{seconds:0,meters:0,at},recoveryStartedAt:null}};
 d=endRepeat(d,'2026-11-23T12:01:40Z');assert.equal(lapRecoverySeconds(d,Date.parse('2026-11-23T12:01:40Z')),0);
 assert.equal(lapRecoverySeconds(JSON.parse(JSON.stringify(d)),Date.parse('2026-11-23T12:02:55Z')),75);assert.equal(d.seconds,100);
 d=beginRepeat(d,'2026-11-23T12:02:55Z');assert.equal(d.recoveries[0].seconds,75);assert.equal(lapRecoverySeconds(d,Date.parse('2026-11-23T12:03:00Z')),0);
 assert.equal(lapRecoverySeconds(null),0);assert.equal(lapRecoverySeconds({lapProgress:{recoveryStartedAt:'invalid'}}),0);
});
test('continuing a saved lap session extends final rest once and preserves the same recording identity',()=>{
 const laps=[{number:1,seconds:100,meters:400,startedAt:'2026-11-23T12:00:00Z',endedAt:'2026-11-23T12:01:40Z'}];
 const workout={id:'same-session',activity:'Run',startedAt:laps[0].startedAt,endedAt:'2026-11-23T12:02:00Z',seconds:100,meters:400,maxSpeed:4,gaps:0,lapMode:true,laps,recoveries:[{afterRepeat:1,seconds:20,startedAt:laps[0].endedAt,endedAt:'2026-11-23T12:02:00Z'}]};
 const before=JSON.stringify(workout);let d=continuedLapDraft(workout,'2026-11-23','2026-11-23T12:03:00Z');assert.equal(d.recordingId,workout.id);
 d=beginRepeat(d,'2026-11-23T12:03:00Z');assert.deepEqual(d.recoveries.map(r=>r.seconds),[80]);
 d=endRepeat({...d,seconds:250,meters:1000},'2026-11-23T12:05:30Z',false);assert.deepEqual(d.laps.map(l=>[l.seconds,l.meters]),[[100,400],[150,600]]);
 assert.equal(JSON.stringify(workout),before);assert.equal(d.recordingId,'same-session');assert.equal(splitTotals(gpsSegments(d)).totalSeconds,330);
 assert.equal(continuedLapDraft({...workout,laps:[]},'2026-11-23','2026-11-23T12:03:00Z'),null);
 assert.equal(continuedLapDraft(workout,'2026-11-23','bad'),null);assert.equal(continuedLapDraft(workout,'2026-11-23','2026-11-23T12:01:00Z'),null);
});
test('continuation preserves earlier recovery and can recognize legacy lap arrays without the mode flag',()=>{
 const laps=[{number:1,seconds:100,meters:400,startedAt:'2026-11-23T12:00:00Z',endedAt:'2026-11-23T12:01:40Z'},{number:2,seconds:150,meters:600,startedAt:'2026-11-23T12:03:00Z',endedAt:'2026-11-23T12:05:30Z'}];
 const w={id:'legacy',activity:'Run',startedAt:laps[0].startedAt,endedAt:laps[1].endedAt,seconds:250,meters:1000,laps};
 const d=beginRepeat(continuedLapDraft(w,'2026-11-23','2026-11-23T12:06:30Z'),'2026-11-23T12:06:30Z');
 assert.deepEqual(d.recoveries.map(r=>[r.afterRepeat,r.seconds]),[[1,80],[2,60]]);assert.equal(d.recoveries[0].estimated,true);assert.equal(d.lapMode,true);assert.equal(d.gaps,0);
});

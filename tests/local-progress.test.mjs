import test from 'node:test';import assert from 'node:assert/strict';import {localProgress} from '../app/local-progress.ts';
const e=(date,key='strength',theme='Full-Body Strength',patch={})=>({key,theme,session:{date,status:'completed',activity:'Dumbbells',completedExercises:[],...patch}});
test('balance uses completed days, excludes future and respects inclusive 28-day window',()=>{const d=localProgress([e('2026-10-10'),e('2026-09-13','rest','Recovery',{status:'rest'}),e('2026-09-12'),e('2026-10-11'),e('2026-10-09','mobility','Mobility',{status:'partial',completedExercises:['Rows']})],'2026-10-10',4,[]);assert.equal(d.counts.get('strength'),1);assert.equal(d.counts.get('rest'),1);assert.equal(d.counts.get('mobility'),undefined);assert.equal(d.supporting,1);});
test('comparisons separate strength themes and activities and require completed records',()=>{const d=localProgress([e('2026-10-09'),e('2026-10-08','strength','Upper Body Strength'),e('2026-10-07','strength','Full-Body Strength',{activity:'Gym'}),e('2026-10-06'),e('2026-10-05','strength','Full-Body Strength',{status:'partial'})],'2026-10-10',4,[]);assert.equal(d.comparisons.length,1);assert.equal(d.comparisons[0].prior.date,'2026-10-06');});
test('revisit uses completed exercises across all history, not selections, and leaves source untouched',()=>{const entries=[e('2026-09-01','strength','Strength',{completedExercises:['Rows'],mobilityExercises:['Stretch']}),e('2026-10-09','strength','Strength',{completedExercises:['Squats']})];const before=JSON.stringify(entries);const d=localProgress(entries,'2026-10-10',4,['Rows','Stretch','Squats','Removed']);assert.deepEqual(d.revisit,[{name:'Rows',date:'2026-09-01',days:39}]);assert.equal(JSON.stringify(entries),before);});

test('4, 8 and 12 weeks rank completed exercises within each window, once per day',()=>{const entries=[e('2026-10-10','strength','Strength',{completedExercises:['Rows','Rows','Squats']}),e('2026-09-01','strength','Strength',{completedExercises:['Squats']}),e('2026-08-01','strength','Strength',{completedExercises:['Squats']}),e('2026-10-11','strength','Strength',{completedExercises:['Future']}),e('2026-10-09','strength','Strength',{mobilityExercises:['Unfinished']})];assert.deepEqual(localProgress(entries,'2026-10-10',4,[]).exercises,[{name:'Rows',count:1},{name:'Squats',count:1}]);assert.deepEqual(localProgress(entries,'2026-10-10',8,[]).exercises,[{name:'Squats',count:2},{name:'Rows',count:1}]);assert.equal(localProgress(entries,'2026-10-10',12,[]).exercises[0].count,3);});

test('training mix measures share of all completed days including recovery, not the largest type',()=>{
 const entries=[e('2026-10-10'),e('2026-10-09'),e('2026-10-08','aerobic','Easy aerobic'),e('2026-10-07','rest','Recovery',{status:'rest'}),e('2026-10-06','mobility','Mobility',{status:'partial',completedExercises:['Stretch']}),e('2026-10-11','speed','Speed')];
 const before=JSON.stringify(entries);const data=localProgress(entries,'2026-10-10',4,[]);
 assert.equal(data.finished.length,4);
 assert.equal(data.mix.find(row=>row.key==='strength').percentage,50);
 assert.equal(data.mix.find(row=>row.key==='rest').percentage,25);
 assert.equal(data.mix.find(row=>row.key==='mobility').percentage,0);
 assert.equal(data.mix.reduce((sum,row)=>sum+row.percentage,0),100);
 assert.equal(data.mix.length,7);assert.equal(JSON.stringify(entries),before);
});
test('missing historical types remain visible and percentages update with the selected window',()=>{
 const entries=[e('2026-10-10'),e('2026-09-01','yoga','Yoga'),e('2026-08-01','custom:Rowing','Rowing'),e('2026-10-11','tennis','Tennis')];
 const four=localProgress(entries,'2026-10-10',4,[]).mix;
 assert.equal(four.find(row=>row.key==='strength').percentage,100);
 assert.equal(four.find(row=>row.key==='yoga').count,0);
 assert.equal(four.find(row=>row.key==='custom:Rowing').label,'Rowing');
 assert.equal(four.some(row=>row.key==='tennis'),false);
 const eight=localProgress(entries,'2026-10-10',8,[]).mix;
 assert.equal(eight.find(row=>row.key==='yoga').percentage,50);
 const twelve=localProgress(entries,'2026-10-10',12,[]).mix;
 assert.ok(Math.abs(twelve.reduce((sum,row)=>sum+row.percentage,0)-100)<1e-10);
 assert.equal(twelve[0].count,1);
});
test('empty periods have zero shares and legacy completion agrees with History',()=>{
 const empty=localProgress([],'2026-10-10',4,[]);
 assert.equal(empty.finished.length,0);assert.ok(empty.mix.every(row=>row.percentage===0));
 const legacy=localProgress([e('2026-10-09','strength','Strength',{status:'partial',completedAt:'2026-10-09T18:00:00Z'})],'2026-10-10',4,[]);
 assert.equal(legacy.finished.length,1);assert.equal(legacy.mix[0].percentage,100);
});

test('Walk is a separate category with zero state and completed-day percentages',()=>{
 const empty=localProgress([],'2026-10-19',4,[]).mix;assert.equal(empty.find(row=>row.key==='walk').count,0);
 const data=localProgress([e('2026-10-19','walk','Walk',{activity:'Walk'}),e('2026-10-18','rest','Recovery',{status:'rest'})],'2026-10-19',4,[]);
 assert.equal(data.mix.find(row=>row.key==='walk').percentage,50);assert.equal(data.mix.find(row=>row.key==='aerobic').count,0);
});

import test from 'node:test';import assert from 'node:assert/strict';import {historyWeeks,shiftHistoryWeeks,historyWorkoutColor,historyWorkoutKeys,historyWorkoutLabel} from '../app/history-timeline.ts';
const key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
test('12 Monday-to-Sunday weeks are contiguous across month/year and DST boundaries',()=>{for(const today of ['2026-10-14','2026-11-04','2026-01-04']){const cursor=new Date(today+'T12:00:00');const before=cursor.getTime();const weeks=historyWeeks(cursor);assert.equal(weeks.length,12);assert.equal(weeks[0][0].getDay(),1);assert.equal(weeks[11][6].getDay(),0);const all=weeks.flat();assert.equal(new Set(all.map(key)).size,84);for(let i=1;i<all.length;i++){const next=new Date(all[i-1]);next.setDate(next.getDate()+1);assert.equal(key(next),key(all[i]));}assert.equal(cursor.getTime(),before);}});
test('arrows shift three weeks and never move the timeline beyond the actual current week',()=>{const today=new Date('2026-10-14T12:00:00');const prior=shiftHistoryWeeks(today,-1,today);assert.equal(key(prior),'2026-09-21');assert.equal(key(shiftHistoryWeeks(prior,1,today)),'2026-10-12');assert.equal(key(shiftHistoryWeeks(today,1,today)),'2026-10-12');});
test('workout colors are consistent across Strength and Mobility variants and do not recolor statuses',()=>{assert.equal(historyWorkoutColor('upper-strength'),historyWorkoutColor('strength'));assert.equal(historyWorkoutColor('yoga'),historyWorkoutColor('mobility'));assert.equal(historyWorkoutColor('pilates'),historyWorkoutColor('mobility'));assert.equal(new Set(['strength','mobility','aerobic','speed','endurance','rest'].map(historyWorkoutColor)).size,6);assert.equal(historyWorkoutColor('custom:My workout'),'#203449');});

test('GPS activity does not invent another endurance workout on speed, aerobic or swim days',()=>{
 for(const primary of ['speed','aerobic','endurance','swimming'])for(const activity of ['Run','Walk','Bike','Swimming'])assert.deepEqual(historyWorkoutKeys({activity,activities:[activity],gpsWorkouts:[{activity}]},primary),[primary]);
 assert.deepEqual(historyWorkoutKeys(undefined,'endurance'),['endurance']);
 assert.deepEqual(historyWorkoutKeys({activity:'Run track intervals',gpsWorkouts:[{activity:'Run'}]},'speed'),['speed']);
});
test('explicit two-workout selections stay authoritative and unique',()=>{
 const s={secondaryPlanKey:'mobility',activities:['Run','Gym'],gpsWorkouts:[{activity:'Run'}]};const before=JSON.stringify(s);
 assert.deepEqual(historyWorkoutKeys(s,'speed'),['speed','mobility']);assert.equal(JSON.stringify(s),before);
 assert.deepEqual(historyWorkoutKeys({secondaryPlanKey:'endurance',activity:'Run'},'strength'),['strength','endurance']);
 assert.deepEqual(historyWorkoutKeys({secondaryPlanKey:'aerobic',activity:'Run'},'aerobic'),['aerobic']);
 assert.deepEqual(historyWorkoutKeys({secondaryPlanKey:'custom:Trail%20run',activity:'Run'},'strength'),['strength','custom:Trail%20run']);
});
test('older mixed-workout records still infer genuinely additional types, with specific speed preferred',()=>{
 assert.deepEqual(historyWorkoutKeys({activity:'Kettlebell + Run'},'strength'),['strength','endurance']);
 assert.deepEqual(historyWorkoutKeys({activities:['Run','Weights']},'aerobic'),['aerobic','strength']);
 assert.deepEqual(historyWorkoutKeys({activity:'Track intervals + Run'},'strength'),['strength','speed']);
 assert.deepEqual(historyWorkoutKeys({activity:'Gym'},'upper-strength'),['upper-strength']);
 assert.deepEqual(historyWorkoutKeys({activity:'Lightweight stretching walkthrough'},'mobility'),['mobility']);
});
test('workout icon labels describe stopwatch, paired types and custom types',()=>{
 assert.equal(historyWorkoutLabel('endurance'),'Endurance');assert.equal(historyWorkoutLabel('aerobic'),'Easy aerobic');
 assert.equal(historyWorkoutLabel('speed'),'Speed / intervals');assert.equal(historyWorkoutLabel('upper-strength'),'Strength');
 assert.equal(historyWorkoutLabel('custom:Trail%20run'),'Trail run');assert.equal(historyWorkoutLabel('custom:%'),'Custom workout');
});

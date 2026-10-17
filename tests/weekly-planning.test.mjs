import test from 'node:test';
import assert from 'node:assert/strict';
import {nextMonday, scheduleKeysOn, planNextWeek} from '../app/weekly-planning.ts';
const a=['rest','strength','aerobic','strength','mobility','speed','endurance'];
const b=['rest','yoga','aerobic','strength','mobility','speed','endurance'];
const d=s=>new Date(s+'T12:00:00');
const key=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
test('next week begins on Monday from Saturday, Sunday and Monday, including month/year boundaries',()=>{
 for(const [from,to] of [['2026-10-17','2026-10-19'],['2026-10-18','2026-10-19'],['2026-10-19','2026-10-26'],['2026-12-31','2027-01-04'],['2026-10-31','2026-11-02']])assert.equal(key(nextMonday(d(from))),to);
});
test('saving next week preserves this week, previous history and Sunday; starts Monday and repeats',()=>{
 const old=[{effectiveDate:'2026-10-01',keys:a}];const h=planNextWeek(old,a,b,d('2026-10-17'));
 assert.deepEqual(old,[{effectiveDate:'2026-10-01',keys:a}]);
 for(const date of ['2026-10-05','2026-10-17','2026-10-18'])assert.deepEqual(scheduleKeysOn(date,b,h,'2026-10-17',a),a);
 for(const date of ['2026-10-19','2026-10-25','2026-11-02'])assert.deepEqual(scheduleKeysOn(date,b,h,'2026-10-17',a),b);
});
test('revising future plan and reloading never promotes it into this week',()=>{
 const h=JSON.parse(JSON.stringify(planNextWeek([],a,b,d('2026-10-17'))));
 const c=[...b];c[2]='swimming';const updated=planNextWeek(h,b,c,d('2026-10-18'));
 assert.equal(updated.filter(x=>x.effectiveDate==='2026-10-19').length,1);
 assert.deepEqual(scheduleKeysOn('2026-10-18',c,updated,'2026-10-18',a),a);
 assert.deepEqual(scheduleKeysOn('2026-10-19',c,updated,'2026-10-19',a),c);
});
test('following Monday adopts saved week and permits planning another week without rewriting it',()=>{
 const h=planNextWeek([],a,b,d('2026-10-17'));const c=[...a];c[0]='yoga';
 const updated=planNextWeek(h,b,c,d('2026-10-19'));
 assert.deepEqual(scheduleKeysOn('2026-10-25',c,updated,'2026-10-19',a),b);
 assert.deepEqual(scheduleKeysOn('2026-10-26',c,updated,'2026-10-19',a),c);
 assert.deepEqual(scheduleKeysOn('2026-10-17',c,updated,'2026-10-19',a),a);
});
test('legacy schedules and pre-snapshot history retain their baseline',()=>{
 assert.deepEqual(scheduleKeysOn('2026-10-18',b,[],'2026-10-17',a),b);
 assert.deepEqual(scheduleKeysOn('2026-09-01',b,[],'2026-10-17',a),a);
});
test('workout backup includes dated mappings alongside existing keys and session data',async()=>{
 const {readFile}=await import('node:fs/promises');const {transformSync}=await import('esbuild');
 const source=await readFile(new URL('../app/page.tsx',import.meta.url),'utf8');
 const fn=source.slice(source.indexOf('function makeBackupFile('),source.indexOf('async function saveBackup('));
 const js=transformSync(fn,{loader:'ts',target:'es2022'}).code;
 const build=new Function('readNutrition','backupFilename',`${js};return makeBackupFile`)(()=>({} ),()=> 'backup.json');
 const snapshots=planNextWeek([],a,b,d('2026-10-17'));const sessions=[{date:'2026-10-12',notes:'Preserve'}];
 const file=build(sessions,[],[],[],{},b,[],snapshots);const backup=JSON.parse(await file.text());
 assert.deepEqual(backup.scheduleHistory,snapshots);assert.deepEqual(backup.sessions,sessions);assert.equal(backup.settings.weekStartsOn,'monday');assert.equal(backup.schemaVersion,1);
});

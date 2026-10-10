import test from 'node:test';
import assert from 'node:assert/strict';
import {searchJournal, emptyHistoryFilters} from '../app/history-search.ts';
const entry = (date, theme, patch = {}) => ({theme, session:{id:date,date,activity:'Dumbbells',notes:'Felt strong',mobilityExercises:['Shoulder stretch'],completedExercises:[],videos:[{label:'Café workout'}],injury:{bodyArea:'Knee',note:'Reduced load'},...patch}});
const entries = [entry('2026-10-01','Full-Body Strength'),entry('2026-10-03','Upper Body Strength',{notes:'Long walk'}),entry('2026-10-11','Full-Body Strength')];
const find = patch => searchJournal(entries,{...emptyHistoryFilters,...patch},'2026-10-10');
test('search covers saved details, combines words and ignores case/accents',()=>{
 for(const query of ['SHOULDER','cafe','knee reduced','dumbbells strong']) assert.equal(find({query}).length,query.includes('strong')?1:2);
 assert.equal(find({query:'unrecorded'}).length,0);
 assert.equal(find({query:'  '}).length,2);
});
test('historical themes remain distinct, dates are inclusive and future records excluded',()=>{
 assert.deepEqual(find({type:'Upper Body Strength'}).map(e=>e.session.date),['2026-10-03']);
 assert.deepEqual(find({from:'2026-10-01',to:'2026-10-01'}).map(e=>e.session.date),['2026-10-01']);
 assert.equal(find({from:'2026-10-05',to:'2026-10-01'}).length,0);
 assert.deepEqual(find({}).map(e=>e.session.date),['2026-10-03','2026-10-01']);
});
test('matching excerpts include the search hit and never mutate source records',()=>{
 const before=JSON.stringify(entries);
 assert.match(find({query:'reduced'})[0].excerpt,/Reduced load/);
 const long=entry('2026-10-01','Strength',{notes:'a'.repeat(200)+'target'+'b'.repeat(300)});
 const result=searchJournal([long],{...emptyHistoryFilters,query:'target'},'2026-10-10')[0];
 assert.match(result.excerpt,/target/);assert.ok(result.excerpt.length<=152);
 assert.equal(JSON.stringify(entries),before);
});

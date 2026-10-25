import test from 'node:test';import assert from 'node:assert/strict';import {withSessionStore} from '../app/session-store.ts';
test('stalled database open rejects rather than leaving Save pending; late open is closed',async()=>{const original=globalThis.indexedDB;let request,closed=0;globalThis.indexedDB={open:()=>request={}};try{await assert.rejects(withSessionStore('readwrite',()=>{},20),/timed out/);request.result={close:()=>closed++};request.onsuccess();assert.equal(closed,1);}finally{globalThis.indexedDB=original;}});
test('stalled transaction aborts before fallback and cannot report late success',async()=>{const original=globalThis.indexedDB;let request,tx,aborted=0,closed=0;globalThis.indexedDB={open:()=>request={}};try{const saved=withSessionStore('readwrite',()=>({result:'late'}),20);request.result={close:()=>closed++,transaction:()=>tx={objectStore:()=>({}),abort:()=>aborted++}};request.onsuccess();await assert.rejects(saved,/timed out/);assert.equal(aborted,1);assert.equal(closed,1);tx.oncomplete();}finally{globalThis.indexedDB=original;}});
test('blocked and failed opens reject, successful transactions resolve and close',async()=>{const original=globalThis.indexedDB;let request,tx,closed=0;globalThis.indexedDB={open:()=>request={}};try{let pending=withSessionStore('readonly',()=>({result:'value'}),100);request.onblocked();await assert.rejects(pending,/blocked/);pending=withSessionStore('readwrite',()=>({result:'saved'}),100);request.result={close:()=>closed++,transaction:()=>tx={objectStore:()=>({}),abort:()=>{}}};request.onsuccess();tx.oncomplete();assert.equal(await pending,'saved');assert.equal(closed,1);}finally{globalThis.indexedDB=original;}});

import {createSessionWriter} from '../app/session-store.ts';
const memory=()=>{const data=new Map();return {getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)};};
test('pending old autosave cannot finish after a GPS save, even with a delayed database open',async()=>{
 let release;const writes=[];const local=memory();
 const save=createSessionWriter(async item=>{if(item.notes==='old')await new Promise(resolve=>release=resolve);writes.push(item);},()=>local);
 const old=save({id:'day',notes:'old'});await Promise.resolve();await Promise.resolve();
 const gps=save({id:'day',notes:'new',gpsWorkouts:[{id:'walk',seconds:600,meters:800}]});
 await Promise.resolve();assert.equal(writes.length,0);release();await Promise.all([old,gps]);
 assert.equal(writes.at(-1).gpsWorkouts[0].id,'walk');assert.equal(JSON.parse(local.getItem('t4l:day')).gpsWorkouts[0].meters,800);
});
test('an autosave queued during Stop/save checks freshness when it actually writes',async()=>{
 let release;let current='old';const writes=[];
 const save=createSessionWriter(async item=>{if(item.gpsWorkouts)await new Promise(resolve=>release=resolve);writes.push(item);},memory);
 const gps=save({id:'day',gpsWorkouts:[{id:'walk'}]});
 const publish=gps.then(()=>{current='new';});
 await Promise.resolve();await Promise.resolve();
 const stale=save({id:'day',notes:'old'},()=>current==='old');release();await Promise.all([gps,publish,stale]);
 assert.equal(writes.length,1);assert.equal(writes[0].gpsWorkouts[0].id,'walk');
});
test('GPS success keeps a readable second copy; either store alone can save; both failing rejects',async()=>{
 const item={id:'day',gpsWorkouts:[{id:'walk'}]},local=memory();
 await createSessionWriter(async()=>{},()=>local)(item);assert.deepEqual(JSON.parse(local.getItem('t4l:day')),item);
 await createSessionWriter(async()=>{throw Error('IDB failed');},()=>local)(item);
 const unavailable=()=>{throw Error('Local unavailable');};
 await createSessionWriter(async()=>{},unavailable)(item);
 await assert.rejects(createSessionWriter(async()=>{throw Error('IDB failed');},unavailable)(item),/Local unavailable/);
 const silent={setItem(){},getItem(){return null;}};
 await assert.rejects(createSessionWriter(async()=>{throw Error('IDB failed');},()=>silent)(item),/verified/);
});
test('a failed save does not block later retries or saves for another date',async()=>{
 let failing=true;const writes=[];const save=createSessionWriter(async item=>{if(failing)throw Error('Failed');writes.push(item);},()=>{throw Error('No fallback');});
 await assert.rejects(save({id:'day'}));failing=false;await save({id:'day',gpsWorkouts:[]});await save({id:'another'});assert.equal(writes.length,2);
});

import test from 'node:test';import assert from 'node:assert/strict';import {readGpsRecovery,GPS_RECOVERY_KEY} from '../app/gps-recovery.ts';
const workout={id:'walk',activity:'Walk',startedAt:'2026-10-24T12:00:00Z',endedAt:'2026-10-24T12:30:00Z',seconds:1800,meters:2200,maxSpeed:2,gaps:0,route:{segments:[[[-74,40],[-74.01,40.01]]]}};
test('stopped recording recovery preserves exact totals, route, date and retry identity',()=>{const receipt={date:'2026-10-24',workout};assert.deepEqual(readGpsRecovery({getItem:key=>key===GPS_RECOVERY_KEY?JSON.stringify(receipt):null}),{...receipt,workout:{...workout,route:{...workout.route,locationLabel:undefined}}});});
test('invalid or unavailable recovery never replaces existing tracking data',()=>{for(const value of [null,'bad',JSON.stringify({date:'bad',workout}),JSON.stringify({date:'2026-10-24',workout:{...workout,seconds:-1}})])assert.equal(readGpsRecovery({getItem:()=>value}),null);assert.equal(readGpsRecovery({getItem(){throw Error('Unavailable');}}),null);});

test('explicit deletion clears only its recovery copy and rejects silent removal failures',async()=>{
 const {clearGpsRecovery}=await import('../app/gps-recovery.ts');const original=globalThis.localStorage;let raw=JSON.stringify({date:'2026-10-24',workout});
 try{globalThis.localStorage={getItem:()=>raw,removeItem:()=>{raw=null;}};clearGpsRecovery('other');assert.ok(raw);clearGpsRecovery('walk');assert.equal(raw,null);
 raw=JSON.stringify({date:'2026-10-24',workout});globalThis.localStorage.removeItem=()=>{};assert.throws(()=>clearGpsRecovery('walk'),/Could not clear/);
 globalThis.localStorage.getItem=()=>{throw Error('Storage unavailable');};assert.throws(()=>clearGpsRecovery('walk'),/Storage unavailable/);
 }finally{if(original===undefined)delete globalThis.localStorage;else globalThis.localStorage=original;}
});

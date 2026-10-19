import test from 'node:test';import assert from 'node:assert/strict';
import {gpsStep,gpsResumeStep,newGpsResumeState} from '../app/gps-math.ts';
import {autoPauseStep,newAutoPauseState} from '../app/gps-auto-pause.ts';
const point=(s,meters,speed=null,accuracy=5)=>({latitude:40+meters/111195,longitude:-74,accuracy,timestamp:s*1000,speed});
function resumeSequence(samples,activity='Run'){
 let state=newGpsResumeState(),motion={...newAutoPauseState(),paused:true};const results=[];
 for(const p of samples){const evidence=gpsResumeStep(state,p,p.timestamp,activity);state=evidence.state;const result=autoPauseStep(motion,{at:p.timestamp,now:p.timestamp,speed:evidence.speed,moving:evidence.moving,reliable:evidence.reliable});motion=result.state;results.push({evidence,result});}
 return results;
}
test('small walking steps resume after a two-minute stop with native speed missing, zero or positive',()=>{
 for(const native of [null,0,1.1]){
  const samples=Array.from({length:121},(_,i)=>point(i,0,0));
  samples.push(...Array.from({length:8},(_,i)=>point(121+i,(i+1)*1.1,native)));
  const results=resumeSequence(samples);const resumed=results.filter(r=>r.result.transition==='resume');
  assert.equal(resumed.length,1);assert.equal(results.at(-1).result.state.paused,false);
  // The original per-fix distance gate rejects every individual walking step.
  assert.equal(samples.slice(122).every((p,i)=>gpsStep(samples[121+i],p,'Run').meters===0),true);
 }
});
test('slow walking and biking both resume from progressive coordinate movement',()=>{
 for(const [activity,speed] of [['Run',0.75],['Walk',0.75],['Bike',4]]){
  const result=resumeSequence(Array.from({length:10},(_,i)=>point(i,i*speed,null,20)),activity);
  assert.ok(result.some(r=>r.result.transition==='resume'),activity);
 }
});
test('GPS noise, speed-only spikes and a single coordinate jump never resume',()=>{
 for(const positions of [Array(15).fill(0),[0,1,-1,0,1,-1,0,1,-1], [0,0,0,6,0,0]]){
  const result=resumeSequence(positions.map((m,i)=>point(i,m,8)));
  assert.equal(result.some(r=>r.result.transition==='resume'),false);
 }
});
test('weak, stale, out-of-order fixes and missing GPS reset movement evidence',()=>{
 let state=newGpsResumeState();for(let i=0;i<4;i++)state=gpsResumeStep(state,point(i,i),i*1000,'Run').state;
 for(const [p,now] of [[point(4,9,1,100),4000],[point(4,9),20000],[point(2,9),4000]]){
  const result=gpsResumeStep(state,p,now,'Run');assert.equal(result.reliable,false);assert.equal(result.moving,false);assert.equal(result.state.anchor,null);
 }
 const gap=gpsResumeStep(state,point(120,100),120000,'Run');assert.equal(gap.moving,false);assert.equal(gap.state.anchor.timestamp,120000);
 assert.equal(gpsResumeStep(gap.state,point(121,101),121000,'Run').moving,false);
});
test('stationary time never dilutes later walking speed and the movement window stays bounded',()=>{
 let state=newGpsResumeState();for(let i=0;i<=300;i++)state=gpsResumeStep(state,point(i,0,0),i*1000,'Run').state;
 assert.equal(state.anchor.timestamp,300000);
 const next=gpsResumeStep(state,point(301,1,null),301000,'Run');assert.ok(next.speed>0.99);
 const reset=gpsResumeStep(next.state,point(311,3),311000,'Run');assert.equal(reset.state.anchor.timestamp,311000);assert.equal(reset.moving,false);
});

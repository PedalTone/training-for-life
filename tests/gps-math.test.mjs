import test from 'node:test';import assert from 'node:assert/strict';import {gpsDistance,gpsStep,gpsUnits,gpsTime,gpsPace,rollingWindowSpeed} from '../app/gps-math.ts';
const point=(latitude=40,timestamp=1000,accuracy=5,speed=null)=>({latitude,longitude:-74,timestamp,accuracy,speed});
test('GPS distance and display units use meters and active seconds',()=>{assert.ok(Math.abs(gpsDistance(point(),point(40.001))-111.195)<.1);assert.deepEqual(gpsUnits(1609.344,360,'mi'),{distance:'1.00',average:'10.0'});assert.equal(gpsTime(3661),'01:01:01');assert.equal(gpsUnits(0,0,'km').average,'0.0');});
test('GPS rejects weak fixes, stale timestamps and implausible jumps; gaps never bridge missing route',()=>{const p=point();assert.equal(gpsStep(null,p,'Run').meters,0);assert.equal(gpsStep(p,point(40.001,11000),'Run').accepted,true);assert.equal(gpsStep(p,point(40.001,11000,80),'Run').accepted,false);assert.equal(gpsStep(p,point(42,2000),'Bike').accepted,false);assert.equal(gpsStep(p,point(40.001,1000),'Run').accepted,false);assert.equal(gpsStep(p,point(40.01,32000),'Bike').meters,0);assert.equal(gpsStep(p,point(40.01,32000),'Bike').gap,true);});
test('jitter contributes no distance and negative or missing device speed falls back to route estimate',()=>{const p=point();assert.equal(gpsStep(p,point(40.000001,6000,5,1),'Run').speed,0);const result=gpsStep(p,point(40.0001,6000,5,-1),'Run');assert.ok(result.speed>2&&result.speed<3);assert.equal(gpsStep(null,point(NaN),'Bike').accepted,false);});

test('regular stationary fixes do not become a signal gap and out-of-order callbacks are ignored',()=>{const p=point();assert.equal(gpsStep(p,point(40,41000),'Run',40000).gap,false);assert.equal(gpsStep(p,point(40.0001,2000),'Run',3000).accepted,false);});

test('pace handles miles, kilometers, second carry and missing movement',()=>{assert.equal(gpsPace(1609.344/600),'10:00');assert.equal(gpsPace(1000/300,'km'),'5:00');assert.equal(gpsPace(1609.344/599.6),'10:00');for(const speed of [null,0,-1,NaN,Infinity])assert.equal(gpsPace(speed),'—');});

test('moving coordinates override a zero device-speed reading',()=>{const result=gpsStep(point(),point(40.0001,6000,5,0),'Run');assert.ok(result.meters>0);assert.ok(result.speed>2);});

test('rolling pace uses an exact five-second window with interpolation across uneven GPS timing',()=>{
 const samples=[{timestamp:1000,meters:0},{timestamp:2350,meters:3.375},{timestamp:4110,meters:7.775},{timestamp:6100,meters:12.75}];
 assert.ok(Math.abs(rollingWindowSpeed(samples,5)-2.5)<1e-9);
});
test('rolling pace updates from the trailing window and does not average pace samples',()=>{
 const samples=Array.from({length:9},(_,second)=>({timestamp:second*1000,meters:second<=4?second*2:8+(second-4)*4}));
 assert.equal(rollingWindowSpeed(samples.slice(0,6),5),2.4);
 assert.equal(rollingWindowSpeed(samples,5),3.6);
});
test('rolling pace waits for a complete reliable window and rejects stopped or malformed samples',()=>{
 assert.equal(rollingWindowSpeed([{timestamp:0,meters:0},{timestamp:4999,meters:10}],5),null);
 assert.equal(rollingWindowSpeed([{timestamp:0,meters:0},{timestamp:5000,meters:0}],5),null);
 assert.equal(rollingWindowSpeed([{timestamp:0,meters:0},{timestamp:5000,meters:5},{timestamp:4000,meters:8}],5),null);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const compiled=await build({entryPoints:['app/share-card-data.ts'],bundle:true,write:false,platform:'node',format:'cjs'});
const shareModule={exports:{}};new Function('module','exports',compiled.outputFiles[0].text)(shareModule,shareModule.exports);
const {toShareCardData,shareRouteSegments,projectShareRoute,shareFormats,shareDuration}=shareModule.exports;
const base={date:'2026-10-11',activity:'',duration:'',distance:'',notes:'PRIVATE',mobilityExercises:['Face Pulls','Dead Hang'],completedExercises:[],injury:{note:'PRIVATE'},videos:[],status:'completed'};
const run={activity:'Run',meters:5000,seconds:1800,route:{segments:[Array.from({length:30},(_,i)=>[-74+i*.001,40.7])],locationLabel:'New York, NY'}};
test('GPS run derives only supported totals and respects saved metrics',()=>{
 const source={...base,activity:'Run',gpsWorkouts:[run],pace:'6:00 / km',calories:'350'};const before=structuredClone(source);const data=toShareCardData(source,{key:'endurance',theme:'Endurance'});
 assert.deepEqual(data.metrics.map(m=>m.id),['distance','duration','pace','calories']);assert.equal(data.metrics[0].value,'3.11 mi');assert.equal(data.metrics[1].value,'30 min');assert.equal(data.metrics.find(m=>m.id==='pace').value,'9:39 min/mile');assert.deepEqual(source,before);assert.ok(!JSON.stringify(data).includes('PRIVATE'));
 assert.equal(toShareCardData({...source,distance:'5 km',duration:'30 min'}, {key:'endurance',theme:'Endurance'}).metrics[0].value,'5 km');
});
test('walking/hiking GPS and multiple recordings preserve separate route segments',()=>{
 const data=toShareCardData({...base,activity:'Hike',gpsWorkouts:[{...run,activity:'Walk'},run]}, {key:'endurance',theme:'Endurance'});
 assert.equal(data.title,'Hike');assert.equal(data.route.segments.length,2);assert.equal(data.metrics.find(m=>m.id==='duration').value,'1 hr');
});
test('strength includes only completed exercises, no invented sets/reps/heart rate/volume',()=>{
 const data=toShareCardData({...base,duration:'28 min',completedExercises:['Rows','Rows','Carry']},{key:'strength',theme:'Strength'});
 assert.deepEqual(data.metrics,[{id:'duration',label:'Duration',value:'28 min'},{id:'exercises',label:'Exercises completed',value:'2'}]);assert.equal(data.route,undefined);assert.equal(data.photo,undefined);
});
test('missing optional metrics and long actual values remain faithful',()=>{
 assert.deepEqual(toShareCardData(base,{key:'rest',theme:'Recovery'}).metrics,[]);
 const value='An unusually long actual workout value '.repeat(30);const data=toShareCardData({...base,duration:value,activity:value},{key:'custom:Workout',theme:'Workout'});assert.equal(data.title,value.trim());assert.equal(data.metrics[0].value,value.trim());
});
test('privacy hides areas around endpoints and never connects pauses or removed sections',()=>{
 const route=run.route,before=structuredClone(route);const clipped=shareRouteSegments(route);assert.ok(clipped[0].length<route.segments[0].length);assert.notDeepEqual(clipped[0][0],route.segments[0][0]);assert.notDeepEqual(clipped.at(-1).at(-1),route.segments[0].at(-1));assert.deepEqual(route,before);assert.deepEqual(shareRouteSegments(route,false),route.segments);
 const short={segments:[[[-74,40.7],[-73.9999,40.7]]]};assert.deepEqual(shareRouteSegments(short),[]);
 const separated={segments:[...route.segments,route.segments[0].map(([x,y])=>[x,y+.02])]};assert.equal(shareRouteSegments(separated).length,2);
});
test('projection handles date-line crossings and ignores invalid GPS coordinates',()=>{
 const segments=shareRouteSegments({segments:[[[179.9,0],[-179.9,0],[NaN,30]]]},false);const projected=projectShareRoute(segments);assert.ok(Math.abs(projected[0][1][0]-projected[0][0][0])<.01);assert.equal(projected[0].length,2);
});
test('export dimensions are exact for all three formats',()=>{assert.deepEqual(Object.values(shareFormats).map(f=>[f.width,f.height]),[[1080,1920],[1080,1350],[1080,1080]]);});

test('bikes use mph and mixed workouts calculate each activity separately',()=>{
 const bike={...run,activity:'Bike',meters:16093.44,seconds:3600};
 const onlyBike=toShareCardData({...base,gpsWorkouts:[bike]}, {key:'endurance',theme:'Endurance'});
 assert.equal(onlyBike.metrics.find(m=>m.id==='speed').value,'10.0 mph');
 const mixed=toShareCardData({...base,gpsWorkouts:[run,bike]}, {key:'endurance',theme:'Endurance'});
 assert.equal(mixed.metrics.find(m=>m.id==='pace').value,'9:39 min/mile');
 assert.equal(mixed.metrics.find(m=>m.id==='speed').value,'10.0 mph');
});

test('share duration uses readable hours and minutes',()=>{assert.equal(shareDuration(4320),'1 hr 12 min');assert.equal(shareDuration(1800),'30 min');assert.equal(shareDuration(20),'20 sec');});

test('corrected Run to Bike classification switches sharing pace to speed',()=>{const data=toShareCardData({...base,activity:'Bike',gpsWorkouts:[{...run,activity:'Bike'}]}, {key:'endurance',theme:'Endurance'});assert.equal(data.title,'Bike');assert.ok(!data.metrics.some(item=>item.label==='Avg Pace'));assert.equal(data.metrics.find(item=>item.id==='speed').value,'6.2 mph');assert.equal(data.route.locationLabel,'New York, NY');});

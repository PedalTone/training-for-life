import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
const result=await build({entryPoints:['app/gps-tracker.tsx'],bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime']});
const module={exports:{}};new Function('require','module','exports',result.outputFiles[0].text)(require,module,module.exports);
const {GpsTracker}=module.exports;
const workout={id:'run',activity:'Run',startedAt:'2026-10-18T12:00:00Z',seconds:600,meters:1609.344};
const tracker={draft:null,saved:null,savedDate:null,running:false,pending:false,saving:false,notice:'',speed:null,unit:'mi',autoPauseEnabled:true};
const render=(savedWorkouts,patch={},props={})=>renderToStaticMarkup(React.createElement(GpsTracker,{tracker:{...tracker,...patch},date:'2026-10-18',savedWorkouts,...props}));
test('saved recordings replace live metrics and setup, immediately and after reload',()=>{
 for(const html of [render([workout]),render([],{saved:workout,savedDate:'2026-10-18'})]){
  assert.match(html,/Saved recordings/);assert.match(html,/Edit recording 1: Run/);assert.match(html,/Avg Pace: 10:00 min\/mile/);assert.match(html,/Record another workout/);
  for(const text of ['class="gps-metrics"','class="gps-auto-pause"','aria-label="Activity"','Start timer','Current pace'])assert.ok(!html.includes(text),text);
 }
});
test('preparing another interval restores setup while preserving saved summaries',()=>{
 const html=render([workout],{draft:{...workout,date:'2026-10-18',seconds:0,meters:0,ready:true}});
 for(const text of ['class="gps-metrics"','class="gps-auto-pause"','Start timer','Saved recordings','Avg Pace: 10:00 min/mile'])assert.ok(html.includes(text),text);
 assert.ok(!html.includes('Record another workout'));
});
test('mixed saved activities retain distinct units and completed lock affordance',()=>{
 const html=render([workout,{...workout,id:'bike',activity:'Bike'}],{}, {readOnly:true,onEditWorkout(){}});
 assert.match(html,/Avg Pace: 10:00 min\/mile/);assert.match(html,/Average speed: 6.0 mph/);assert.match(html,/Edit workout to change recordings/);
 assert.match(html,/aria-label="Edit recording 1: Run" disabled/);
});

test('Walk is selectable and saved walks show pace rather than biking speed',()=>{
 const ready=render([]);assert.match(ready,/<option[^>]*>Walk<\/option>/);
 const html=render([{...workout,activity:'Walk'}]);assert.match(html,/Edit recording 1: Walk/);assert.match(html,/Avg Pace: 10:00 min\/mile/);assert.doesNotMatch(html,/Average speed:/);
});

test('saved mixed-distance lap recordings show a table in normal view, including recovery and tenths',()=>{
 const laps=[{number:1,seconds:107.6,meters:400,startedAt:'2026-10-18T12:00:00Z',endedAt:'2026-10-18T12:01:47.600Z'},
 {number:2,seconds:214,meters:800,startedAt:'2026-10-18T12:03:47.600Z',endedAt:'2026-10-18T12:07:21.600Z'}];
 for(const activity of ['Run','Walk']){
  const html=render([{...workout,activity,lapMode:true,laps}]);
  assert.match(html,/Repeats &amp; recovery/);assert.match(html,/<table>/);assert.match(html,/Repeat 1/);assert.match(html,/Repeat 2/);
  assert.match(html,/Recovery/);assert.match(html,/1:47\.6/);assert.match(html,/2:00\.0/);assert.match(html,/400/);assert.match(html,/800/);
  assert.match(html,/Older recovery times are estimated/);assert.doesNotMatch(html,/gps-lap-live/);
 }
});

test('a recording saved to another date stays visibly retained with totals and a dated navigation action',()=>{
 const html=render([],{saved:workout,savedDate:'2026-10-17'},{onViewSaved(){}});
 assert.match(html,/Recording saved on another day/);assert.match(html,/Saved for 2026-10-17/);assert.match(html,/1\.00 mi · 00:10:00/);assert.match(html,/View saved workout/);
 assert.doesNotMatch(html,/Edit recording 1: Run/);assert.doesNotMatch(html,/class="gps-metrics"/);assert.match(html,/<details[^>]*open/);
});

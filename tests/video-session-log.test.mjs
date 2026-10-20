import test from 'node:test';import assert from 'node:assert/strict';import {build} from 'esbuild';import {createRequire} from 'node:module';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);const built=await build({entryPoints:['app/video-plan-view.tsx'],bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime']});const module={exports:{}};new Function('require','module','exports',built.outputFiles[0].text)(require,module,module.exports);const {VideoPlanView}=module.exports;
const plan={version:1,exercises:[{id:'squat',name:'Goblet squat',setsSpecified:false,sets:[{id:'set-one',reps:'',work:'',rest:''}],evidence:''}],notes:'',source:'manual',reviewedAt:''};
const render=(mode,trainingPlan,trainingResults)=>renderToStaticMarkup(React.createElement(VideoPlanView,{video:{url:'https://www.youtube.com/watch?v=GRFRg4Oafxc',label:'Video',trainingPlan,trainingResults},mode,onPlan:()=>true,onSessionPlan:()=>true,onResults:()=>{}}));
test('session exercise log exposes per-exercise Add set and manual logging with no plan',()=>{assert.match(render('session',plan),/aria-label="Add set for Goblet squat"/);const blank=render('session');assert.match(blank,/Log exercises/);assert.match(blank,/Add exercise/);assert.match(blank,/Build plan/);});
test('saved read-only and library template views cannot add session sets',()=>{for(const mode of ['read','template']){const html=render(mode,plan);assert.doesNotMatch(html,/Add set for|video-log-add-exercise/);}assert.equal(render('read'),'');});

test('Repeat set appears only on completed editable session sets',()=>{
 const results={'set-one':{weight:'20',unit:'kg',load:'single',reps:'10',work:'',done:true,warmup:false}};
 assert.match(render('session',plan,results),/Repeat set 1 for Goblet squat/);assert.doesNotMatch(render('session',plan),/Repeat set 1/);
 for(const mode of ['read','template'])assert.doesNotMatch(render(mode,plan,results),/Repeat set 1/);
});

test('remove exercise is available only in editable dated session logs',()=>{assert.match(render('session',plan),/Remove Goblet squat from today/);for(const mode of ['read','template'])assert.doesNotMatch(render(mode,plan),/Remove from today|video-remove-exercise/);});

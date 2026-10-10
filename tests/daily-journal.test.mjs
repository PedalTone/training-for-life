import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const require = createRequire(import.meta.url);
const compiled = await build({entryPoints:['app/daily-journal.tsx'],bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime'],define:{'import.meta.env.BASE_URL':'"/"'}});
const module = {exports:{}};
new Function('require','module','exports',compiled.outputFiles[0].text)(require,module,module.exports);
const { DailyJournal } = module.exports;
const props={date:'2026-10-08',today:'2026-10-09',plan:{key:'strength',theme:'Strength'},onDate(){},onBack(){},onEdit(){},async onAddVideo(){return 'Added'}};
const source={id:props.date,date:props.date,activity:'Dumbbells',duration:'28 min',distance:'2 km',pace:'5:30/km',calories:'250',startTime:'08:30',effort:'moderate',notes:'Presses\nSecond line',mobilityExercises:['Rows','Stretch'],completedExercises:['Rows'],status:'completed',completedAt:'2026-10-08T13:00:00Z',updatedAt:'2026-10-08T13:00:00Z',workoutPhoto:'data:image/png;base64,abc',videos:[{label:'Form reference',url:'https://youtu.be/abcdefghijk',videoId:'abcdefghijk'}],injury:{reported:true,impact:'modified',bodyArea:'Shoulder',note:'Reduced weight'},importedWorkouts:[{activity:'Walk',date:props.date,distance:'2 km',duration:'20 min',source:'Watch',confidence:'high',warnings:['Check distance']}]};
test('journal renders all saved daily fields and nutrition without mutating records',()=>{
 const nutrition={food:false,foodNote:'Late meal',cutoff:true,cutoffNote:'Finished at 7'};
 const before=structuredClone(source);let writes=0;
 globalThis.localStorage={getItem:()=>JSON.stringify({[props.date]:nutrition}),setItem(){writes++}};
 const html=renderToStaticMarkup(React.createElement(DailyJournal,{...props,session:source}));
 for(const text of ['Dumbbells','28 min','2 km','5:30/km','250','08:30','moderate','Presses','Second line','Rows','Stretch','Completed','Selected','Shoulder','Reduced weight','Modified workout','Watch','Check distance','Late meal','Finished at 7','Form reference','Add to today’s workout'])assert.ok(html.includes(text),text);
 assert.ok(html.includes('youtube-nocookie.com/embed/abcdefghijk'));
 assert.deepEqual(source,before);assert.equal(writes,0);
});
test('an unrecorded day hides empty sections and malformed video links cannot create embeds',()=>{
 globalThis.localStorage={getItem:()=> '{}'};
 const empty=renderToStaticMarkup(React.createElement(DailyJournal,props));
 assert.ok(empty.includes('Nothing recorded'));
 for(const heading of ['Your notes','Add-ons','Workout videos','Nutrition','Workout details'])assert.ok(!empty.includes('<h2>'+heading+'</h2>'));
 const html=renderToStaticMarkup(React.createElement(DailyJournal,{...props,session:{...source,videos:[{url:'javascript:alert(1)',label:'Invalid link'}]}}));
 assert.ok(!html.includes('<iframe'));assert.ok(!html.includes('href="javascript:'));
});

test('editor loader uses richer or newer fallback records without masking newer indexed data',async()=>{
 const { readFile } = await import('node:fs/promises');
 const ts = require('typescript');
 const page = await readFile('app/page.tsx','utf8');
 const block=page.slice(page.indexOf('const getSession = async'),page.indexOf('const getAllSessions ='));
 const js=ts.transpile(block,{target:ts.ScriptTarget.ES2022});
 const fallback={...source,updatedAt:'2026-10-08T12:00:00Z'};
 globalThis.localStorage={getItem:()=>JSON.stringify(fallback)};
 const make=indexed=>new Function('withStore','hasReportedInjury',js+';return getSession;')(async()=>indexed,s=>Boolean(s.injury?.reported));
 assert.deepEqual(await make(undefined)(source.id),fallback);
 assert.deepEqual(await make({...source,notes:'',status:'partial',videos:[],updatedAt:fallback.updatedAt})(source.id),fallback);
 const newer={...source,notes:'Newer edit',updatedAt:'2026-10-09T12:00:00Z'};
 assert.deepEqual(await make(newer)(source.id),newer);
});

// External Chrome only. All data and restore operations use a disposable browser context.
import assert from 'node:assert/strict';
import {writeFile,readFile} from 'node:fs/promises';
const endpoint=await(await fetch(`${process.env.CHROME_CDP_URL||'http://127.0.0.1:9241'}/json/version`)).json();
const socket=new WebSocket(endpoint.webSocketDebuggerUrl);await new Promise(r=>socket.addEventListener('open',r,{once:true}));
let id=0;const pending=new Map();socket.addEventListener('message',e=>{const m=JSON.parse(e.data),p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}});
const call=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params,sessionId}));});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const url=process.env.APP_URL||'http://127.0.0.1:5193/training-for-life/app/';

const themes={speed:'Speed / Intensity',aerobic:'Easy Aerobic',endurance:'Endurance',strength:'Full-body strength'};
const make=(day,key,activity,extra={})=>({id:`2026-11-${day}`,date:`2026-11-${day}`,plannedKey:key,plannedTheme:themes[key],planOverride:true,activity,activities:[activity],duration:'30 min',distance:'3 mi',effort:'medium',notes:`historyflag${day}`,mobilityExercises:[],completedExercises:[],videos:[],injury:{reported:false},status:'completed',completedAt:`2026-11-${day}T17:00:00Z`,updatedAt:`2026-11-${day}T17:00:00Z`,gpsWorkouts:[{id:`gps${day}`,activity:activity==='Bike'?'Bike':activity==='Walk'?'Walk':'Run',meters:4800,seconds:1800,maxSpeed:4,startedAt:`2026-11-${day}T16:30:00Z`,endedAt:`2026-11-${day}T17:00:00Z`,gaps:0}],...extra});
const fixtures=[make('09','speed','Run'),make('11','aerobic','Run'),make('14','endurance','Run'),make('16','speed','Run'),make('17','strength','Kettlebell',{gpsWorkouts:[]}),make('18','aerobic','Walk'),make('19','strength','Track intervals + Run'),make('20','strength','Run',{secondaryPlanKey:'endurance'}),make('21','endurance','Bike',{injury:{reported:true,impact:'modified',bodyArea:'Shoulder',note:'History body note'},illness:{reported:true,rested:false,note:'History illness note'}})];
async function check(width,height){
const {browserContextId}=await call('Target.createBrowserContext');let ev,cdp;
try{
const{targetId}=await call('Target.createTarget',{url:'about:blank',browserContextId});const{sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});cdp=(method,params={})=>call(method,params,sessionId);
ev=async expression=>{const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const wait=async x=>{for(let i=0;i<200;i++){if(await ev(x))return;await sleep(50);}throw Error('Timed out: '+x);};
const tap=async selector=>{const p=await ev(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing '+${JSON.stringify(selector)});if(e.disabled)throw Error('Disabled '+${JSON.stringify(selector)});e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;if(!e.contains(document.elementFromPoint(x,y)))throw Error('Obscured '+${JSON.stringify(selector)});return{x,y};})()`);await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,radiusX:8,radiusY:8}]});await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(170);};
const textButton=async(text,root='')=>{const selector=await ev(`(()=>{const es=[...document.querySelectorAll(${JSON.stringify(root+' button')})],e=es.find(e=>e.textContent.trim()===${JSON.stringify(text)});if(!e)throw Error('Missing button '+${JSON.stringify(text)});e.setAttribute('data-smoke-button','target');return '[data-smoke-button="target"]';})()`);await tap(selector);await ev("document.querySelector('[data-smoke-button]')?.removeAttribute('data-smoke-button')");};
const field=async(sel,value)=>{await ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)throw Error('Missing field '+${JSON.stringify(sel)});Object.getOwnPropertyDescriptor(e instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:e instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));})()`);await sleep(100);};
const nav=async n=>{await tap('.bottom-nav button:nth-child('+n+')');};
const reload=async()=>{const doc=await ev('window.__document');await cdp('Page.reload',{ignoreCache:true});await wait(`window.__document!==${JSON.stringify(doc)}&&Boolean(document.querySelector('.bottom-nav'))`);await sleep(600);};
const upload=async(sel,payload)=>{await ev(`(()=>{const d=new DataTransfer();d.items.add(new File([${JSON.stringify(JSON.stringify(payload))}],'training-for-life-test.json',{type:'application/json'}));const e=document.querySelector(${JSON.stringify(sel)});e.files=d.files;e.dispatchEvent(new Event('change',{bubbles:true}));})()`);};

await cdp('Page.enable');await cdp('Runtime.enable');await cdp('Emulation.setTimezoneOverride',{timezoneId:'America/New_York'});await cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});await cdp('Emulation.setTouchEmulationEnabled',{enabled:true});
await cdp('Page.addScriptToEvaluateOnNewDocument',{source:`sessionStorage.setItem('t4l:entered-app','1');window.__document=crypto.randomUUID();const D=Date;window.Date=class extends D{constructor(...a){super(...(a.length?a:[D.parse('2026-11-22T17:00:00Z')]));}static now(){return D.parse('2026-11-22T17:00:00Z');}};if(!localStorage.getItem('__seeded')){for(const s of ${JSON.stringify(fixtures)})localStorage.setItem('t4l:'+s.id,JSON.stringify(s));localStorage.setItem('__seeded','1');}Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition:(ok,fail)=>fail({code:1}),watchPosition:()=>1,clearWatch(){}}});`});
await cdp('Page.navigate',{url});await wait("document.querySelector('.today-save-state')?.textContent==='Saved on this device'");await nav(4);await wait("document.querySelectorAll('.week-scan').length===12");
const day=(week,index)=>`.week-scan:nth-last-child(${week}) .scan-days button:nth-child(${index})`;
const keys=selector=>ev(`[...document.querySelectorAll(${JSON.stringify(selector+' .history-day-icon')})].map(e=>e.dataset.workoutKey)`);
const expected=[[2,1,['speed']],[2,3,['aerobic']],[2,6,['endurance']],[1,1,['speed']],[1,2,['strength']],[1,3,['aerobic']],[1,4,['strength','speed']],[1,5,['strength','endurance']],[1,6,['endurance']]];
for(const [week,index,wanted] of expected)assert.deepEqual(await keys(day(week,index)),wanted);
assert.match(await ev("document.querySelector('.week-scan:last-child .scan-heading').textContent"),/6 \/ 7 complete/);
assert.match(await ev(`document.querySelector(${JSON.stringify(day(1,5))}).getAttribute('aria-label')`),/Strength and Endurance/);
const flagColors=async root=>ev(`(()=>{const root=document.querySelector(${JSON.stringify(root)});return [getComputedStyle(root.querySelector('.history-body-flag,.journal-result-flag')).color,getComputedStyle(root.querySelector('.history-illness-flag')).color];})()`);
assert.deepEqual(await flagColors(day(1,6)),['rgb(179, 51, 43)','rgb(20, 93, 204)']);
assert.deepEqual(await flagColors('.history-status-legend'),['rgb(179, 51, 43)','rgb(20, 93, 204)']);
assert.equal(await ev("document.documentElement.scrollWidth<=innerWidth"),true);
assert.equal(await ev("[...document.querySelectorAll('.scan-days button')].every(day=>{const b=day.getBoundingClientRect();return [...day.querySelectorAll('.history-day-icon svg,.history-status-row > *')].every(e=>{const r=e.getBoundingClientRect();return r.left>=b.left-1&&r.right<=b.right+1;});})"),true,'Icons and flags fit within their own day');
assert.equal(await ev("[...document.querySelectorAll('.history-day-icons-2 svg')].every(e=>e.getBoundingClientRect().width>=15)"),true,'Paired icons stay legible on narrow phones');
assert.equal(await ev("document.querySelectorAll('.history-workout-key,.history-color-key').length"),1,'One shared icon/color key');
await ev("document.querySelector('.history-status-legend').scrollIntoView({block:'end',behavior:'instant'})");await sleep(250);
await writeFile(`/private/tmp/t4l-history-${width}-timeline.png`,Buffer.from((await cdp('Page.captureScreenshot',{format:'png'})).data,'base64'));
await tap('.history-workout-key summary');assert.equal(await ev("document.querySelector('.history-workout-key').open"),true);assert.equal(await ev("document.querySelectorAll('.history-workout-key > div > span').length"),6);
assert.match(await ev("document.querySelector('.history-workout-key').textContent"),/Endurance/);assert.equal(await ev("document.documentElement.scrollWidth<=innerWidth"),true);
await ev("document.querySelector('.history-workout-key').scrollIntoView({block:'end',behavior:'instant'})");await sleep(250);await writeFile(`/private/tmp/t4l-history-${width}-key.png`,Buffer.from((await cdp('Page.captureScreenshot',{format:'png'})).data,'base64'));
await field('input[aria-label="Search your journal"]','historyflag21');await wait("document.querySelectorAll('.journal-search-results button').length===1");assert.deepEqual(await flagColors('.journal-search-results'),['rgb(179, 51, 43)','rgb(20, 93, 204)']);
await tap('.journal-search-results button');await wait("Boolean(document.querySelector('.daily-journal'))");assert.match(await ev("document.querySelector('.daily-journal').textContent"),/History body note/);assert.match(await ev("document.querySelector('.daily-journal').textContent"),/History illness note/);assert.match(await ev("document.querySelector('.journal-status').textContent"),/Workout complete/);
await reload();await nav(4);for(const [week,index,wanted]of expected)assert.deepEqual(await keys(day(week,index)),wanted);
const stored=await ev(`(${JSON.stringify(fixtures)}).map(s=>JSON.parse(localStorage.getItem('t4l:'+s.id)))`);assert.deepEqual(stored,fixtures);
console.log(`PASS ${width}x${height}: screenshot-pattern GPS speed/aerobic/endurance, genuine paired and legacy mixed types, 6/7 completion, red/blue flags in calendar/legend/search, labeled icon key, journal, reload and unchanged stored records.`);
}finally{await call('Target.disposeBrowserContext',{browserContextId});}
}
try{for(const [w,h]of (process.env.LIVE_ONLY?[[440,956]]:[[375,667],[393,852],[440,956]]))await check(w,h);}finally{socket.close();}

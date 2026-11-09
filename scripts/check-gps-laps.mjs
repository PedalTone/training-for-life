// External Chrome only. Disposable browser contexts isolate all simulated data.
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const endpoint=await(await fetch(`${process.env.CHROME_CDP_URL||'http://127.0.0.1:9234'}/json/version`)).json();
const socket=new WebSocket(endpoint.webSocketDebuggerUrl);
await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
let nextId=0;const pending=new Map();
socket.addEventListener('message',event=>{const m=JSON.parse(event.data),p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result);}});
const call=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const id=++nextId;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params,sessionId}));});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const mock=`
 window.__documentId=crypto.randomUUID();sessionStorage.setItem('t4l:entered-app','1');
 const RealDate=Date;let now=Number(localStorage.getItem('__clock'))||RealDate.parse('2026-11-09T12:00:00Z');
 window.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}};
 const realInterval=window.setInterval,realClear=window.clearInterval,ticks=new Map();let tickId=100000;
 window.setInterval=(fn,ms,...args)=>ms===1000?(ticks.set(++tickId,()=>fn(...args)),tickId):realInterval(fn,ms,...args);
 window.clearInterval=id=>ticks.has(id)?ticks.delete(id):realClear(id);
 window.__advance=seconds=>{now+=seconds*1000;localStorage.setItem('__clock',String(now));for(const tick of ticks.values())tick();};
 let distance=Number(localStorage.getItem('__distance'))||0,watchId=0;const watches=new Map();
 const fix=()=>({coords:{latitude:40+distance/111194.92664455873,longitude:-74,accuracy:5,speed:3,heading:0},timestamp:now});
 Object.defineProperty(navigator,'geolocation',{configurable:true,value:{
  watchPosition(success){watches.set(++watchId,success);success(fix());return watchId;},
  clearWatch(id){watches.delete(id);}
 }});
 window.__move=(meters,seconds)=>{const steps=Math.max(1,Math.ceil(seconds/4));for(let i=0;i<steps;i++){window.__advance(seconds/steps);distance+=meters/steps;localStorage.setItem('__distance',String(distance));for(const success of watches.values())success(fix());}};
 window.__stationary=seconds=>{const steps=Math.ceil(seconds);for(let i=0;i<steps;i++){window.__advance(seconds/steps);const point=fix();point.coords.speed=0;for(const success of watches.values())success(point);}};
 window.__watches=()=>watches.size;
 window.showSaveFilePicker=async()=>({createWritable:async()=>({write:async blob=>window.__backup=JSON.parse(await blob.text()),close:async()=>{}})});
 const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){if(window.__failSave)throw new Error('Simulated storage failure');return put.apply(this,args);};
 const set=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(window.__failSave&&/^t4l:\\d{4}-/.test(key))throw new Error('Simulated mirror failure');return set.call(this,key,value);};
`;

async function check(width,height,preparedOnly=false){
 const {browserContextId}=await call('Target.createBrowserContext');
 try{
  const {targetId}=await call('Target.createTarget',{url:'about:blank',browserContextId});
  const {sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});
  const cdp=(method,params={})=>call(method,params,sessionId);
  const errors=[];
  const onMessage=event=>{const m=JSON.parse(event.data);if(m.sessionId===sessionId&&m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);};
  socket.addEventListener('message',onMessage);
  const evaluate=async expression=>{const result=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
  const wait=async expression=>{for(let i=0;i<150;i++){if(await evaluate(expression))return;await delay(50);}throw new Error('Timed out: '+expression);};
  const tap=async selector=>{const point=await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw new Error('Missing '+${JSON.stringify(selector)});if(e.disabled)throw new Error('Disabled '+${JSON.stringify(selector)});e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;if(!e.contains(document.elementFromPoint(x,y)))throw new Error('Obscured '+${JSON.stringify(selector)});return{x,y};})()`);await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...point,radiusX:8,radiusY:8}]});await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await delay(120);};
  const draft=()=>evaluate("JSON.parse(localStorage.getItem('t4l:gps-draft')||'null')");
  const screenshot=async name=>writeFile(`/private/tmp/t4l-laps-${width}-${name}.png`,Buffer.from((await cdp('Page.captureScreenshot',{format:'png'})).data,'base64'));
  const reload=async()=>{const id=await evaluate('window.__documentId');await cdp('Page.reload',{ignoreCache:true});await wait(`window.__documentId!==${JSON.stringify(id)}&&Boolean(document.querySelector('.gps-start:not(:disabled)'))`);};
  await cdp('Page.enable');await cdp('Runtime.enable');
  await cdp('Emulation.setTimezoneOverride',{timezoneId:'America/New_York'});
  await cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});
  await cdp('Emulation.setTouchEmulationEnabled',{enabled:true});
  await cdp('Page.addScriptToEvaluateOnNewDocument',{source:mock});
  await cdp('Page.navigate',{url:process.env.APP_URL||'http://127.0.0.1:5174/training-for-life/app/'});
  await wait("document.querySelector('.today-save-state')?.textContent==='Saved on this device'");
  await tap('.gps-card > summary');
  if(preparedOnly!=='ordinary')await tap('.gps-lap-mode input');await tap('.gps-start');
  assert.equal((await draft()).lapMode,preparedOnly!=='ordinary');
  assert.equal(await evaluate('window.__watches()'),1);
  if(preparedOnly==='ordinary'){
   await evaluate('window.__move(1000,300)');await tap('.gps-pause');
   await evaluate('window.__advance(60)');await tap('.gps-start');await evaluate('window.__move(500,150)');
   await tap('.gps-stop');await wait("Boolean(document.querySelector('.gps-recordings'))&&!document.querySelector('.gps-stop')");
   assert.equal(await evaluate("Boolean(document.querySelector('.gps-splits-results'))"),false);
   await tap('.finish-button');await wait("Boolean(document.querySelector('.workout-lock-banner'))");
   const workout=await evaluate("window.__backup.sessions.find(s=>s.date==='2026-11-09').gpsWorkouts[0]");
   assert.ok(Math.abs(workout.seconds-450)<.01);assert.ok(Math.abs(workout.meters-1500)<.1);assert.equal(workout.laps.length,0);
   for(const index of [3,4,5,6,2]){await tap(`.bottom-nav button:nth-child(${index})`);assert.equal(await evaluate(`document.querySelector('.bottom-nav button:nth-child(${index})').getAttribute('aria-current')`),'page');}
   await tap('.bottom-nav .home-nav');await wait("Boolean(document.querySelector('.splash-version'))");
   assert.deepEqual(errors,[]);socket.removeEventListener('message',onMessage);
   console.log('PASS ordinary endurance pause/resume/save and complete Home/Today/Plan/History/Progress/Settings journey.');return;
  }
  if(preparedOnly){
   // A timed repeat without usable distance must still be recorded.
   await evaluate('window.__stationary(10.4)');assert.equal(await evaluate("Boolean(document.querySelector('.gps-pause'))"),true,'Auto-pause stays off in lap mode');await tap('.gps-stop');
   await wait("Boolean(document.querySelector('.gps-recordings'))&&!document.querySelector('.gps-stop')");
   assert.match(await evaluate("document.querySelector('.gps-splits-results').textContent"),/0:10.4/);
   await tap('.gps-record-another');
   assert.equal((await draft()).ready,true);assert.equal((await draft()).lapMode,true);
   await tap('.gps-lap-mode input');assert.equal((await draft()).lapMode,false);
   await tap('.gps-lap-mode input');assert.equal((await draft()).lapMode,true);
   assert.equal(await evaluate("document.querySelector('.finish-button').disabled"),false);
   await tap('.finish-button');await wait("Boolean(document.querySelector('.workout-lock-banner'))");
   assert.equal(await draft(),null,'Finishing dismisses only the unused preparation');
   const saved=await evaluate("window.__backup.sessions.find(s=>s.date==='2026-11-09')");
   assert.equal(saved.gpsWorkouts.length,1);assert.equal(saved.gpsWorkouts[0].laps.length,1);
   console.log('PASS zero-distance timed repeat and ready-draft Finish; no phantom recording.');
   return;
  }
  await tap('.gps-view-toggle button');
  const distances=[1609.344,800,800,400,400,400,400,1609.344];
  const times=[573.9,220,210,107.6,106.4,105.8,99.4,610.2];
  const rests=[182.9,187.4,228.1,130.3,177.8,145.6,200.1];
  for(let i=0;i<distances.length;i++){
   if(i===1){
    await evaluate(`window.__move(400,110)`);await reload();
    assert.equal((await draft()).laps.length,1);
    await tap('.gps-start');await tap('.gps-view-toggle button');
    await evaluate(`window.__move(400,110)`);
   }else await evaluate(`window.__move(${distances[i]},${times[i]})`);
   if(i<distances.length-1){
    await tap('.gps-pause');
    const paused=await draft();assert.equal(paused.laps.length,i+1);
    assert.ok(Math.abs(paused.laps[i].seconds-times[i])<.01);
    await evaluate(`window.__advance(${rests[i]})`);
    if(i===0){
     assert.match(await evaluate("document.querySelector('.gps-lap-heading').textContent"),/RECOVERY/);
     await screenshot('recovery');
    }
    await tap('.gps-start');
   }
  }
  assert.equal(await evaluate('window.__watches()'),1,'Only one active GPS watch');
  await screenshot('live');
  const fit=await evaluate("(()=>{const r=document.querySelector('.gps-stop').getBoundingClientRect();return{top:r.top,bottom:r.bottom,height:innerHeight,overflow:document.querySelector('.gps-body').scrollHeight-document.querySelector('.gps-body').clientHeight};})()");
  assert.ok(fit.top>=0&&fit.bottom<=height,JSON.stringify(fit));assert.ok(fit.overflow<=2,JSON.stringify(fit));
  if(width===375){
   await tap('.gps-fullscreen-exit');
   await evaluate('window.__failSave=true');
   assert.equal(await evaluate("document.querySelector('.finish-button').disabled"),false);
   await tap('.finish-button');
   await wait("document.querySelector('.finish-button')?.textContent.includes('Try again')");
   const failed=await draft();assert.equal(failed.laps.length,8);assert.equal(failed.recoveries.length,7);
   assert.equal(await evaluate("Boolean(document.querySelector('.workout-lock-banner'))"),false);
   await reload();
   assert.equal((await draft()).recordingId,failed.recordingId);
   assert.equal((await draft()).finishedAt,failed.finishedAt);
   await tap('.finish-button');
   await wait("Boolean(document.querySelector('.workout-lock-banner'))");
  }else{
   await tap('.gps-stop');
   await wait("!document.querySelector('.gps-fullscreen')&&Boolean(document.querySelector('.gps-splits-results'))");
   assert.equal(await evaluate("document.querySelector('.finish-button').disabled"),false);
   await tap('.finish-button');await wait("Boolean(document.querySelector('.workout-lock-banner'))");
  }
  assert.equal(await draft(),null);
  const session=await evaluate("window.__backup.sessions.find(s=>s.date==='2026-11-09')");
  assert.equal(session.gpsWorkouts.length,1);const workout=session.gpsWorkouts[0];
  assert.equal(workout.laps.length,8);assert.equal(workout.recoveries.length,7);
  workout.laps.forEach((lap,i)=>{assert.ok(Math.abs(lap.meters-distances[i])<.1);assert.ok(Math.abs(lap.seconds-times[i])<.01);});
  workout.recoveries.forEach((rest,i)=>assert.ok(Math.abs(rest.seconds-rests[i])<.01));
  assert.ok(Math.abs(workout.seconds-times.reduce((a,b)=>a+b,0))<.01);
  const rows=await evaluate("[...document.querySelectorAll('.gps-splits-results tbody tr')].map(r=>r.textContent)");
  assert.equal(rows.length,15);assert.ok(rows[1].includes('Recovery'));assert.match(rows[0],/1,609/);
  await evaluate("document.querySelector('.gps-splits-results').scrollIntoView({block:'start',behavior:'instant'})");await screenshot('results');
  assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth"),true);
  // Reload and view the same table in History, not only the ephemeral save UI.
  const doc=await evaluate('window.__documentId');await cdp('Page.reload',{ignoreCache:true});
  await wait(`window.__documentId!==${JSON.stringify(doc)}&&Boolean(document.querySelector('.workout-lock-banner'))`);
  assert.equal(await evaluate("document.querySelectorAll('.gps-splits-results tbody tr').length"),15);
  await tap('.bottom-nav button:nth-child(4)');await wait("Boolean(document.querySelector('.history-today'))");
  await tap('.history-today');await wait("Boolean(document.querySelector('.daily-journal .gps-splits-results'))");
  assert.equal(await evaluate("document.querySelectorAll('.daily-journal .gps-splits-results tbody tr').length"),15);
  await evaluate("document.querySelector('.gps-splits-results').scrollIntoView({block:'start',behavior:'instant'})");await screenshot('history');
  assert.deepEqual(errors,[],'No uncaught save/full-screen errors');
  socket.removeEventListener('message',onMessage);
  console.log(`PASS ${width}×${height}: 8 variable repeats, 7 recoveries, mid-repeat reload, full-screen Stop, Finish/backup, reload and History table${width===375?', failed-save retry with one ID':''}.`);
 }finally{await call('Target.disposeBrowserContext',{browserContextId});}
}
try{
 for(const [width,height] of [[375,667],[393,852],[440,956]])await check(width,height);
 await check(440,956,true);
 await check(440,956,'ordinary');
}finally{socket.close();}

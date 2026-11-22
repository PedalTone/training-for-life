// External Chrome only; disposable contexts verify Plan layout and day destinations.
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const endpoint=await(await fetch(`${process.env.CHROME_CDP_URL||'http://127.0.0.1:9241'}/json/version`)).json();
const socket=new WebSocket(endpoint.webSocketDebuggerUrl);
await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
let sequence=0;const pending=new Map();
socket.addEventListener('message',event=>{const m=JSON.parse(event.data),p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result);}});
const call=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params,sessionId}));});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
try{
 for(const [width,height] of [[375,667],[393,852],[440,956]]){
  const {browserContextId}=await call('Target.createBrowserContext');
  try{
   const {targetId}=await call('Target.createTarget',{url:'about:blank',browserContextId});
   const {sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});
   const cdp=(method,params={})=>call(method,params,sessionId);
   const evaluate=async expression=>{const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
   const wait=async expression=>{for(let i=0;i<150;i++){if(await evaluate(expression))return;await delay(100);}console.log(await evaluate('document.body.innerText'));throw new Error('Timed out '+expression);};
   const tap=async selector=>{
    const p=await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw new Error('Missing button');e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;if(!e.contains(document.elementFromPoint(x,y)))throw new Error('Covered button');return{x,y};})()`);
    await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,radiusX:8,radiusY:8}]});await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await delay(150);
   };
   await cdp('Page.enable');await cdp('Runtime.enable');
   await cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});
   await cdp('Emulation.setTouchEmulationEnabled',{enabled:true});
   await cdp('Page.addScriptToEvaluateOnNewDocument',{source:"sessionStorage.setItem('t4l:entered-app','1');"});
   await cdp('Page.navigate',{url:process.env.APP_URL||'http://127.0.0.1:5192/training-for-life/app/'});
   await wait("Boolean(document.querySelector('.today-save-state'))");
   await tap('.bottom-nav button:nth-child(3)');await wait("Boolean(document.querySelector('.plan-day-strip'))");
   assert.equal(await evaluate("document.querySelectorAll('.week-page [role=img],.week-page img,.plan-featured-art').length"),0);
   assert.equal(await evaluate("document.querySelectorAll('.plan-day-strip button').length"),7);
   for(let i=1;i<=7;i++){
    await tap(`.plan-day-strip button:nth-child(${i})`);
    assert.equal(await evaluate(`document.querySelector('.plan-day-strip button:nth-child(${i})').getAttribute('aria-pressed')`),'true');
    assert.ok(await evaluate("document.querySelector('.plan-featured h2').textContent.length>0"));
   }
   assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
   await evaluate("document.querySelector('main').scrollTo({top:0,behavior:'instant'})");
   await writeFile(`/private/tmp/t4l-plan-no-graphic-${width}.png`,Buffer.from((await cdp('Page.captureScreenshot',{format:'png'})).data,'base64'));
   await tap('#plan-tab-next');await wait("Boolean(document.querySelector('.next-week-mapping'))");
   assert.equal(await evaluate("document.querySelectorAll('.schedule-editor select').length"),7);
   await tap('#plan-tab-this');await wait("Boolean(document.querySelector('.plan-open-workout'))");
   await tap('.plan-open-workout');await wait("Boolean(document.querySelector('.today-workout-summary')) || Boolean(document.querySelector('.daily-journal'))");
   const journal=await evaluate("Boolean(document.querySelector('.daily-journal'))");
   if(journal){const expected=await evaluate("(()=>{const d=new Date();d.setDate(d.getDate()+(7-d.getDay())%7);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');})()");assert.equal(await evaluate("document.querySelector('.journal-day-nav input').value"),expected);}else assert.equal(await evaluate("document.querySelector('.bottom-nav button:nth-child(2)').getAttribute('aria-current')"),'page');
   console.log(`PASS ${width}x${height}: no Plan graphic, seven day previews, Next week mapping, Open workout and overflow.`);
  }finally{await call('Target.disposeBrowserContext',{browserContextId});}
 }
}finally{socket.close();}

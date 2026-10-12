import {appendRoute,cleanRoute,locateRoute,type GpsRoute} from './gps-route';
import {GpsRouteMap} from './gps-route-map';
import {useCallback,useEffect,useRef,useState} from 'react';
import {gpsStep,gpsTime,gpsUnits,gpsPace,type GpsPoint,type GpsWorkout} from './gps-math';
type Draft={date:string;activity:'Run'|'Bike';startedAt:string;seconds:number;meters:number;maxSpeed:number;gaps:number;route?:GpsRoute;ready?:boolean};
const key='t4l:gps-draft';
export function useGpsTracker(onSave:(date:string,workout:GpsWorkout)=>Promise<void>) {
 const [draft,setDraft]=useState<Draft|null>(null);const ref=useRef<Draft|null>(null);const [running,setRunning]=useState(false);const [pending,setPending]=useState(false);const [saving,setSaving]=useState(false);const savingRef=useRef(false);const [notice,setNotice]=useState('');const [saved,setSaved]=useState<GpsWorkout|null>(null);const [savedDate,setSavedDate]=useState<string|null>(null);const [speed,setSpeed]=useState<number|null>(null);const [held,setHeld]=useState(false);const [unit,setUnit]=useState<'mi'|'km'>('mi');
 const watch=useRef<number|null>(null);const generation=useRef(0);const stationarySince=useRef<number|null>(null);const routeEdits=useRef(new Map<string,number>());const savedRef=useRef<GpsWorkout|null>(null);const onSaveRef=useRef(onSave);onSaveRef.current=onSave;const last=useRef<GpsPoint|null>(null);const clock=useRef<number|null>(null);const fixAt=useRef(0);const signalTimestamp=useRef<number|undefined>(undefined);
 const persist=(d:Draft|null,write=true)=>{ref.current=d;setDraft(d);if(!write)return;try{if(d)localStorage.setItem(key,JSON.stringify(d));else localStorage.removeItem(key);}catch{setNotice('Device storage is unavailable. Keep this page open until you save totals.');}};
 const stop=()=>{generation.current++;if(watch.current!==null){navigator.geolocation.clearWatch(watch.current);watch.current=null;}if(clock.current!==null&&ref.current){persist({...ref.current,seconds:ref.current.seconds+Math.max(0,(Date.now()-clock.current)/1000)});}clock.current=null;last.current=null;signalTimestamp.current=undefined;setSpeed(null);setHeld(false);stationarySince.current=null;setRunning(false);setPending(false);};
 useEffect(()=>{try{const raw=localStorage.getItem(key);if(raw){const d=JSON.parse(raw);if(/^\d{4}-\d{2}-\d{2}$/.test(d.date)&&['Run','Bike'].includes(d.activity)&&Number.isFinite(Date.parse(d.startedAt))&&['seconds','meters','maxSpeed','gaps'].every(k=>Number.isFinite(d[k])&&d[k]>=0)){d.route=cleanRoute(d.route);ref.current=d;setDraft(d);setNotice('Recovered paused tracking. Resume or save your totals.');}}}catch{};const visibility=()=>{if(document.hidden&&(watch.current!==null||clock.current!==null)){stop();setNotice('Tracking paused while the app was hidden. Resume when ready.');}};document.addEventListener('visibilitychange',visibility);const interval=window.setInterval(()=>{if(clock.current!==null&&ref.current){const now=Date.now();persist({...ref.current,seconds:ref.current.seconds+Math.max(0,(now-clock.current)/1000)},Math.floor(now/1000)%5===0);clock.current=now;if(now-fixAt.current>5000)setHeld(true);}},1000);return()=>{stop();clearInterval(interval);document.removeEventListener('visibilitychange',visibility);};},[]);
 useEffect(()=>{if(!running)return;let cancelled=false;let lock:{release:()=>Promise<void>}|undefined;const wake=navigator as Navigator & {wakeLock?:{request:(type:string)=>Promise<{release:()=>Promise<void>}>}};wake.wakeLock?.request('screen').then(result=>{if(cancelled)void result.release();else lock=result;}).catch(()=>{});return()=>{cancelled=true;void lock?.release();};},[running]);
 function prepare(date:string,activity:'Run'|'Bike') {
  if(clock.current!==null||watch.current!==null||savingRef.current||ref.current)return;
  persist({date,activity,startedAt:new Date().toISOString(),seconds:0,meters:0,maxSpeed:0,gaps:0,ready:true});
  setSaved(null);savedRef.current=null;setSpeed(null);setHeld(false);setNotice('Ready for your next workout. Tap Start timer when you begin.');
 }
 function start(date:string,activity:'Run'|'Bike') {
  if(clock.current!==null||watch.current!==null||savingRef.current)return;
  if(!navigator.geolocation){setNotice('Location tracking is unavailable on this device.');return;}
  const now=Date.now();const token=++generation.current;
  if(!ref.current)persist({date,activity,startedAt:new Date(now).toISOString(),seconds:0,meters:0,maxSpeed:0,gaps:0});
  else if(ref.current.ready)persist({...ref.current,ready:false,startedAt:new Date(now).toISOString()});
  clock.current=now;fixAt.current=now;setSaved(null);savedRef.current=null;setSpeed(null);setHeld(false);stationarySince.current=null;
  setRunning(true);setPending(true);setNotice('Timer started. Waiting for GPS; distance begins with a reliable fix.');last.current=null;signalTimestamp.current=undefined;
  try{watch.current=navigator.geolocation.watchPosition(position=>{
   if(token!==generation.current||clock.current===null||!ref.current)return;
   const point={latitude:position.coords.latitude,longitude:position.coords.longitude,accuracy:position.coords.accuracy,timestamp:position.timestamp,speed:position.coords.speed};
   const step=gpsStep(last.current,point,ref.current.activity,signalTimestamp.current);
   if(!step.accepted){setHeld(true);setNotice('GPS signal is weak. Timer continues; showing the last known pace or speed.');return;}
   setPending(false);
   const route=(!last.current||step.meters>0||step.gap)?appendRoute(ref.current.route,[point.longitude,point.latitude],!last.current||step.gap):ref.current.route;
   signalTimestamp.current=point.timestamp;if(!last.current||step.meters>0||step.gap)last.current=point;fixAt.current=Date.now();
   if(step.speed!==null&&step.speed>0){setSpeed(step.speed);setHeld(false);stationarySince.current=null;}
   else if(step.speed===0){stationarySince.current??=Date.now();if(Date.now()-stationarySince.current>=5000){setSpeed(0);setHeld(false);}else setHeld(true);}
   else{stationarySince.current=null;setHeld(true);}
   persist({...ref.current,route,meters:ref.current.meters+step.meters,maxSpeed:Math.max(ref.current.maxSpeed,step.speed||0),gaps:ref.current.gaps+(step.gap?1:0)});
   setNotice(step.gap?'GPS gap detected; timer continues and the missing route segment was not counted.':'GPS connected');
  },error=>{
   if(token!==generation.current)return;
   if(error.code===1){stop();setNotice('Location permission denied. Allow location in Safari settings to track.');}
   else{setHeld(true);setPending(true);setNotice('Waiting for GPS. Timer continues; showing the last known pace or speed.');}
  },{enableHighAccuracy:true,maximumAge:0,timeout:15000});}
  catch{stop();setNotice('Could not start GPS. Your totals are paused; try again.');}
 }
 async function finish(){
  if(!ref.current||ref.current.ready||savingRef.current)return;
  savingRef.current=true;setSaving(true);stop();setNotice('Timer stopped. Saving your workout…');
  try{
   const d=ref.current!;const result:GpsWorkout={id:crypto.randomUUID(),activity:d.activity,startedAt:d.startedAt,endedAt:new Date().toISOString(),seconds:d.seconds,meters:d.meters,maxSpeed:d.maxSpeed,gaps:d.gaps,route:d.route};
   await onSaveRef.current(d.date,result);setSaved(result);savedRef.current=result;setSavedDate(d.date);persist(null);setNotice('Workout saved. Record another workout when you are ready.');
   // Place lookup must never delay the stop button or the next interval.
   if(result.route&&!result.route.locationLabel){const revision=routeEdits.current.get(result.id)||0;void locateRoute(result.route).then(async route=>{
    if(!route.locationLabel||(routeEdits.current.get(result.id)||0)!==revision)return;
    const updated={...result,route};await onSaveRef.current(d.date,updated);
    if(savedRef.current?.id===result.id){setSaved(updated);savedRef.current=updated;}
   }).catch(()=>{/* Totals and route are already saved; labels can be edited. */});}
  }catch{setNotice('Could not save totals. Your timer is stopped and tracking is kept; try again.');}
  finally{savingRef.current=false;setSaving(false);}
 }
 const setRouteLabel=useCallback((label:string)=>{if(ref.current?.route)persist({...ref.current,route:{...ref.current.route,locationLabel:label}});},[]);
 const updateSavedLabel=useCallback(async(date:string,workout:GpsWorkout,label:string)=>{routeEdits.current.set(workout.id,(routeEdits.current.get(workout.id)||0)+1);const next={...workout,route:{...workout.route!,locationLabel:label}};try{await onSaveRef.current(date,next);setSaved(next);savedRef.current=next;setSavedDate(date);}catch{setNotice('Could not save map label. Try again.');}},[]);
 return {setRouteLabel,updateSavedLabel,draft,saved,savedDate,running,pending,saving,notice,speed,held,unit,setUnit,prepare,start,pause:stop,finish,discard:()=>{stop();persist(null);setSaved(null);setNotice("Unsaved GPS tracking discarded. Saved workouts are unchanged.");}};
}
export function GpsTracker({tracker,date,savedWorkouts=[]}:{tracker:ReturnType<typeof useGpsTracker>;date:string;savedWorkouts?:GpsWorkout[]}) {const [activity,setActivity]=useState<'Run'|'Bike'>('Run');const t=tracker;const completed=(t.savedDate===date?t.saved:null)||savedWorkouts.at(-1);const data=t.draft||completed;const totals=gpsUnits(data?.meters||0,data?.seconds||0,t.unit);const isRun=(data?.activity||activity)==='Run';const metricUnit=isRun?`min/${t.unit==='mi'?'mile':'km'}`:t.unit==='mi'?'mph':'km/h';const average=isRun?gpsPace(data?.seconds?data.meters/data.seconds:null,t.unit):totals.average;const current=isRun?gpsPace(t.speed,t.unit):t.speed===null?'—':(t.speed*3600/(t.unit==='mi'?1609.344:1000)).toFixed(1);
 const recordings=t.savedDate===date&&t.saved&&!savedWorkouts.some(item=>item.id===t.saved!.id)?[...savedWorkouts,t.saved]:savedWorkouts;
 const labelHandler=useCallback((label:string)=>{if(t.draft)t.setRouteLabel(label);else if(completed)void t.updateSavedLabel(date,completed,label);},[Boolean(t.draft),t.setRouteLabel,t.updateSavedLabel,date,completed]);
 return <details className="gps-card" open={Boolean(t.draft||completed)}><summary><span><b>Track my run / bike</b><small>{t.draft?`${t.draft.activity} · ${t.draft.ready?'Ready':t.running?(t.pending?'Recording · waiting for GPS':'Recording'):'Paused'}`:completed?'Workout saved · GPS totals':'Time, distance, pace or speed and route map'}</small></span><span aria-hidden="true">⌖</span></summary><div className="gps-body"><p>Keep the app visible. Tracking pauses when it’s hidden.</p>{t.draft&&t.draft.date!==date&&<p>Tracking belongs to {t.draft.date}; totals will save to that day.</p>}<div className="gps-options"><label>Activity<select disabled={Boolean(t.draft||completed)} value={data?.activity||activity} onChange={e=>setActivity(e.target.value as 'Run'|'Bike')}><option>Run</option><option>Bike</option></select></label><label>Units<select value={t.unit} onChange={e=>t.setUnit(e.target.value as 'mi'|'km')}><option value="mi">{isRun?'Miles / min/mi':'Miles / mph'}</option><option value="km">{isRun?'Kilometers / min/km':'Kilometers / km/h'}</option></select></label></div><dl className="gps-metrics"><div><dt>Elapsed time</dt><dd>{gpsTime(data?.seconds||0)}</dd></div><div><dt>Distance</dt><dd>{totals.distance}<small> {t.unit}</small></dd></div><div><dt>{isRun?'Current pace':'Current speed'}</dt><dd>{current}<small> {metricUnit}</small></dd></div><div className={isRun?'gps-inline-pace':undefined}><dt>{isRun?'Avg Pace:':'Average speed'}</dt><dd>{average}<small> {metricUnit}</small></dd></div></dl><p className="gps-caption">{t.held&&t.speed!==null?'Showing last known pace or speed while waiting for a reliable GPS update. ':''}Average includes stops while recording; pauses are excluded. GPS measurements are estimates.{t.draft?.gaps ? ` ${t.draft.gaps} signal gaps; distance may be incomplete.`:''}</p><div className="gps-actions">{t.running||t.pending?<button key="timer-toggle" type="button" disabled={t.saving} onClick={t.pause}>Pause timer</button>:<button key="timer-toggle" type="button" className={completed&&!t.draft?"gps-record-another":undefined} disabled={t.saving} onClick={()=>completed&&!t.draft?t.prepare(date,completed.activity):t.start(date,activity)}>{t.draft&&!t.draft.ready?'Resume timer':completed&&!t.draft?'Record another workout':'Start timer'}</button>}{t.draft&&!t.draft.ready&&<button key="timer-save" type="button" disabled={t.saving} onClick={()=>void t.finish()}>{t.saving?'Saving…':'Stop + save workout'}</button>}</div>{t.draft&&!t.running&&!t.pending&&!t.saving&&<details className="gps-discard"><summary>Discard options</summary><button type="button" onClick={()=>{if(window.confirm('Discard these unsaved GPS totals? Your saved workouts will stay unchanged.'))t.discard();}}>Discard unsaved tracking</button></details>}{recordings.length>0&&<section className="gps-recordings" aria-label="Saved recordings"><h3>Saved recordings <span>{recordings.length}</span></h3><p>Saved for this day, including while you record the next interval.</p><ol>{recordings.map((item,index)=>{const distance=gpsUnits(item.meters,item.seconds,t.unit).distance;return <li key={item.id}><span className="gps-saved-check" aria-label="Saved">✓</span><div><strong>{index+1}. {item.activity}</strong><small>{new Date(item.startedAt).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})} · {distance} {t.unit} · {gpsTime(item.seconds)}</small></div><span className="gps-saved-label">Saved</span></li>;})}</ol></section>}{data?.route&&<GpsRouteMap route={data.route} onLabel={t.saving?undefined:labelHandler}/>} <details className="gps-about"><summary>About GPS &amp; route maps</summary><p>Routes are saved on this device and in your backups. Street maps share the viewed area with OpenStreetMap; place labels share sampled coordinates with Photon.</p></details>{t.notice&&<p role="status">{t.notice}</p>}</div></details>;
}

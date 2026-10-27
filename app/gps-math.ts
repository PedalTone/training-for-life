import type { GpsRoute } from './gps-route';
export type GpsPoint = {latitude:number;longitude:number;accuracy:number;timestamp:number;speed:number|null};
export type GpsLap = {number:number;meters:number;seconds:number;startedAt:string;endedAt:string};
export const GPS_ACTIVITIES=['Run','Walk','Bike'] as const;
export type GpsActivity=typeof GPS_ACTIVITIES[number];
export const isGpsActivity=(value:unknown):value is GpsActivity=>GPS_ACTIVITIES.some(activity=>activity===value);
export const gpsUsesPace=(activity:GpsActivity)=>activity!=='Bike';
export type GpsWorkout = {id:string;activity:GpsActivity;startedAt:string;endedAt:string;seconds:number;meters:number;maxSpeed:number;gaps:number;route?:GpsRoute;laps?:GpsLap[]};
export function gpsDistance(a:GpsPoint,b:GpsPoint) {const rad=Math.PI/180;const lat=(b.latitude-a.latitude)*rad;const lon=(b.longitude-a.longitude)*rad;const h=Math.sin(lat/2)**2+Math.cos(a.latitude*rad)*Math.cos(b.latitude*rad)*Math.sin(lon/2)**2;return 6371000*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));}
export function gpsStep(previous:GpsPoint|null,point:GpsPoint,activity:GpsActivity,lastSignalTimestamp=previous?.timestamp) {
 const valid=Number.isFinite(point.latitude)&&Math.abs(point.latitude)<=90&&Number.isFinite(point.longitude)&&Math.abs(point.longitude)<=180&&Number.isFinite(point.timestamp)&&Number.isFinite(point.accuracy)&&point.accuracy>=0&&point.accuracy<=35;
 if(!valid)return {accepted:false,meters:0,speed:null,gap:false};
 if(!previous)return {accepted:true,meters:0,speed:null,gap:false};
 const seconds=(point.timestamp-previous.timestamp)/1000;
 if(seconds<=0 || (lastSignalTimestamp!==undefined && point.timestamp<=lastSignalTimestamp))return {accepted:false,meters:0,speed:null,gap:false};
 if(lastSignalTimestamp!==undefined && (point.timestamp-lastSignalTimestamp)/1000>30)return {accepted:true,meters:0,speed:null,gap:true};
 const meters=gpsDistance(previous,point);const ceiling=activity==='Bike'?55:20;
 if(meters/seconds>ceiling)return {accepted:false,meters:0,speed:null,gap:false};
 const moving=meters>=Math.max(3,Math.min(previous.accuracy,point.accuracy)*.3);
 const speed=moving ? (Number.isFinite(point.speed)&&point.speed!==null&&point.speed>0&&point.speed<=ceiling?point.speed:meters/seconds):0;
 return {accepted:true,meters:moving?meters:0,speed,gap:false};
}
export function gpsUnits(meters:number,seconds:number,unit:'mi'|'km') {const scale=unit==='mi'?1609.344:1000;return {distance:(meters/scale).toFixed(2),average:seconds>0?(meters/seconds*3600/scale).toFixed(1):'0.0'};}
export function gpsTime(seconds:number) {const s=Math.floor(Math.max(0,seconds));return `${Math.floor(s/3600).toString().padStart(2,'0')}:${Math.floor(s%3600/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;}

// Pace is rounded to whole seconds; no movement has no finite pace.
export function gpsPace(speed:number|null,unit:'mi'|'km'='mi') {
 if(speed===null || !Number.isFinite(speed) || speed<=0)return '—';
 const seconds=Math.round((unit==='mi'?1609.344:1000)/speed);
 return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
}

// Auto-resume needs its own short movement window. Per-fix walking steps can be
// smaller than the distance filter, and the whole stopped duration is not pace.
export type GpsResumeState={anchor:GpsPoint|null;previous:GpsPoint|null};
export const newGpsResumeState=():GpsResumeState=>({anchor:null,previous:null});
export function gpsResumeStep(state:GpsResumeState,point:GpsPoint,now:number,activity:GpsActivity) {
 const empty={state:newGpsResumeState(),speed:null as number|null,moving:false,reliable:false};
 if(!gpsStep(state.previous,point,activity).accepted||point.accuracy>20||!Number.isFinite(now)||now-point.timestamp>5000||now-point.timestamp< -1000)return empty;
 const anchor=state.anchor;
 const reset=()=>({state:{anchor:point,previous:point},speed:null as number|null,moving:false,reliable:true});
 if(!anchor||!state.previous||point.timestamp-state.previous.timestamp>5000||point.timestamp-anchor.timestamp>10000)return reset();
 const meters=gpsDistance(anchor,point),seconds=(point.timestamp-anchor.timestamp)/1000;
 // Refresh at a true standstill so minutes of stopped time never dilute speed.
 if(meters<=0.25)return reset();
 const speed=seconds>0?meters/seconds:null;
 const threshold=Math.max(5,Math.min(anchor.accuracy,point.accuracy)*0.3);
 const before=gpsDistance(anchor,state.previous);
 // Require progressive displacement, not a single GPS jump or speed-only spike.
 const moving=seconds>=2&&meters>=threshold&&before>=threshold*0.6&&meters>before+0.25;
 return {state:{anchor,previous:point},speed,moving,reliable:true};
}

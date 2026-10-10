export type GpsPoint = {latitude:number;longitude:number;accuracy:number;timestamp:number;speed:number|null};
export type GpsWorkout = {id:string;activity:'Run'|'Bike';startedAt:string;endedAt:string;seconds:number;meters:number;maxSpeed:number;gaps:number};
export function gpsDistance(a:GpsPoint,b:GpsPoint) {const rad=Math.PI/180;const lat=(b.latitude-a.latitude)*rad;const lon=(b.longitude-a.longitude)*rad;const h=Math.sin(lat/2)**2+Math.cos(a.latitude*rad)*Math.cos(b.latitude*rad)*Math.sin(lon/2)**2;return 6371000*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));}
export function gpsStep(previous:GpsPoint|null,point:GpsPoint,activity:'Run'|'Bike',lastSignalTimestamp=previous?.timestamp) {
 const valid=Number.isFinite(point.latitude)&&Math.abs(point.latitude)<=90&&Number.isFinite(point.longitude)&&Math.abs(point.longitude)<=180&&Number.isFinite(point.timestamp)&&Number.isFinite(point.accuracy)&&point.accuracy>=0&&point.accuracy<=35;
 if(!valid)return {accepted:false,meters:0,speed:null,gap:false};
 if(!previous)return {accepted:true,meters:0,speed:null,gap:false};
 const seconds=(point.timestamp-previous.timestamp)/1000;
 if(seconds<=0 || (lastSignalTimestamp!==undefined && point.timestamp<=lastSignalTimestamp))return {accepted:false,meters:0,speed:null,gap:false};
 if(lastSignalTimestamp!==undefined && (point.timestamp-lastSignalTimestamp)/1000>30)return {accepted:true,meters:0,speed:null,gap:true};
 const meters=gpsDistance(previous,point);const ceiling=activity==='Run'?20:55;
 if(meters/seconds>ceiling)return {accepted:false,meters:0,speed:null,gap:false};
 const moving=meters>=Math.max(3,Math.min(previous.accuracy,point.accuracy)*.3);
 const speed=moving ? (Number.isFinite(point.speed)&&point.speed!==null&&point.speed>=0&&point.speed<=ceiling?point.speed:meters/seconds):0;
 return {accepted:true,meters:moving?meters:0,speed,gap:false};
}
export function gpsUnits(meters:number,seconds:number,unit:'mi'|'km') {const scale=unit==='mi'?1609.344:1000;return {distance:(meters/scale).toFixed(2),average:seconds>0?(meters/seconds*3600/scale).toFixed(1):'0.0'};}
export function gpsTime(seconds:number) {const s=Math.floor(Math.max(0,seconds));return `${Math.floor(s/3600).toString().padStart(2,'0')}:${Math.floor(s%3600/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;}

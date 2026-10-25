import {isGpsActivity,type GpsWorkout} from './gps-math.ts';
import {cleanRoute} from './gps-route.ts';
export const GPS_RECOVERY_KEY='t4l:gps-last-save';
export type GpsRecovery={date:string;workout:GpsWorkout};
export function readGpsRecovery(storage:Pick<Storage,'getItem'>=localStorage):GpsRecovery|null {
 try{
  const value=JSON.parse(storage.getItem(GPS_RECOVERY_KEY)||'null');const w=value?.workout;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value?.date)||!w||typeof w.id!=='string'||!w.id||!isGpsActivity(w.activity)||!Number.isFinite(Date.parse(w.startedAt))||!Number.isFinite(Date.parse(w.endedAt))||!['seconds','meters','maxSpeed','gaps'].every(key=>Number.isFinite(w[key])&&w[key]>=0))return null;
  return {date:value.date,workout:{...w,route:cleanRoute(w.route)}};
 }catch{return null;}
}
export function writeGpsRecovery(date:string,workout:GpsWorkout) {localStorage.setItem(GPS_RECOVERY_KEY,JSON.stringify({date,workout}));}
export function clearGpsRecovery(id:string) {
 const raw=localStorage.getItem(GPS_RECOVERY_KEY);if(!raw)return;
 let receipt:GpsRecovery;try{receipt=JSON.parse(raw);}catch{return;}
 if(receipt?.workout?.id!==id)return;
 localStorage.removeItem(GPS_RECOVERY_KEY);
 if(localStorage.getItem(GPS_RECOVERY_KEY)===raw)throw new Error('Could not clear the stopped recording copy.');
}

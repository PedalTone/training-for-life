import type {GpsLap,GpsRecoveryInterval,GpsWorkout} from './gps-math.ts';

export type LapProgress = {
 repeatStart: {meters:number;seconds:number;at:string}|null;
 recoveryStartedAt: string|null;
};
export type LapDraft = {
 startedAt:string;seconds:number;meters:number;lapMode?:boolean;
 laps?:GpsLap[];recoveries?:GpsRecoveryInterval[];lapProgress?:LapProgress;
};

// The active repeat boundary is durable. Reload/background pause must not reset
// it to the current totals and silently discard the first part of the repeat.
export function lapProgress(draft:LapDraft):LapProgress {
 if(draft.lapProgress)return draft.lapProgress;
 const laps=draft.laps||[];
 const meters=laps.reduce((sum,lap)=>sum+lap.meters,0);
 const seconds=laps.reduce((sum,lap)=>sum+lap.seconds,0);
 const last=laps.at(-1);
 // Older drafts did not store their phase; recognize a just-completed repeat.
 if(last&&Math.abs(draft.meters-meters)<.01&&Math.abs(draft.seconds-seconds)<1.1)
  return {repeatStart:null,recoveryStartedAt:last.endedAt};
 return {repeatStart:{meters,seconds,at:last?.endedAt||draft.startedAt},recoveryStartedAt:null};
}

function inferredRecoveries(laps:GpsLap[]):GpsRecoveryInterval[] {
 return laps.flatMap((lap,index)=>{
  const next=laps[index+1],seconds=next?(Date.parse(next.startedAt)-Date.parse(lap.endedAt))/1000:0;
  return Number.isFinite(seconds)&&seconds>0?[{afterRepeat:lap.number,seconds,startedAt:lap.endedAt,endedAt:next.startedAt,estimated:true}]:[];
 });
}

function closeRecovery<T extends LapDraft>(draft:T,at:string):T {
 const start=lapProgress(draft).recoveryStartedAt;
 if(!start)return draft;
 const seconds=Math.max(0,(Date.parse(at)-Date.parse(start))/1000);
 const recoveries=[...(draft.recoveries??inferredRecoveries(draft.laps||[]))];
 if(Number.isFinite(seconds)&&seconds>0)recoveries.push({afterRepeat:draft.laps?.length||0,seconds,startedAt:start,endedAt:at});
 return {...draft,recoveries,lapProgress:{repeatStart:null,recoveryStartedAt:null}};
}

export function beginRepeat<T extends LapDraft>(draft:T,at:string):T {
 if(!draft.lapMode)return draft;
 const progress=lapProgress(draft);
 if(progress.repeatStart)return {...draft,lapProgress:progress};
 const next=closeRecovery(draft,at);
 return {...next,lapProgress:{repeatStart:{meters:next.meters,seconds:next.seconds,at},recoveryStartedAt:null}};
}

export function endRepeat<T extends LapDraft>(draft:T,at:string,recover=true):T {
 if(!draft.lapMode)return draft;
 const start=lapProgress(draft).repeatStart;
 if(!start)return recover?draft:closeRecovery(draft,at);
 const seconds=Math.max(0,draft.seconds-start.seconds),meters=Math.max(0,draft.meters-start.meters);
 const laps=[...(draft.laps||[])];
 // A repeat with poor GPS still has a real time, even if distance is zero.
 if(seconds>0||meters>0)laps.push({number:laps.length+1,meters,seconds,startedAt:start.at,endedAt:at});
 return {...draft,laps,lapProgress:{repeatStart:null,recoveryStartedAt:recover?at:null}};
}

export function currentRepeat(draft:LapDraft) {
 const start=lapProgress(draft).repeatStart;
 if(!start)return draft.laps?.at(-1)||{seconds:0,meters:0};
 return {seconds:Math.max(0,draft.seconds-start.seconds),meters:Math.max(0,draft.meters-start.meters)};
}

export type GpsSegment = {kind:'repeat'|'recovery';number:number;seconds:number;meters:number|null;estimated?:boolean};
export function gpsSegments(workout:Pick<GpsWorkout,'laps'|'recoveries'>):GpsSegment[] {
 const laps=workout.laps||[],rows:GpsSegment[]=[];
 const recoveries=workout.recoveries??inferredRecoveries(laps);
 laps.forEach(lap=>{
  rows.push({kind:'repeat',number:lap.number,seconds:lap.seconds,meters:lap.meters});
  for(const recovery of recoveries.filter(item=>item.afterRepeat===lap.number))
   rows.push({kind:'recovery',number:lap.number,seconds:recovery.seconds,meters:null,...(recovery.estimated?{estimated:true}:{})});
 });
 return rows;
}

export function splitTime(seconds:number) {
 const tenths=Math.round(Math.max(0,seconds)*10);
 const whole=Math.floor(tenths/10),hours=Math.floor(whole/3600);
 return `${hours?hours+':':''}${hours?String(Math.floor(whole%3600/60)).padStart(2,'0'):Math.floor(whole/60)}:${String(whole%60).padStart(2,'0')}.${tenths%10}`;
}

// Fresh, consecutive GPS evidence is required. Missing GPS is never a stop.
export const AUTO_PAUSE_DELAY_MS=4000;
export const AUTO_PAUSE_SPEED=0.5; // metres/second (~1.1 mph)
export const AUTO_RESUME_SPEED=0.9; // separate threshold avoids stop/start chatter
export type AutoPauseState={paused:boolean;lowSince:number|null;lastAt:number|null};
export const newAutoPauseState=():AutoPauseState=>({paused:false,lowSince:null,lastAt:null});
export function autoPauseStep(state:AutoPauseState,fix:{at:number;now:number;speed:number|null;reliable:boolean;moving:boolean},enabled=true):{state:AutoPauseState;transition:'pause'|'resume'|null} {
 if(!enabled)return {state:newAutoPauseState(),transition:state.paused?'resume':null};
 const valid=fix.reliable&&Number.isFinite(fix.at)&&Number.isFinite(fix.now)&&fix.now-fix.at>=-1000&&fix.now-fix.at<=5000&&fix.speed!==null&&Number.isFinite(fix.speed)&&fix.speed>=0&&(state.lastAt===null||fix.at>state.lastAt);
 if(!valid)return {state:{...state,lowSince:null,lastAt:null},transition:null};
 const speed=fix.speed as number;
 const continuous=state.lastAt!==null&&fix.at-state.lastAt<=5000;
 if(state.paused){
  if(speed>=AUTO_RESUME_SPEED&&fix.moving)return {state:{paused:false,lowSince:null,lastAt:fix.at},transition:'resume'};
  return {state:{paused:true,lowSince:null,lastAt:fix.at},transition:null};
 }
 if(speed>AUTO_PAUSE_SPEED)return {state:{paused:false,lowSince:null,lastAt:fix.at},transition:null};
 const lowSince=continuous&&state.lowSince!==null?state.lowSince:fix.at;
 const paused=fix.at-lowSince>=AUTO_PAUSE_DELAY_MS;
 return {state:{paused,lowSince,lastAt:fix.at},transition:paused?'pause':null};
}

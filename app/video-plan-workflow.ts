import {canonicalVideoURL,validateVideoPlan,type VideoTrainingPlan,type VideoExercise} from './video-training-plan.ts';

export const TRANSCRIPT_WEBSITE='https://youtubetotranscript.com/';
export const TRANSCRIPT_FORM_ACTION=TRANSCRIPT_WEBSITE+'transcript';
const FLOW_KEY='t4l:video-plan-workflow-v1';
type VideoLink={url:string;videoId?:string};
type Flow={videoId:string;transcript:string;draft:VideoTrainingPlan|null;stage:'transcript'|'review'};
type StorageLike=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
function flowStorage():StorageLike|undefined{try{return typeof window==='undefined'?undefined:window.sessionStorage;}catch{return undefined;}}
export function transcriptVideoURL(video:VideoLink){return canonicalVideoURL(video);}
export function videoRepLabel(reps:string){return reps?reps.endsWith(' per side')?reps.slice(0,-9)+' reps per side':reps+' reps':'';}
export function exercisePlanSummary(exercise:VideoExercise){
 const targets=exercise.sets.map(set=>videoRepLabel(set.reps)||set.work||'');
 const target=new Set(targets).size>1?'Varied targets':targets[0]||'';
 return [exercise.setsSpecified?`${exercise.sets.length} ${exercise.sets.length===1?'set':'sets'}`:'',target||'Reps/time not specified'].filter(Boolean).join(' · ');
}
export function openVideoTranscript(video:VideoLink,documentRef:Document=document):boolean{
 const url=transcriptVideoURL(video);if(!url)return false;
 // Use the website's actual public form, not an assumed query-string prefill.
 const form=documentRef.createElement('form');form.method='post';form.action=TRANSCRIPT_FORM_ACTION;form.target='_blank';form.rel='noopener noreferrer';form.hidden=true;
 const field=documentRef.createElement('input');field.type='hidden';field.name='youtube_url';field.value=url;form.append(field);documentRef.body.append(form);
 try{form.submit();return true;}catch{return false;}finally{form.remove();}
}
export function readVideoPlanFlow(storage=flowStorage()):Flow|undefined{
 try{const raw=storage?.getItem(FLOW_KEY)||'null';if(raw.length>750_000)return;const value=JSON.parse(raw);if(!value||typeof value.videoId!=='string'||!/^[\w-]{11}$/.test(value.videoId)||typeof value.transcript!=='string'||value.transcript.length>300_000)return;
 const draft=validateVideoPlan(value.draft)||null;return {videoId:value.videoId,transcript:value.transcript,draft,stage:value.stage==='review'&&draft?'review':'transcript'};
 }catch{return;}
}
export function writeVideoPlanFlow(value:Flow,storage=flowStorage()){
 if(!/^[\w-]{11}$/.test(value.videoId)||value.transcript.length>300_000)return;
 try{const serialized=JSON.stringify(value);if(serialized.length<=750_000)storage?.setItem(FLOW_KEY,serialized);}catch{/* A draft can still be reviewed without session storage. */}
}
export function clearVideoPlanFlow(videoId:string,storage=flowStorage()){
 try{if(readVideoPlanFlow(storage)?.videoId===videoId)storage?.removeItem(FLOW_KEY);}catch{/* Saved plans are independent of this temporary workflow. */}
}

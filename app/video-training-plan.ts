import {findTranscriptExercises,transcriptGuidance} from './transcript-exercises.ts';
export type PlannedVideoSet = { id:string; reps:string; work:string; rest:string };
export type VideoExercise = { id:string; name:string; setsSpecified:boolean; sets:PlannedVideoSet[]; evidence:string };
export type VideoTrainingPlan = { version:1; exercises:VideoExercise[]; notes:string; source:'transcript'|'manual'; reviewedAt:string };
export type VideoSetResult = { weight:string; unit:'lb'|'kg'; load:'single'|'pair'|'bodyweight'; reps:string; work:string; done:boolean; warmup:boolean };
export const emptyResult = ():VideoSetResult => ({weight:'',unit:'lb',load:'single',reps:'',work:'',done:false,warmup:false});
export const emptyPlannedSet = ():PlannedVideoSet => ({id:crypto.randomUUID(),reps:'',work:'',rest:''});
export const emptyVideoExercise = ():VideoExercise => ({id:crypto.randomUUID(),name:'',setsSpecified:false,sets:[emptyPlannedSet()],evidence:''});
const words:Record<string,number> = {one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,fifty:50,sixty:60,ninety:90};
function numbers(text:string) { return text.toLowerCase().replace(/\b(twenty|thirty|forty|fifty|sixty|ninety)[ -](one|two|three|four|five|six|seven|eight|nine)\b/g,(_,a,b)=>String(words[a]+words[b])).replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|ninety)\b/g,w=>String(words[w])); }
export function cleanCaptions(text:string) {
 if(text.length>300_000)throw new Error('Choose a transcript shorter than 300,000 characters.');
 const lines=text.replace(/\r/g,'').split('\n'),out:string[]=[];let previous='';let metadata=false;
 for(let index=0;index<lines.length;index++){const raw=lines[index];const line=raw.trim();if(/^(?:NOTE|STYLE|REGION)(?:\s|$)/.test(line)){metadata=true;continue;}if(!line){metadata=false;continue;}if(metadata||/^WEBVTT|^Kind:|^Language:|-->/.test(line)||/^\d+$/.test(line)&&lines[index+1]?.includes('-->'))continue;
 const plain=line.replace(/^\[?(?:\d{1,2}:)?\d{1,2}:\d{2}(?:[.,]\d{1,3})?\]?(?:\s+|$)/,'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\[(?:music|applause)\]/gi,'').trim();if(!plain||plain===previous)continue;
 // YouTube auto-captions repeat a rolling window. Remove overlap, not repeated sets.
 const a=previous.split(/\s+/),b=plain.split(/\s+/);let overlap=0;
 for(let n=Math.min(a.length,b.length);n>=2;n--)if(a.slice(-n).join(' ')===b.slice(0,n).join(' ')){overlap=n;break;}
 const fresh=b.slice(overlap).join(' ');if(fresh)out.push(fresh);previous=plain;
 }return out.join('\n');
}
function explicitWorkoutProtocol(text:string) {
 // A named workout list followed by an explicit protocol can supersede examples
 // earlier in a video. Keep this narrow; an ordinary exercise mention is not a list.
 const compact=text.replace(/\s+/g,' ');
 let selected:{list:string;instructions:string;sharedWork:string}|undefined;
 for(const marker of compact.matchAll(/\b(?:the\s+)?exercises\s+are\s+/gi)){
  if(!/\bworkout\b/i.test(compact.slice(Math.max(0,marker.index!-160),marker.index)))continue;
  const start=marker.index!+marker[0].length,tail=compact.slice(start,start+1500);
  const protocol=/\b(?:the\s+)?protocol\s+is\b/i.exec(tail);
  if(!protocol||protocol.index>350)continue;
  const list=tail.slice(0,protocol.index).replace(/[.!?]+\s*$/,'').trim();
  const listed=findTranscriptExercises(list,{allowBarePress:true});
  // Unknown movements make the scope uncertain, so leave the usual draft path alone.
  let remainder=list;for(const mention of [...listed].reverse())remainder=remainder.slice(0,mention.index)+remainder.slice(mention.index+mention.text.length);remainder=remainder.replace(/\b(?:and|the|a|an|then)\b/gi,'');
  if(listed.length<2||listed.length>10||/[^\s,;:&/.-]/.test(remainder))continue;
  const instructions=tail.slice(protocol.index+protocol[0].length,protocol.index+protocol[0].length+700).trim();
  const duration=numbers(instructions).match(/\b(\d{1,2})\s+exercises\s+for\s+(\d{1,3}(?:\s*(?:to|[-–])\s*\d{1,3})?\s*(?:seconds?|secs?|minutes?|mins?))\s+per\s+exercise\b/i);
  // Scope only the supported shared-time protocol. Other prescriptions must
  // remain in the full source, including later corrections or exact set targets.
  if(!duration||Number(duration[1])!==listed.length)return;
  const later=compact.slice(start+protocol.index+protocol[0].length);
  if(findTranscriptExercises(later,{allowBarePress:true}).length)return;
  // Multiple workouts need review; never silently discard a later protocol.
  if(selected)return;
  selected={list,instructions,sharedWork:duration[2]};
 }
 return selected;
}
export function draftVideoPlan(captions:string):VideoTrainingPlan {
 const text=cleanCaptions(captions);if(!text.trim())throw new Error('No caption text found. Paste or upload the transcript first.');
 const protocol=explicitWorkoutProtocol(text),source=protocol?.list||text;
 const matches=findTranscriptExercises(source,{allowBarePress:Boolean(protocol)});const rows:VideoExercise[]=[];const seen=new Set<string>();
 for(let i=0;i<matches.length&&rows.length<60;i++){
  const match=matches[i],start=match.index,end=matches[i+1]?.index??Math.min(source.length,start+240);
  const before=source.slice(Math.max(0,start-70),start).split(/[.!?\n]/).at(-1)||'';
  if(/\b(?:not doing|won't do|do not(?: do)?|don't(?: do)?|skip|avoid|instead of|no|not)\s*(?:(?:any|a|the)\s*)?$/i.test(before))continue;
  const name=match.name;
  const after=source.slice(start,Math.min(end,start+240)).split(/\n\s*\n/)[0];
  const prefix=numbers(before);const local=numbers(after);const context=local.split(/\b(?:then|up next|next|move into|move to|EMOM|AMRAP|every minute on the minute|as many (?:rounds|reps) as possible)\b/i)[0];
  const setText=context.match(/\b(\d{1,2}(?:\s*(?:to|[-–])\s*\d{1,2})?)\s*sets?\b/)?.[1]||prefix.match(/\b(\d{1,2})\s*sets?(?:\s+of\s+\d{1,3})?\s*$/)?.[1]||'';
  const count=/^\d+$/.test(setText)&&Number(setText)<=20&&Number(setText)>0?Number(setText):0;
  const perSide=/\b(?:per (?:side|arm|leg)|(?:on )?each (?:side|arm|leg))\b/i.test(context);
  let reps=context.match(/\bsets?\s+of\s+(\d{1,3}(?:\s*(?:to|[-–])\s*\d{1,3})?)\b/)?.[1]||context.match(/\b(\d{1,3}(?:\s*(?:to|[-–])\s*\d{1,3})?)\s*(?:reps?|repetitions?)\b/)?.[1]||context.match(/\b(\d{1,3}(?:\s*(?:to|[-–])\s*\d{1,3})?)\s*(?:per|(?:on )?each)\s*(?:side|arm|leg)\b/)?.[1]||prefix.match(/\b(\d{1,3})\s*$/)?.[1]||'';
  if(reps&&perSide)reps+=' per side';
  const rest=context.match(/\b(?:rest|recovery|break)(?:\s+for)?\s+(\d{1,3}(?:\s*(?:to|[-–])\s*\d{1,3})?\s*(?:seconds?|secs?|minutes?|mins?))\b/)?.[1]||context.match(/\b(\d{1,3}\s*(?:seconds?|secs?|minutes?|mins?))\s*(?:of\s+)?(?:rest|recovery|break)\b/)?.[1]||'';
  const withoutRest=context.replace(/\b(?:rest|recovery|break)(?:\s+for)?\s+\d{1,3}(?:\s*(?:to|[-–])\s*\d{1,3})?\s*(?:seconds?|secs?|minutes?|mins?)\b/g,'').replace(/\b\d{1,3}\s*(?:seconds?|secs?|minutes?|mins?)\s*(?:of\s+)?(?:rest|recovery|break)\b/g,'');
  const duration='(\\d{1,3}(?:\\s*(?:to|[-–])\\s*\\d{1,3})?\\s*(?:seconds?|secs?|minutes?|mins?))';
  const body=withoutRest.slice(numbers(match.text).length).replace(/^[\s:,-]+/,'');
  const prefixWork=/\b(?:emom|amrap|every minute|as many|rounds?|circuits?|total|workout|block)\b/i.test(prefix)?'':prefix.match(new RegExp('\\bfor\\s+'+duration+'\\s*$'))?.[1]||'';
  let work=body.match(new RegExp('^'+duration+'\\b'))?.[1]||withoutRest.match(new RegExp('\\b(?:for|hold(?:\\s+for)?|work(?:\\s+for)?)\\s+'+duration+'\\b'))?.[1]||withoutRest.match(new RegExp('\\b'+duration+'\\s*(?:of\\s+)?work\\b'))?.[1]||prefixWork||protocol?.sharedWork||'';
  if(work&&perSide)work+=' per side';
  if(seen.has(name)&&!count&&!reps&&!work)continue;
  seen.add(name);
  rows.push({id:crypto.randomUUID(),name,setsSpecified:Boolean(count),sets:Array.from({length:count||1},()=>({...emptyPlannedSet(),reps,work,rest})),evidence:(before+' '+after).trim().slice(0,320)});
 }
 const overview=protocol?protocol.instructions:transcriptGuidance(text);
 return {version:1,exercises:rows,source:'transcript',reviewedAt:'',notes:(overview?'Transcript instructions to review:\n'+overview+'\n\n':'')+'Draft from explicit transcript instructions. Check exercise order and instructions against the video. Unknown set counts use one blank logging row; add rows as needed. Circuit rounds and instructions that do not name an exercise are not expanded automatically.'};
}
function text(value:unknown,max=500):string{return typeof value==='string'?value.slice(0,max):'';}
export function validateVideoPlan(value:unknown):VideoTrainingPlan|undefined {
 if(!value||typeof value!=='object')return;const plan=value as VideoTrainingPlan;
 if(plan.version!==1||!Array.isArray(plan.exercises)||plan.exercises.length>60)return;
 const ids=new Set<string>();let total=0;
 const rows:VideoExercise[]=[];
 for(const row of plan.exercises){if(!row||!Array.isArray(row.sets)||!row.sets.length||row.sets.length>20||!text(row.id)||!text(row.name).trim()||ids.has(row.id)||['__proto__','constructor','prototype'].includes(row.id))return;ids.add(row.id);
  const sets:PlannedVideoSet[]=[];for(const set of row.sets){if(!set||!text(set.id)||ids.has(set.id)||['__proto__','constructor','prototype'].includes(set.id))return;ids.add(set.id);sets.push({id:text(set.id),reps:text(set.reps,80),work:text(set.work,80),rest:text(set.rest,80)});}total+=sets.length;if(total>500)return;
  rows.push({id:text(row.id),name:text(row.name,160).trim(),setsSpecified:row.setsSpecified===true,sets,evidence:text(row.evidence,500)});
 }
 if(!rows.length)return;
 return {version:1,exercises:rows,source:plan.source==='transcript'?'transcript':'manual',notes:text(plan.notes,3000),reviewedAt:text(plan.reviewedAt,80)};
}
export function sanitizeVideoTraining<T extends object>(video:T):T {
 if(!video||typeof video!=='object')return video;
 const raw=video as T&{trainingPlan?:unknown;trainingResults?:unknown};
 if(!('trainingPlan' in raw)&&!('trainingResults' in raw))return video;
 const trainingPlan=validateVideoPlan(raw.trainingPlan);const trainingResults:Record<string,VideoSetResult>={};
 const allowed=new Set(trainingPlan?.exercises.flatMap(row=>row.sets.map(set=>set.id))||[]);
 if(raw.trainingResults&&typeof raw.trainingResults==='object')for(const [id,item] of Object.entries(raw.trainingResults)){if(!allowed.has(id)||!item||typeof item!=='object')continue;const value=item as VideoSetResult;trainingResults[id]={weight:text(value.weight,40),unit:value.unit==='kg'?'kg':'lb',load:['single','pair','bodyweight'].includes(value.load)?value.load:'single',reps:text(value.reps,80),work:text(value.work,80),done:value.done===true,warmup:value.warmup===true};}
 return {...video,trainingPlan,trainingResults:Object.keys(trainingResults).length?trainingResults:undefined};
}
export function videoForNextWorkout<T extends object>(video:T):T {
 const next={...sanitizeVideoTraining(video)} as T&{trainingResults?:unknown};delete next.trainingResults;return next;
}

export type StrengthSetSnapshot={date:string;reps:number;weight:number;unit:'lb'|'kg';load:VideoSetResult['load']};
export function strengthSetComparisons(entries:{session:{date:string;videos?:{trainingPlan?:VideoTrainingPlan;trainingResults?:Record<string,VideoSetResult>}[]}}[],today:string,weeks:number) {
 const groups=new Map<string,{name:string;days:Map<string,StrengthSetSnapshot>}>();
 const loads=new Map<string,{name:string;days:Map<string,StrengthSetSnapshot>}>();
 const day=(date:string)=>Date.parse(date+'T12:00:00Z')/86400000;
 for(const {session} of entries){if(session.date>today||day(today)-day(session.date)>=weeks*7)continue;
  for(const video of session.videos||[]){const plan=validateVideoPlan(video.trainingPlan);if(!plan)continue;
   for(const exercise of plan.exercises)for(const set of exercise.sets){const result=video.trainingResults?.[set.id];if(!result?.done||result.warmup||typeof result.reps!=='string'||typeof result.weight!=='string'||!['lb','kg'].includes(result.unit)||!['single','pair','bodyweight'].includes(result.load)||!/^\d{1,4}$/.test(result.reps.trim()))continue;const reps=Number(result.reps);const weight=result.load==='bodyweight'?0:Number(result.weight);if(reps<1||reps>1000||result.load!=='bodyweight'&&(!result.weight.trim()||!Number.isFinite(weight)||weight<=0||weight>1000))continue;
    const key=[exercise.name.trim().toLowerCase(),result.load,result.load==='bodyweight'?'bodyweight':result.unit,weight].join('|');
    let group=groups.get(key);if(!group){group={name:exercise.name,days:new Map()};groups.set(key,group);}const prior=group.days.get(session.date);if(!prior||reps>prior.reps)group.days.set(session.date,{date:session.date,reps,weight,unit:result.unit,load:result.load});
    if(result.load!=='bodyweight'){const loadKey=[exercise.name.trim().toLowerCase(),result.load,result.unit,reps].join('|');let loadGroup=loads.get(loadKey);if(!loadGroup){loadGroup={name:exercise.name,days:new Map()};loads.set(loadKey,loadGroup);}const oldLoad=loadGroup.days.get(session.date);if(!oldLoad||weight>oldLoad.weight)loadGroup.days.set(session.date,{date:session.date,reps,weight,unit:result.unit,load:result.load});}
   }
  }
 }
 const repRows=[...groups].map(([key,group])=>{const days=[...group.days.values()].sort((a,b)=>b.date.localeCompare(a.date));return {key:'reps|'+key,basis:'reps' as const,name:group.name,latest:days[0],prior:days[1]};});
 const loadRows=[...loads].flatMap(([key,group])=>{const days=[...group.days.values()].sort((a,b)=>b.date.localeCompare(a.date));return days.length>1&&days[0].weight!==days[1].weight?[{key:'weight|'+key,basis:'weight' as const,name:group.name,latest:days[0],prior:days[1]}]:[];});
 return [...loadRows,...repRows].sort((a,b)=>b.latest.date.localeCompare(a.latest.date)||a.name.localeCompare(b.name)).slice(0,12);
}

export function completeVideoSet(result:VideoSetResult,planned:PlannedVideoSet,done:boolean):Partial<VideoSetResult> {
 if(!done)return {done:false};
 return {done:true,reps:result.reps||(/^\d{1,3}$/.test(planned.reps.trim())?planned.reps.trim():''),work:result.work||planned.work};
}

export function canonicalVideoURL(video:{url:string;videoId?:string}) {
 let id=video.videoId||'';
 if(!/^[\w-]{11}$/.test(id)){try{const url=new URL(video.url);const host=url.hostname.toLowerCase();if(!['http:','https:'].includes(url.protocol))return '';id=host==='youtu.be'?url.pathname.split('/')[1]:['youtube.com','www.youtube.com','m.youtube.com'].includes(host)?url.searchParams.get('v')||url.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})/)?.[1]||'':'';}catch{return '';}}
 return /^[\w-]{11}$/.test(id)?`https://www.youtube.com/watch?v=${id}`:'';
}

// Session-only additions keep existing exercise/set IDs so recorded results stay attached.
export function appendVideoSet(plan:VideoTrainingPlan,exerciseId:string,sourceSetId?:string):VideoTrainingPlan|undefined {
 const exercise=plan.exercises.find(row=>row.id===exerciseId);
 if(!exercise||exercise.sets.length>=20)return;
 const prior=sourceSetId?exercise.sets.find(set=>set.id===sourceSetId):exercise.sets.at(-1);
 if(!prior)return;
 return validateVideoPlan({...plan,exercises:plan.exercises.map(row=>row.id===exerciseId?{...row,setsSpecified:true,sets:[...row.sets,{...emptyPlannedSet(),reps:prior?.reps||'',work:prior?.work||'',rest:prior?.rest||''}]}:row)});
}
export function appendVideoExercise(plan:VideoTrainingPlan|undefined,name:string):VideoTrainingPlan|undefined {
 if(!name.trim())return;
 const next=plan||{version:1 as const,exercises:[],source:'manual' as const,notes:'',reviewedAt:new Date().toISOString()};
 return validateVideoPlan({...next,exercises:[...next.exercises,{...emptyVideoExercise(),name:name.trim(),setsSpecified:true}]});
}

export function repeatVideoSet(plan:VideoTrainingPlan,results:Record<string,VideoSetResult>,exerciseId:string,setId:string) {
 const source=results[setId];if(!source?.done)return;
 const trainingPlan=appendVideoSet(plan,exerciseId,setId);if(!trainingPlan)return;
 const added=trainingPlan.exercises.find(row=>row.id===exerciseId)!.sets.at(-1)!;
 return {trainingPlan,trainingResults:{...results,[added.id]:{...source,done:false}}};
}

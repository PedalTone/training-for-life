import lexicon from './data/kettlebell-transcript-lexicon.json' with {type:'json'};

type Entry={canonical:string;aliases:string[];recognition_candidates:string[];family:string;qualifiers:string[]};
export type ExerciseMention={index:number;text:string;name:string};
const guidanceFamilies=new Set(['position','technique','style','programming']);
const normalize=(value:string)=>value.toLowerCase().replace(/[\u2010-\u2015-]/g,' ').replace(/\s*&\s*/g,' and ').replace(/’/g,"'").replace(/\s+/g,' ').trim();
const escape=(value:string)=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function phrasePattern(value:string){return normalize(value).split(' ').map(word=>word==='and'?'(?:and|&)':escape(word).replace(/'/g,"['’]")).join('[\\s\\u2010-\\u2015-]+');}
function plural(value:string){return /(?:swing|clean|snatch|pull|jerk|press|thruster|squat|lunge|deadlift|lift|row|up|windmill|halo|twist|drag|carry|walk|march|bar|pullover|morning|raise|bridge|thrust|burpee|flow|complex|chain|interval|round)$/.test(value)?value.replace(/([a-z-]+)$/i,word=>word.endsWith('carry')?word.slice(0,-1)+'ies':/(?:ss|ch|x)$/.test(word)?word+'es':word+'s'):value;}
const displayNames:Record<string,string>={'halo':'Kettlebell halo','hip bridge':'Glute bridge','rear-foot-elevated split squat':'Bulgarian split squat'};
const display=(value:string)=>displayNames[value]||value[0].toUpperCase()+value.slice(1);
const ambiguous=new Set(['clean','row','get up','good morning','flow','march','goblet','pistol','around the head','abc','press'].flatMap(value=>[value,plural(value)]));
// Exact canonical spellings win shared aliases. These two aliases have no exact
// canonical entry; retain their explicit rack position instead of inventing front.
const aliasOwners:Record<string,string>={'racked squat':'rack squat','racked squats':'rack squat','single rack squat':'rack squat','single rack squats':'rack squat'};
const variants=new Map<string,{entry:Entry;exact:boolean}>();
for(const entry of lexicon.entries as Entry[]){
 if(guidanceFamilies.has(entry.family))continue;
 for(const phrase of new Set([entry.canonical,...entry.aliases,...entry.recognition_candidates])){
  for(const form of new Set([normalize(phrase),plural(normalize(phrase))])){
   const candidate={entry,exact:normalize(phrase)===normalize(entry.canonical)},prior=variants.get(form),owner=aliasOwners[form];
   if(!prior||(owner?entry.canonical===owner:candidate.exact&&!prior.exact))variants.set(form,candidate);
  }
 }
}
const lexiconPattern=[...variants.keys()].sort((a,b)=>b.length-a.length).map(phrasePattern).join('|');
// Legacy non-kettlebell exercises remain supported. Labels already present in
// saved workouts are never rewritten by the lexicon.
const legacyExercises:[string,string][] = [
 ['Bulgarian split squat','bulgarian split squats?'],['Romanian deadlift','romanian deadlifts?|r\\.?d\\.?l\\.?s?'],['Goblet squat','goblet squats?'],['Split squat','split squats?'],['Reverse lunge','reverse lunges?'],['Walking lunge','walking lunges?'],['Kettlebell swing','(?:kettlebell |kb )?swings?'],['Kettlebell halo','(?:kettlebell |head )?halos?'],['Turkish get-up','turkish get[ -]?ups?'],['Clean and press','cleans? (?:and|&) press(?:es)?'],['Overhead press','(?:overhead|shoulder|military) press(?:es)?'],['Bent-over row','bent[ -]over rows?'],['Single-arm row','(?:single[ -]arm|one[ -]arm) rows?'],['Upright row','upright rows?'],['Farmer carry',"farmer(?:'s|s)? carr(?:y|ies)"],['Glute bridge','(?:glute|hip) bridges?'],['Hip thrust','hip thrusts?'],['Push-up','push[ -]?ups?'],['Pull-up','pull[ -]?ups?'],['Dead hang','dead hangs?'],['Face pull','face pulls?'],['Bench press','(?:bench|chest) press(?:es)?'],['Triceps extension','triceps? extensions?'],['Biceps curl','(?:biceps?|hammer) curls?'],['Lateral raise','lateral raises?'],['Side plank','side planks?'],['Plank','(?:forearm |high )?planks?'],['Mountain climber','mountain climbers?'],['Russian twist','russian twists?'],['Dead bug','dead bugs?'],['Bird dog','bird dogs?'],['Hollow hold','hollow (?:body )?holds?'],['Squat','squats?'],['Deadlift','deadlifts?'],['Lunge','lunges?'],['Snatch','(?:kettlebell |dumbbell )?snatches?'],['Thruster','thrusters?'],['Calf raise','calf raises?'],['Wall sit','wall sits?'],['Burpee','burpees?']
];
const legacyPattern=legacyExercises.map(([,pattern])=>`(?:${pattern})`).join('|');
const sharedQualifiers=[...lexicon.normalization_guidance.preserve_laterality,...lexicon.normalization_guidance.preserve_loading,...lexicon.normalization_guidance.preserve_position,'left and right','right and left','both sides'];
const qualifierNames:Record<string,string>={'one bell':'single','two bells':'double','one arm':'single-arm','single arm':'single-arm','single hand':'single-arm','front rack':'front-rack','bottoms up':'bottoms-up','two hand':'two-hand','hand to hand':'hand-to-hand','dead stop':'dead-stop','single leg':'single-leg','double leg':'double-leg','two leg':'two-leg','half kneeling':'half-kneeling','tall kneeling':'tall-kneeling','heels elevated':'heels-elevated','left and right':'left/right','right and left':'left/right','both sides':'both sides'};
function qualifierName(value:string){const normalized=normalize(value);return qualifierNames[normalized]||normalized;}
function qualifiedName(entry:Entry|undefined,core:string,before:string,after:string){
 const qualifiers=[...new Set([...sharedQualifiers,...(entry?.qualifiers||[])])].sort((a,b)=>b.length-a.length);
 const options=qualifiers.map(phrasePattern).join('|'),item=`(?:${options}|kettlebells?|kb)`;
 const prefix=before.match(new RegExp(`(?:^|\\b)((?:${item}[\\s-]+){1,6})$`,'i'))?.[1]||'';
 const stated=[...prefix.matchAll(new RegExp(`\\b(${options})\\b`,'gi'))].map(match=>qualifierName(match[0]));
 let suffix='';
 for(let count=0;count<2;count++){
  const next=after.slice(suffix.length).match(/^\s+(?:(?:on|to)(?:\s+the)?\s+(left|right)(?:\s+side)?|(left|right)\s+side|with\s+(one|two)\s+bells?)\b/i);
  if(!next)break;suffix+=next[0];stated.push(next[3]?next[3].toLowerCase()==='two'?'double':'single':(next[1]||next[2]).toLowerCase());
 }
 // Qualifiers already expressed by a specific alias must not disappear either.
 const coreQualifiers=[...core.matchAll(new RegExp(`\\b(${options})\\b`,'gi'))].map(match=>qualifierName(match[0]));
 let canonical=entry?.canonical;
 for(const qualifier of [...stated,...coreQualifiers]){
  const specific=(lexicon.entries as Entry[]).find(candidate=>normalize(candidate.canonical)===normalize(qualifier+' '+(canonical||'').replace(/^kettlebell /,'')));
  if(specific)canonical=specific.canonical;
 }
 // “Press” alone does not establish strict technique, even though the supplied
 // dictionary groups generic KB/overhead press aliases under strict press.
 const genericPress=entry?.canonical==='strict press'&&!/\b(?:strict|military)\b/i.test(core);
 const base=genericPress?/\boverhead\b/i.test(core)?'Overhead press':'Press':canonical?display(canonical):core;
 const nameQualifiers=[...new Set([...stated,...coreQualifiers])].filter(q=>!normalize(base).includes(normalize(q)));
 const name=(nameQualifiers.length?nameQualifiers.join(' ')+' '+base[0].toLowerCase()+base.slice(1):base).replace(/^./,char=>char.toUpperCase());
 return {name,prefix,suffix};
}
function hasExerciseContext(text:string,index:number,length:number,raw:string){
 if(!ambiguous.has(normalize(raw)))return true;
 const before=text.slice(Math.max(0,index-100),index).split(/[.!?\n]/).at(-1)||'';
 const after=text.slice(index+length,index+length+100).split(/[.!?\n]/)[0];
 return /\b(?:kettlebells?|kb)\s*$/i.test(before)||/^\s*:/.test(after)||
  /^\s*(?:(?:for|hold)\s+)?(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|twelve|twenty|thirty|forty|sixty)\s*(?:reps?|sets?|seconds?|minutes?)\b/i.test(after)||
  /\b(?:\d+|ten|twelve|twenty)\s*$|\b(?:do|doing|perform|try|start with|begin with|next is|exercise is|exercises are)\s+(?:(?:a|the)\s+)?$/i.test(before);
}
export function findTranscriptExercises(text:string,{allowBarePress=false}:{allowBarePress?:boolean}={}):ExerciseMention[]{
 const pattern=new RegExp(`\\b(${lexiconPattern}|${legacyPattern}|press(?:es)?)\\b`,'gi');
 const found:ExerciseMention[]=[];
 for(const match of text.matchAll(pattern)){
  const index=match.index!,raw=match[0];if(!(allowBarePress&&/^press(?:es)?$/i.test(raw))&&!hasExerciseContext(text,index,raw.length,raw))continue;
  const entry=variants.get(normalize(raw))?.entry;
  const legacy=legacyExercises.find(([,pattern])=>new RegExp(`^(?:${pattern})$`,'i').test(raw));
  const qualified=qualifiedName(entry,entry?raw:legacy?.[0]||'Press',text.slice(Math.max(0,index-160),index),text.slice(index+raw.length));
  const start=index-qualified.prefix.length,end=index+raw.length+qualified.suffix.length;
  // An earlier full compound owns its span; never turn its component words into
  // extra exercises. Prefix qualifiers cannot consume a preceding exercise.
  if(found.length&&start<found.at(-1)!.index+found.at(-1)!.text.length)continue;
  found.push({index:start,text:text.slice(start,end),name:qualified.name});
 }
 return found;
}
const guidancePatterns=(lexicon.entries as Entry[]).filter(entry=>guidanceFamilies.has(entry.family)).map(entry=>new RegExp(`\\b(?:${[...new Set([entry.canonical,...entry.aliases])].map(phrasePattern).join('|')})\\b`,'i'));
export function transcriptGuidance(text:string){
 const notes:string[]=[];
 for(const line of text.split(/[.!?\n]/)){
  const excerpt=line.trim();if(!excerpt)continue;
  if(guidancePatterns.some(pattern=>pattern.test(excerpt))||/\b(?:rounds?|circuits?|rest|work interval)\b/i.test(excerpt)){
   if(!notes.includes(excerpt))notes.push(excerpt);
  }
 }
 return notes.slice(0,12).join('\n').slice(0,1800);
}

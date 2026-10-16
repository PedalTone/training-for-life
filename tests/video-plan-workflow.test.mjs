import test from 'node:test';
import assert from 'node:assert/strict';
import {TRANSCRIPT_WEBSITE,TRANSCRIPT_FORM_ACTION,transcriptVideoURL,openVideoTranscript,readVideoPlanFlow,writeVideoPlanFlow,clearVideoPlanFlow} from '../app/video-plan-workflow.ts';

const videoId='GRFRg4Oafxc';
const canonical='https://www.youtube.com/watch?v='+videoId;
const key='t4l:video-plan-workflow-v1';
const plan={version:1,source:'transcript',reviewedAt:'',notes:'Two rounds.',exercises:[{id:'exercise-one',name:'Goblet squat',setsSpecified:true,evidence:'Ten goblet squats.',sets:[{id:'set-one',reps:'10',work:'',rest:'20 seconds'}]}]};
const flow=(patch={})=>({videoId,transcript:'Ten goblet squats.\nLast instruction.',draft:structuredClone(plan),stage:'review',...patch});
function storage(){const data=new Map();return {data,getItem:name=>data.get(name)??null,setItem:(name,value)=>data.set(name,value),removeItem:name=>data.delete(name)};}
function mockDocument({throwOnSubmit=false}={}){
 const created=[],attached=[],submitted=[];
 const document={createElement(tag){const element={tag,children:[],append(child){this.children.push(child);},submit(){submitted.push(this);if(throwOnSubmit)throw new Error('navigation blocked');},remove(){this.removed=true;const index=attached.indexOf(this);if(index>=0)attached.splice(index,1);}};created.push(element);return element;},body:{append(element){attached.push(element);}}};
 return {document,created,attached,submitted};
}

test('the transcript handoff canonicalizes supported YouTube links without tracking parameters',()=>{
 for(const url of ['https://youtu.be/'+videoId+'?si=private-tracking','https://www.youtube.com/watch?v='+videoId+'&list=private-list&t=20','https://m.youtube.com/shorts/'+videoId+'?feature=share','https://www.youtube.com/embed/'+videoId])assert.equal(transcriptVideoURL({url}),canonical);
 assert.equal(transcriptVideoURL({url:'not needed',videoId}),canonical);
 for(const url of ['https://evil.example/watch?v='+videoId,'https://youtube.com.evil.example/watch?v='+videoId,'javascript:alert(1)','not a URL','https://youtu.be/short'])assert.equal(transcriptVideoURL({url}),'');
});

test('the website handoff posts only the canonical video URL to the exact free website',()=>{
 assert.equal(TRANSCRIPT_WEBSITE,'https://youtubetotranscript.com/');assert.equal(TRANSCRIPT_FORM_ACTION,'https://youtubetotranscript.com/transcript');
 const source=Object.freeze({url:'https://youtu.be/'+videoId+'?si=tracking',label:'Private workout title',trainingPlan:plan,trainingResults:{'set-one':{weight:'24',unit:'kg'}},notes:'Private body note'});
 const before=JSON.stringify(source),dom=mockDocument();assert.equal(openVideoTranscript(source,dom.document),true);
 const form=dom.submitted[0];assert.equal(form.method,'post');assert.equal(form.action,TRANSCRIPT_FORM_ACTION);assert.equal(form.target,'_blank');assert.match(form.rel,/\bnoopener\b/);assert.match(form.rel,/\bnoreferrer\b/);assert.equal(form.hidden,true);
 assert.equal(form.children.length,1);assert.equal(form.children[0].tag,'input');assert.equal(form.children[0].type,'hidden');assert.equal(form.children[0].name,'youtube_url');assert.equal(form.children[0].value,canonical);
 assert.equal(JSON.stringify(source),before);assert.equal(dom.attached.length,0);assert.equal(form.removed,true);
});

test('invalid video links never create or submit a form and submission failures clean up',()=>{
 const dom=mockDocument();assert.equal(openVideoTranscript({url:'https://evil.example'},dom.document),false);assert.equal(dom.created.length,0);assert.equal(dom.submitted.length,0);
 const blocked=mockDocument({throwOnSubmit:true});assert.equal(openVideoTranscript({url:canonical},blocked.document),false);assert.equal(blocked.submitted.length,1);assert.equal(blocked.attached.length,0);assert.equal(blocked.submitted[0].removed,true);
});

test('session draft restore preserves full transcript and plan without changing their source',()=>{
 const saved=storage(),source=flow(),before=structuredClone(source);writeVideoPlanFlow(source,saved);const restored=readVideoPlanFlow(saved);
 assert.deepEqual(restored,source);assert.deepEqual(source,before);assert.equal(restored.draft.source,'transcript');assert.equal(restored.draft.reviewedAt,'');
 restored.draft.exercises[0].sets[0].reps='99';assert.equal(readVideoPlanFlow(saved).draft.exercises[0].sets[0].reps,'10');assert.equal(source.draft.exercises[0].sets[0].reps,'10');
 const transcriptOnly=flow({draft:null,stage:'transcript'});writeVideoPlanFlow(transcriptOnly,saved);assert.deepEqual(readVideoPlanFlow(saved),transcriptOnly);
});

test('temporary draft clearing only removes the matching video and leaves saved workout data alone',()=>{
 const saved=storage();saved.setItem('t4l:future-videos','saved reusable plans');saved.setItem('t4l:workout:2026-10-15','completed results');writeVideoPlanFlow(flow(),saved);
 clearVideoPlanFlow('abcdefghijk',saved);assert.equal(readVideoPlanFlow(saved).videoId,videoId);
 clearVideoPlanFlow(videoId,saved);assert.equal(readVideoPlanFlow(saved),undefined);assert.equal(saved.getItem('t4l:future-videos'),'saved reusable plans');assert.equal(saved.getItem('t4l:workout:2026-10-15'),'completed results');
});

test('session draft storage bounds transcript and total serialized size while preserving an existing draft',()=>{
 const saved=storage();writeVideoPlanFlow(flow(),saved);const initial=saved.getItem(key);
 writeVideoPlanFlow(flow({transcript:'x'.repeat(300001)}),saved);assert.equal(saved.getItem(key),initial);
 writeVideoPlanFlow(flow({transcript:'\u0000'.repeat(130000)}),saved);assert.equal(saved.getItem(key),initial);
 writeVideoPlanFlow(flow({videoId:'invalid'}),saved);assert.equal(saved.getItem(key),initial);
 writeVideoPlanFlow(flow({transcript:'x'.repeat(300000)}),saved);assert.equal(readVideoPlanFlow(saved).transcript.length,300000);
});

test('malformed session storage cannot restore invalid identities or oversized transcripts',()=>{
 const saved=storage();for(const value of ['not JSON','null','[]',JSON.stringify(flow({videoId:'bad'})),JSON.stringify(flow({videoId:12345678901})),JSON.stringify(flow({transcript:42})),JSON.stringify(flow({transcript:'x'.repeat(300001)}))]){saved.setItem(key,value);assert.equal(readVideoPlanFlow(saved),undefined);}
});

test('invalid plan data restores only the transcript stage and untrusted extra fields are omitted',()=>{
 const saved=storage();saved.setItem(key,JSON.stringify(flow({draft:{...plan,exercises:[]},stage:'review',privateNotes:'must not restore'})));assert.deepEqual(readVideoPlanFlow(saved),{videoId,transcript:flow().transcript,draft:null,stage:'transcript'});
 saved.setItem(key,JSON.stringify(flow({stage:'unexpected'})));assert.equal(readVideoPlanFlow(saved).stage,'transcript');
});

test('unavailable or quota-limited storage never prevents opening or reviewing a plan',()=>{
 const inaccessible={getItem(){throw new Error('blocked');},setItem(){throw new Error('quota');},removeItem(){throw new Error('blocked');}};
 assert.equal(readVideoPlanFlow(inaccessible),undefined);assert.doesNotThrow(()=>writeVideoPlanFlow(flow(),inaccessible));assert.doesNotThrow(()=>clearVideoPlanFlow(videoId,inaccessible));
 const quota={getItem:()=>null,setItem(){throw new Error('quota');},removeItem(){}};assert.doesNotThrow(()=>writeVideoPlanFlow(flow(),quota));assert.equal(readVideoPlanFlow(quota),undefined);
});


test('review summaries keep units readable, indicate varied targets and never invent set counts',async()=>{
 const {videoRepLabel,exercisePlanSummary}=await import('../app/video-plan-workflow.ts');
 assert.equal(videoRepLabel('8 per side'),'8 reps per side');assert.equal(videoRepLabel('8–12'),'8–12 reps');assert.equal(videoRepLabel(''),'');
 const exercise={id:'e',name:'Row',setsSpecified:false,evidence:'',sets:[{id:'s1',reps:'8 per side',work:'',rest:''}]};
 assert.equal(exercisePlanSummary(exercise),'8 reps per side');
 assert.equal(exercisePlanSummary({...exercise,setsSpecified:true,sets:[...exercise.sets,{id:'s2',reps:'6',work:'',rest:''}]}),'2 sets · Varied targets');
 assert.equal(exercisePlanSummary({...exercise,sets:[{id:'s1',reps:'',work:'',rest:''}]}),'Reps/time not specified');
});

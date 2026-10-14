import {fetchTranscript} from 'youtube-transcript';

const MAX_TEXT=300_000, MAX_RESPONSE=2_000_000;
export class CaptionError extends Error {code:string;status:number;constructor(code:string,message:string,status=422){super(message);this.code=code;this.status=status;}}
type CaptionPayload={videoId:string;transcript:string;source:'transcript-site'|'youtube';language:string};
const recent=new Map<string,number>();
const requestsByIp=new Map<string,number[]>();
const activeByIp=new Map<string,number>();
const pending=new Map<string,Promise<CaptionPayload>>();
export function captionVideoId(value:unknown):string {
 if(typeof value!=='string'||value.length>1000)return '';
 try{const u=new URL(value);if(u.protocol!=='https:')return '';const h=u.hostname.toLowerCase();let id='';if(h==='youtu.be')id=u.pathname.slice(1).split('/')[0];else if(['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(h)){id=u.searchParams.get('v')||'';if(!id){const p=u.pathname.split('/').filter(Boolean);if(['embed','shorts','live'].includes(p[0]))id=p[1]||'';}}return /^[\w-]{11}$/.test(id)?id:'';}catch{return '';}
}
function decode(text:string){return text.replace(/<[^>]*>/g,' ').replace(/&(?:amp|lt|gt|quot|apos|nbsp);|&#(?:x[\da-f]+|\d+);/gi,entity=>{const named:Record<string,string>={'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '};if(named[entity.toLowerCase()])return named[entity.toLowerCase()];const n=entity[2].toLowerCase()==='x'?parseInt(entity.slice(3,-1),16):Number(entity.slice(2,-1));return n>0&&n<=0x10ffff?String.fromCodePoint(n):'';}).replace(/[\t ]+/g,' ').trim();}
export function transcriptSiteText(html:string,id:string):string {
 // Accept only the caption container on a page explicitly identifying this video.
 if(!html.includes(`data-video_id="${id}"`)&&!html.includes(`data-video-id="${id}"`))return '';
 const opening=/<([a-z]+)\b[^>]*\bid=["'](?:transcript-text|transcript-content|transcript)["'][^>]*>/i.exec(html);
 if(!opening)return '';
 const start=opening.index+opening[0].length,tags=new RegExp(`<\\/?${opening[1]}\\b[^>]*>`,'gi');tags.lastIndex=start;let depth=1,end=-1;
 for(let tag=tags.exec(html);tag;tag=tags.exec(html)){depth+=tag[0].startsWith('</')?-1:tag[0].endsWith('/>')?0:1;if(depth===0){end=tag.index;break;}}
 if(end<0)return '';
 const text=decode(html.slice(start,end).replace(/<(?:script|style)\b[^>]*>[\s\S]*?<\/(?:script|style)>/gi,'').replace(/<br\s*\/?>|<\/p>|<\/div>/gi,'\n'));
 if(text.length>MAX_TEXT)throw new CaptionError('too_large','This transcript is too large. Import a shorter transcript.');return text;
}
async function boundedFetch(fetcher:typeof fetch,input:RequestInfo|URL,init?:RequestInit){
 const u=new URL(String(input));
 if(u.protocol!=='https:'||!['youtubetotranscript.com','www.youtube.com','youtube.com'].includes(u.hostname))throw new CaptionError('unavailable','Caption source unavailable.');
 const r=await fetcher(input,{...init,redirect:'manual',signal:init?.signal||AbortSignal.timeout(8_000)});
 if(r.status>=300&&r.status<400)throw new CaptionError('unavailable','Caption source redirected unexpectedly. Try again later or paste captions.');
 console.info('caption upstream',{path:u.pathname,status:r.status});
 if(r.status===429)throw new CaptionError('blocked','YouTube temporarily limited caption requests. Try again later or paste captions.',429);
 if(Number(r.headers.get('content-length'))>MAX_RESPONSE)throw new CaptionError('too_large','This transcript is too large. Import a shorter transcript.');
 if(!r.body)return r;
 const reader=r.body.getReader();const chunks:Uint8Array[]=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX_RESPONSE){await reader.cancel();throw new CaptionError('too_large','This transcript is too large. Import a shorter transcript.');}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 const result=new Response(bytes.buffer,{status:r.status,statusText:r.statusText,headers:r.headers});
 if(u.pathname.includes('/player')){try{const data=await result.clone().json() as {playabilityStatus?:{status?:string;reason?:string};captions?:unknown};console.info('caption metadata',{playability:data.playabilityStatus?.status,reason:data.playabilityStatus?.reason,hasCaptions:Boolean(data.captions)});}catch{/* diagnostics only; response size was already bounded. */}}
 return result;
}
export async function retrieveVideoCaptions(id:string,fetcher:typeof fetch=fetch):Promise<CaptionPayload>{
 const deadline=Date.now()+28_000;
 const safeFetch=((input:RequestInfo|URL,init?:RequestInit)=>{const remaining=deadline-Date.now();if(remaining<=0)throw new CaptionError('timeout','Caption fetching took too long. Try again later or paste captions.',503);return boundedFetch(fetcher,input,{...init,signal:AbortSignal.timeout(Math.min(8_000,remaining))});}) as typeof fetch;
 try{const r=await safeFetch(`https://youtubetotranscript.com/transcript?v=${id}&current_language_code=en`);if(r.ok){const transcript=transcriptSiteText(await r.text(),id);if(transcript.trim())return {videoId:id,transcript,source:'transcript-site',language:'en'};}}catch{/* One direct-caption fallback; no retries, cookies or challenge solving. */}
 try{const segments=await fetchTranscript(id,{lang:'en',fetch:safeFetch});const transcript=segments.map(row=>decode(row.text)).filter(Boolean).join('\n');if(!transcript.trim())throw new CaptionError('empty','YouTube returned no caption text. Try pasting captions or importing a plan.');if(transcript.length>MAX_TEXT)throw new CaptionError('too_large','This transcript is too large. Import a shorter transcript.');return {videoId:id,transcript,source:'youtube',language:segments[0]?.lang||'en'};}
 catch(error){if(error instanceof CaptionError)throw error;const message=error instanceof Error?error.message:'';console.info('caption retrieval unavailable',{detail:message.slice(0,180)});if(/captcha|too many|429|confirm|bot/i.test(message))throw new CaptionError('blocked','YouTube blocked automatic captions for now. Try again later or paste captions.',429);if(/language/i.test(message))throw new CaptionError('language','English captions are unavailable for this video. You can paste a translated transcript.');throw new CaptionError('unavailable','Automatic captions could not be retrieved for this video. It may have no English captions, or YouTube may be blocking access. You can still paste captions or import a plan.');}
}
export async function handleVideoCaptions(request:Request,{fetcher=fetch,cache,waitUntil=(p:Promise<unknown>)=>void p.catch(()=>{})}:{fetcher?:typeof fetch;cache?:Cache;waitUntil?:(promise:Promise<unknown>)=>void}={}):Promise<Response>{
 const origin=request.headers.get('Origin')||'';
 const allowed=origin==='https://pedaltone.github.io'||origin==='https://training-4-life.tommy-tritone.chatgpt.site'||/^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/.test(origin);
 const headers:Record<string,string>={'Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
 if(allowed)headers['Access-Control-Allow-Origin']=origin;
 const reply=(body:unknown,status=200)=>Response.json(body,{status,headers});
 if(origin&&!allowed)return reply({error:'This origin is not allowed.',code:'origin'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(request.method!=='POST')return reply({error:'Method not allowed.',code:'method'},405);
 if(!request.headers.get('Content-Type')?.includes('application/json'))return reply({error:'Send a YouTube link as JSON.',code:'invalid'},400);
 try{
  if(Number(request.headers.get('content-length'))>2048)return reply({error:'Send only the YouTube video link.',code:'invalid'},400);
  const reader=request.body?.getReader();let text='',bytes=0;const decoder=new TextDecoder();
  if(reader){try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>2048){await reader.cancel();return reply({error:'Send only the YouTube video link.',code:'invalid'},400);}text+=decoder.decode(value,{stream:true});}text+=decoder.decode();}finally{reader.releaseLock();}}
  let body;try{body=JSON.parse(text);}catch{return reply({error:'Send a valid YouTube video link.',code:'invalid'},400);}
  const id=captionVideoId(body?.url);if(!id)return reply({error:'Use a valid YouTube video link.',code:'invalid'},400);
  const key=new Request(`https://training-4-life.tommy-tritone.chatgpt.site/caption-cache-v1/${id}`);
  let hit:Response|undefined;try{hit=await cache?.match(key);}catch{/* Hosted environments may disable Cache API; retrieval still works. */}
  if(hit){try{const data=await hit.json() as CaptionPayload;if(data.videoId===id&&typeof data.transcript==='string'&&data.transcript.trim())return reply({...data,cached:true});}catch{/* Ignore a malformed cached response. */}}
  const now=Date.now();for(const [key,at] of recent)if(now-at>60_000)recent.delete(key);
  const ip=request.headers.get('CF-Connecting-IP')||'local';const limitKey=`${ip}:${id}`;
  const times=(requestsByIp.get(ip)||[]).filter(at=>now-at<60_000);
  if(times.length>=6||(activeByIp.get(ip)||0)>=2)return reply({error:'Caption fetching is busy. Wait a minute before fetching another video.',code:'rate_limit'},429);
  if(recent.has(limitKey))return reply({error:'Please wait a minute before trying this video again, or paste captions.',code:'rate_limit'},429);
  requestsByIp.set(ip,[...times,now]);if(requestsByIp.size>1000)requestsByIp.delete(requestsByIp.keys().next().value!);
  recent.set(limitKey,now);if(recent.size>1000)recent.delete(recent.keys().next().value!);
  let job=pending.get(id);if(!job){job=retrieveVideoCaptions(id,fetcher);pending.set(id,job);void job.finally(()=>pending.delete(id)).catch(()=>{});}
  activeByIp.set(ip,(activeByIp.get(ip)||0)+1);let data:CaptionPayload;
  try{data=await job;}finally{const count=(activeByIp.get(ip)||1)-1;if(count)activeByIp.set(ip,count);else activeByIp.delete(ip);}
  if(cache)waitUntil(Promise.resolve().then(()=>cache.put(key,Response.json(data,{headers:{'Cache-Control':'public, max-age=604800'}}))).catch(()=>{}));
  return reply({...data,cached:false});
 }catch(error){if(!(error instanceof CaptionError))console.warn('video-captions handler failure',{name:error instanceof Error?error.name:'unknown',detail:error instanceof Error?error.message.slice(0,200):'unknown'});const e=error instanceof CaptionError?error:new CaptionError('unavailable','The caption service is unavailable. Try again later or paste captions.',503);return reply({error:e.message,code:e.code},e.status);}
}

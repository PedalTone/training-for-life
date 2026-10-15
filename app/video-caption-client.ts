export const VIDEO_CAPTION_ENDPOINT='https://training-4-life.tommy-tritone.chatgpt.site/api/video-captions';
export type VideoCaptions={videoId:string;transcript:string;source:'transcript-site'|'youtube';language:'en';cached:boolean};
export type TranscriptProvider='website'|'youtube';
type CaptionStorage=Pick<Storage,'getItem'|'setItem'>;
type CachedTranscript=VideoCaptions&{provider:TranscriptProvider};
const CACHE_KEY='t4l:video-caption-cache-v2',MAX_CAPTIONS=300_000;
function validate(value:unknown,videoId:string):VideoCaptions|undefined {
 if(!value||typeof value!=='object')return;const item=value as VideoCaptions;
 if(item.videoId!==videoId||typeof item.transcript!=='string'||!item.transcript.trim()||item.transcript.length>MAX_CAPTIONS||!['transcript-site','youtube'].includes(item.source)||item.language!=='en')return;
 return {videoId,transcript:item.transcript,source:item.source,language:'en',cached:item.cached===true};
}
function matchesProvider(item:VideoCaptions,provider:TranscriptProvider){return item.source===(provider==='website'?'transcript-site':'youtube');}
function cacheEntries(storage?:CaptionStorage):CachedTranscript[]{
 try{const value=JSON.parse(storage?.getItem(CACHE_KEY)||'[]');if(!Array.isArray(value))return [];return value.flatMap(item=>{const valid=validate(item,item?.videoId);return valid&&/^[\w-]{11}$/.test(valid.videoId)&&['website','youtube'].includes(item.provider)&&matchesProvider(valid,item.provider)?[{...valid,provider:item.provider}]:[];});}catch{return [];}
}
function saveCache(storage:CaptionStorage|undefined,result:VideoCaptions,provider:TranscriptProvider){
 if(!storage)return;try{const entries=[{...result,provider},...cacheEntries(storage).filter(item=>item.videoId!==result.videoId||item.provider!==provider)].slice(0,5);while(entries.length&&JSON.stringify(entries).length>MAX_CAPTIONS)entries.pop();storage.setItem(CACHE_KEY,JSON.stringify(entries));}catch{/* Storage limits never prevent transcript use. */}
}
function browserStorage():CaptionStorage|undefined{try{return typeof window==='undefined'?undefined:window.localStorage;}catch{return undefined;}}
export async function fetchVideoCaptions(url:string,{provider='website',signal,fetcher=fetch,storage=browserStorage(),timeoutMs=35_000}:{provider?:TranscriptProvider;signal?:AbortSignal;fetcher?:typeof fetch;storage?:CaptionStorage;timeoutMs?:number}={}):Promise<VideoCaptions>{
 const match=url.match(/^https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})$/);if(!match)throw new Error('Use a valid YouTube video link to fetch the full transcript.');const videoId=match[1];
 if(signal?.aborted)throw new DOMException('Transcript request cancelled.','AbortError');
 const cached=cacheEntries(storage).find(item=>item.videoId===videoId&&item.provider===provider);if(cached){const {provider:_provider,...result}=cached;return {...result,cached:true};}
 const controller=new AbortController();let timedOut=false;const cancel=()=>controller.abort();signal?.addEventListener('abort',cancel,{once:true});
 const timer=setTimeout(()=>{timedOut=true;controller.abort();},timeoutMs);
 try{
  const response=await fetcher(VIDEO_CAPTION_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url,provider}),signal:controller.signal,cache:'no-store'});
  if(controller.signal.aborted)throw new DOMException('Transcript request cancelled.','AbortError');
  const payload:unknown=await response.json().catch(()=>undefined);
  if(controller.signal.aborted)throw new DOMException('Transcript request cancelled.','AbortError');
  if(!response.ok){const supplied=payload&&typeof payload==='object'?'error' in payload?(payload as {error:unknown}).error:undefined:undefined;throw new Error(typeof supplied==='string'&&supplied.trim()?supplied.slice(0,500):response.status===429?'Transcript fetching is busy. Try again in a few minutes, or paste a full transcript below.':'The full transcript could not be fetched. Try again later or paste/import it below.');}
  const result=validate(payload,videoId);if(!result)throw new Error('No usable English transcript was returned. Paste the full transcript or import a plan below.');if(!matchesProvider(result,provider))throw new Error('YouTube to Transcript did not return the requested website transcript. No other source was substituted. Open https://youtubetotranscript.com/ and paste its full transcript below.');saveCache(storage,result,provider);return result;
 }catch(error){if(timedOut)throw new Error('Transcript fetching took too long. Try again, or paste/import the full transcript below.');if(controller.signal.aborted)throw new DOMException('Transcript request cancelled.','AbortError');if(error instanceof TypeError)throw new Error('Could not connect to transcript fetching. Check your connection or paste/import the full transcript below.');throw error;}
 finally{clearTimeout(timer);signal?.removeEventListener('abort',cancel);}
}

export const VIDEO_CAPTION_ENDPOINT='https://training-4-life.tommy-tritone.chatgpt.site/api/video-captions';
export type VideoCaptions={videoId:string;transcript:string;source:'transcript-site'|'youtube';language:'en';cached:boolean};
type CaptionStorage=Pick<Storage,'getItem'|'setItem'>;
const CACHE_KEY='t4l:video-caption-cache-v1',MAX_CAPTIONS=300_000;
function validate(value:unknown,videoId:string):VideoCaptions|undefined {
 if(!value||typeof value!=='object')return;const item=value as VideoCaptions;
 if(item.videoId!==videoId||typeof item.transcript!=='string'||!item.transcript.trim()||item.transcript.length>MAX_CAPTIONS||!['transcript-site','youtube'].includes(item.source)||item.language!=='en')return;
 return {videoId,transcript:item.transcript,source:item.source,language:'en',cached:item.cached===true};
}
function cacheEntries(storage?:CaptionStorage):VideoCaptions[]{
 try{const value=JSON.parse(storage?.getItem(CACHE_KEY)||'[]');if(!Array.isArray(value))return [];return value.flatMap(item=>{const valid=validate(item,item?.videoId);return valid&&/^[\w-]{11}$/.test(valid.videoId)?[valid]:[];});}catch{return [];}
}
function saveCache(storage:CaptionStorage|undefined,result:VideoCaptions){
 if(!storage)return;try{const entries=[result,...cacheEntries(storage).filter(item=>item.videoId!==result.videoId)].slice(0,5);while(entries.length&&JSON.stringify(entries).length>MAX_CAPTIONS)entries.pop();storage.setItem(CACHE_KEY,JSON.stringify(entries));}catch{/* Storage limits never prevent caption use. */}
}
function browserStorage():CaptionStorage|undefined{try{return typeof window==='undefined'?undefined:window.localStorage;}catch{return undefined;}}
export async function fetchVideoCaptions(url:string,{signal,fetcher=fetch,storage=browserStorage(),timeoutMs=35_000}:{signal?:AbortSignal;fetcher?:typeof fetch;storage?:CaptionStorage;timeoutMs?:number}={}):Promise<VideoCaptions>{
 const match=url.match(/^https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})$/);if(!match)throw new Error('Use a valid YouTube video link to fetch captions.');const videoId=match[1];
 if(signal?.aborted)throw new DOMException('Caption request cancelled.','AbortError');
 const cached=cacheEntries(storage).find(item=>item.videoId===videoId);if(cached)return {...cached,cached:true};
 const controller=new AbortController();let timedOut=false;const cancel=()=>controller.abort();signal?.addEventListener('abort',cancel,{once:true});
 const timer=setTimeout(()=>{timedOut=true;controller.abort();},timeoutMs);
 try{
  const response=await fetcher(VIDEO_CAPTION_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url}),signal:controller.signal,cache:'no-store'});
  if(controller.signal.aborted)throw new DOMException('Caption request cancelled.','AbortError');
  const payload:unknown=await response.json().catch(()=>undefined);
  if(controller.signal.aborted)throw new DOMException('Caption request cancelled.','AbortError');
  if(!response.ok){const supplied=payload&&typeof payload==='object'?'error' in payload?(payload as {error:unknown}).error:undefined:undefined;throw new Error(typeof supplied==='string'&&supplied.trim()?supplied.slice(0,300):response.status===429?'Caption fetching is busy. Try again in a few minutes, or paste captions below.':'Captions could not be fetched. Try again later or paste/import them below.');}
  const result=validate(payload,videoId);if(!result)throw new Error('No usable English captions were returned. Paste captions or import a plan below.');saveCache(storage,result);return result;
 }catch(error){if(timedOut)throw new Error('Caption fetching took too long. Try again, or paste/import captions below.');if(controller.signal.aborted)throw new DOMException('Caption request cancelled.','AbortError');if(error instanceof TypeError)throw new Error('Could not connect to caption fetching. Check your connection or paste/import captions below.');throw error;}
 finally{clearTimeout(timer);signal?.removeEventListener('abort',cancel);}
}

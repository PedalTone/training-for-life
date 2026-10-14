import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchVideoCaptions,VIDEO_CAPTION_ENDPOINT} from '../app/video-caption-client.ts';
const url='https://www.youtube.com/watch?v=GRFRg4Oafxc';
const captions={videoId:'GRFRg4Oafxc',transcript:'Goblet squat: three sets of ten reps.',source:'youtube',language:'en',cached:false};
function storage(){const data=new Map();return {getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value),data};}
test('an explicit request posts only the canonical link and a repeated request reuses captions',async()=>{
 const saved=storage();let calls=0;const fetcher=async(endpoint,options)=>{calls++;assert.equal(endpoint,VIDEO_CAPTION_ENDPOINT);assert.equal(options.method,'POST');assert.equal(options.cache,'no-store');assert.deepEqual(JSON.parse(options.body),{url});assert.ok(options.signal instanceof AbortSignal);return Response.json(captions);};
 assert.deepEqual(await fetchVideoCaptions(url,{fetcher,storage:saved}),captions);
 assert.deepEqual(await fetchVideoCaptions(url,{fetcher,storage:saved}),{...captions,cached:true});assert.equal(calls,1);
});
test('caption failures retain a useful message, are not cached, and can be retried',async()=>{
 const saved=storage();let calls=0;const fetcher=async()=>{calls++;return calls===1?Response.json({error:'No English captions are available for this video.',code:'NO_CAPTIONS'},{status:422}):Response.json(captions);};
 await assert.rejects(fetchVideoCaptions(url,{fetcher,storage:saved}),/No English captions/);assert.equal(saved.data.size,0);
 assert.equal((await fetchVideoCaptions(url,{fetcher,storage:saved})).transcript,captions.transcript);assert.equal(calls,2);
});
test('unavailable service, invalid payloads and invalid URLs are never cached',async()=>{
 const saved=storage();for(const payload of [{...captions,videoId:'abcdefghijk'},{...captions,transcript:''},{...captions,language:'fr'},{...captions,transcript:'x'.repeat(300001)}])await assert.rejects(fetchVideoCaptions(url,{fetcher:async()=>Response.json(payload),storage:saved}),/No usable English captions/);
 await assert.rejects(fetchVideoCaptions(url,{fetcher:async()=>new Response('service unavailable',{status:503}),storage:saved}),/could not be fetched/);
 await assert.rejects(fetchVideoCaptions('https://evil.example/?v=GRFRg4Oafxc',{fetcher:async()=>{assert.fail('must not fetch invalid URL');},storage:saved}),/valid YouTube video link/);assert.equal(saved.data.size,0);
});
test('cancelling an in-flight request prevents a late response from being cached',async()=>{
 const saved=storage(),controller=new AbortController();let release;const late=new Promise(resolve=>{release=resolve;});const pending=fetchVideoCaptions(url,{signal:controller.signal,storage:saved,fetcher:async()=>late});controller.abort();release(Response.json(captions));await assert.rejects(pending,error=>error.name==='AbortError');assert.equal(saved.data.size,0);
 await assert.rejects(fetchVideoCaptions(url,{signal:controller.signal,storage:saved,fetcher:async()=>{assert.fail('already aborted request must not fetch');}}),error=>error.name==='AbortError');
});
test('slow requests are aborted once and expose a retry/manual-fallback message',async()=>{
 let aborts=0;const fetcher=async(_url,{signal})=>new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>{aborts++;reject(new DOMException('Aborted','AbortError'));},{once:true}));await assert.rejects(fetchVideoCaptions(url,{fetcher,storage:storage(),timeoutMs:5}),/took too long/);assert.equal(aborts,1);
});
test('storage restrictions and corrupt cache cannot prevent caption fetching',async()=>{
 const inaccessible={getItem:()=>{throw new Error('blocked');},setItem:()=>{throw new Error('quota');}};assert.equal((await fetchVideoCaptions(url,{storage:inaccessible,fetcher:async()=>Response.json(captions)})).transcript,captions.transcript);
 const saved=storage();saved.setItem('t4l:video-caption-cache-v1','not json');assert.equal((await fetchVideoCaptions(url,{storage:saved,fetcher:async()=>Response.json(captions)})).cached,false);
});
test('caption cache stays bounded and preserves the most recently fetched usable transcript',async()=>{
 const saved=storage();for(const videoId of ['aaaaaaaaaaa','bbbbbbbbbbb','ccccccccccc'])await fetchVideoCaptions('https://www.youtube.com/watch?v='+videoId,{storage:saved,fetcher:async()=>Response.json({...captions,videoId,transcript:'z'.repeat(110000)})});
 const serialized=saved.getItem('t4l:video-caption-cache-v1');assert.ok(serialized.length<=300000);const entries=JSON.parse(serialized);assert.deepEqual(entries.map(item=>item.videoId),['ccccccccccc','bbbbbbbbbbb']);assert.equal((await fetchVideoCaptions('https://www.youtube.com/watch?v=ccccccccccc',{storage:saved,fetcher:async()=>{assert.fail('must reuse saved captions');}})).cached,true);
});

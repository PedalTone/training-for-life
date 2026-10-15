import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchVideoCaptions,VIDEO_CAPTION_ENDPOINT} from '../app/video-caption-client.ts';
const url='https://www.youtube.com/watch?v=GRFRg4Oafxc';
const captions={videoId:'GRFRg4Oafxc',transcript:'Goblet squat: three sets of ten reps.',source:'transcript-site',language:'en',cached:false};
const cacheKey='t4l:video-caption-cache-v2';
function storage(){const data=new Map();return {getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value),data};}
test('the default request explicitly chooses the website and reuses only its scoped transcript',async()=>{
 const saved=storage();let calls=0;const fetcher=async(endpoint,options)=>{calls++;assert.equal(endpoint,VIDEO_CAPTION_ENDPOINT);assert.equal(options.method,'POST');assert.equal(options.cache,'no-store');assert.deepEqual(JSON.parse(options.body),{url,provider:'website'});assert.ok(options.signal instanceof AbortSignal);return Response.json(captions);};
 assert.deepEqual(await fetchVideoCaptions(url,{fetcher,storage:saved}),captions);
 assert.deepEqual(await fetchVideoCaptions(url,{fetcher,storage:saved}),{...captions,cached:true});assert.equal(calls,1);
});
test('website failures retain the blocked-site message and never fall back automatically',async()=>{
 const saved=storage();let calls=0;const fetcher=async()=>{calls++;return calls===1?Response.json({error:'YouTube to Transcript blocked automatic access. Open the website or choose another source.',code:'website_blocked'},{status:503}):Response.json(captions);};
 await assert.rejects(fetchVideoCaptions(url,{fetcher,storage:saved}),/YouTube to Transcript blocked automatic access/);assert.equal(calls,1);assert.equal(saved.data.size,0);
 assert.equal((await fetchVideoCaptions(url,{fetcher,storage:saved})).transcript,captions.transcript);assert.equal(calls,2);
});
test('explicit YouTube fallback is a separate request and does not satisfy a later website request',async()=>{
 const saved=storage(),providers=[];const youtube={...captions,source:'youtube'};
 const fetcher=async(_endpoint,options)=>{const {provider}=JSON.parse(options.body);providers.push(provider);return Response.json(provider==='youtube'?youtube:captions);};
 assert.deepEqual(await fetchVideoCaptions(url,{provider:'youtube',fetcher,storage:saved}),youtube);
 assert.deepEqual(await fetchVideoCaptions(url,{fetcher,storage:saved}),captions);
 assert.deepEqual(providers,['youtube','website']);
 assert.deepEqual(await fetchVideoCaptions(url,{provider:'youtube',fetcher,storage:saved}),{...youtube,cached:true});assert.equal(providers.length,2);
 assert.deepEqual(JSON.parse(saved.getItem(cacheKey)).map(item=>[item.provider,item.source]),[['website','transcript-site'],['youtube','youtube']]);
});
test('a website request rejects a substituted YouTube source from the network or cache',async()=>{
 const saved=storage(),youtube={...captions,source:'youtube'};let calls=0;
 await assert.rejects(fetchVideoCaptions(url,{fetcher:async()=>Response.json(youtube),storage:saved}),/No other source was substituted/);assert.equal(saved.data.size,0);
 saved.setItem(cacheKey,JSON.stringify([{...youtube,provider:'website'}]));
 assert.deepEqual(await fetchVideoCaptions(url,{fetcher:async()=>{calls++;return Response.json(captions);},storage:saved}),captions);assert.equal(calls,1);
});
test('the old unscoped caption cache is ignored without deleting it or workout data',async()=>{
 const saved=storage();saved.setItem('t4l:video-caption-cache-v1',JSON.stringify([{...captions,source:'youtube'}]));saved.setItem('t4l:session:2026-10-14','saved workout');let calls=0;
 await fetchVideoCaptions(url,{storage:saved,fetcher:async()=>{calls++;return Response.json(captions);}});
 assert.equal(calls,1);assert.equal(saved.getItem('t4l:session:2026-10-14'),'saved workout');assert.ok(saved.getItem('t4l:video-caption-cache-v1'));
});
test('the full transcript is returned and cached verbatim, including its final words',async()=>{
 const saved=storage();const transcript='Introduction\n\n'+('Exercise instruction with punctuation & detail.\n'.repeat(1800))+'FINAL MOVEMENT: plank for forty seconds.\n';
 const full={...captions,transcript};
 assert.equal((await fetchVideoCaptions(url,{storage:saved,fetcher:async()=>Response.json(full)})).transcript,transcript);
 const cached=await fetchVideoCaptions(url,{storage:saved,fetcher:async()=>{assert.fail('must reuse complete cached transcript');}});
 assert.equal(cached.transcript,transcript);assert.ok(cached.transcript.endsWith('FINAL MOVEMENT: plank for forty seconds.\n'));
});
test('unavailable service, invalid payloads and invalid URLs are never cached',async()=>{
 const saved=storage();for(const payload of [{...captions,videoId:'abcdefghijk'},{...captions,transcript:''},{...captions,language:'fr'},{...captions,transcript:'x'.repeat(300001)}])await assert.rejects(fetchVideoCaptions(url,{fetcher:async()=>Response.json(payload),storage:saved}),/No usable English transcript/);
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
test('storage restrictions and corrupt cache cannot prevent transcript fetching',async()=>{
 const inaccessible={getItem:()=>{throw new Error('blocked');},setItem:()=>{throw new Error('quota');}};assert.equal((await fetchVideoCaptions(url,{storage:inaccessible,fetcher:async()=>Response.json(captions)})).transcript,captions.transcript);
 const saved=storage();saved.setItem(cacheKey,'not json');assert.equal((await fetchVideoCaptions(url,{storage:saved,fetcher:async()=>Response.json(captions)})).cached,false);
});
test('transcript cache stays bounded and preserves the most recently fetched usable transcript',async()=>{
 const saved=storage();for(const videoId of ['aaaaaaaaaaa','bbbbbbbbbbb','ccccccccccc'])await fetchVideoCaptions('https://www.youtube.com/watch?v='+videoId,{storage:saved,fetcher:async()=>Response.json({...captions,videoId,transcript:'z'.repeat(110000)})});
 const serialized=saved.getItem(cacheKey);assert.ok(serialized.length<=300000);const entries=JSON.parse(serialized);assert.deepEqual(entries.map(item=>item.videoId),['ccccccccccc','bbbbbbbbbbb']);assert.equal((await fetchVideoCaptions('https://www.youtube.com/watch?v=ccccccccccc',{storage:saved,fetcher:async()=>{assert.fail('must reuse saved transcript');}})).cached,true);
});
test('an explicit YouTube choice also rejects website-source substitution',async()=>{await assert.rejects(fetchVideoCaptions(url,{provider:'youtube',storage:storage(),fetcher:async()=>Response.json({...captions,source:'transcript-site'})}),/No other source was substituted|requested/);});

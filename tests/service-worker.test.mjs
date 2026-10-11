import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../public/service-worker.js', import.meta.url), 'utf8');
function harness(fetch, cached) {
  const handlers = {};
  vm.runInNewContext(source, {
    self: { addEventListener: (name, handler) => { handlers[name] = handler; } },
    URL,
    fetch,
    caches: { open: async () => ({ put: async () => {} }), match: async () => cached },
  });
  return async () => {
    let response;
    handlers.fetch({ request: { method: 'GET', mode: 'navigate', url: 'https://example.com/app/' }, respondWith: (value) => { response = value; } });
    return response;
  };
}
test('online navigation bypasses stale HTTP HTML cache', async () => {
  const fresh = { clone: () => ({}) };
  const navigate = harness(async (_request, options) => {
    assert.equal(options.cache, 'no-store');
    return fresh;
  }, { old: true });
  assert.equal(await navigate(), fresh);
});
test('offline navigation still returns the saved page', async () => {
  const cached = { offline: true };
  const navigate = harness(async () => { throw new Error('offline'); }, cached);
  assert.equal(await navigate(), cached);
});
test('current weather bypasses the service worker and its location URL cache', () => {
  let handler;
  vm.runInNewContext(source, {
    self: { addEventListener: (name, callback) => { if(name === 'fetch') handler = callback; } }, URL,
    fetch: () => { throw new Error('worker should not handle weather'); },
    caches: { match: () => { throw new Error('worker should not cache weather'); } },
  });
  handler({request:{method:'GET',mode:'cors',url:'https://api.open-meteo.com/v1/forecast?latitude=0&longitude=0'},respondWith:()=>{throw new Error('must fall through to browser network');}});
});
test('map and place requests bypass worker caching of location URLs', () => {
 let handler;vm.runInNewContext(source,{self:{addEventListener:(name,callback)=>{if(name==='fetch')handler=callback;}},URL,fetch:()=>{throw new Error('must use browser HTTP caching');},caches:{match:()=>{throw new Error('must not cache location URLs');}}});
 for(const url of ['https://tile.openstreetmap.org/14/4825/6150.png','https://photon.komoot.io/reverse?lon=-73&lat=40'])handler({request:{method:'GET',mode:'cors',url},respondWith:()=>{throw new Error('must fall through');}});
});

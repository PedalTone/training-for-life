import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseCurrentWeather,fetchCurrentWeather} from '../app/current-weather.ts';
test('weather accepts zero and subzero readings without inventing missing values',()=>{
 assert.equal(parseCurrentWeather({current:{temperature_2m:-10,relative_humidity_2m:0}}).temperatureC,-10);
 assert.equal(parseCurrentWeather({current:{temperature_2m:0,relative_humidity_2m:100}}).humidity,100);
 for(const current of [null,{}, {temperature_2m:null,relative_humidity_2m:60},{temperature_2m:20,relative_humidity_2m:null},{temperature_2m:NaN,relative_humidity_2m:20},{temperature_2m:20,relative_humidity_2m:101},{temperature_2m:20,relative_humidity_2m:-1}])assert.throws(()=>parseCurrentWeather({current}));
});
test('weather shares only rounded coordinates and honors cancellation and HTTP errors',async t=>{
 const signal=new AbortController().signal;
 t.mock.method(globalThis,'fetch',async(url,options)=>{
  const u=new URL(url);assert.equal(u.searchParams.get('latitude'),'42.3');assert.equal(u.searchParams.get('longitude'),'-83.7');assert.equal(options.signal,signal);assert.equal(options.cache,'no-store');
  return {ok:true,json:async()=>({current:{temperature_2m:20,relative_humidity_2m:65}})};
 });
 assert.equal((await fetchCurrentWeather(42.34567,-83.71234,signal)).humidity,65);
 globalThis.fetch=async()=>({ok:false});await assert.rejects(fetchCurrentWeather(42,-83,signal));
});

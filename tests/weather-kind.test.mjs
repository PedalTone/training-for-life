import test from 'node:test';
import assert from 'node:assert/strict';
import { weatherKind } from '../app/weather-kind.ts';
test('current weather distinguishes clear days and nights',()=>{
 assert.equal(weatherKind(0,1),'sun'); assert.equal(weatherKind(1,0),'moon');
});
test('WMO conditions include frozen precipitation and storms',()=>{
 for(const [code,kind] of [[2,'cloud'],[3,'cloud'],[45,'fog'],[48,'fog'],[51,'rain'],[67,'rain'],[82,'rain'],[71,'snow'],[86,'snow'],[95,'storm'],[99,'storm']]) assert.equal(weatherKind(code,1),kind);
});
test('unknown or malformed codes are never shown as sunny weather',()=>{
 for(const code of [-1,4,100,NaN,undefined,'0']) assert.equal(weatherKind(code,1),null);
});

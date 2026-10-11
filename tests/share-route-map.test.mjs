import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const compiled=await build({entryPoints:['app/share-route-map.ts'],bundle:true,write:false,platform:'node',format:'cjs'});
const mapModule={exports:{}};new Function('module','exports',compiled.outputFiles[0].text)(mapModule,mapModule.exports);
const {shareMapLayout}=mapModule.exports;
test('map fits separate segments in every export viewport with visible endpoints',()=>{
 const route=[[[-74,40.7],[-73.98,40.72]],[[-73.97,40.72],[-73.95,40.74]]];const original=structuredClone(route);
 for(const height of [350,620,1200]){const layout=shareMapLayout(route,912,height);assert.equal(layout.segments.length,2);assert.ok(layout.tiles.length<40);for(const [x,y]of layout.segments.flat()){assert.ok(x>=45&&x<=867);assert.ok(y>=45&&y<=height-45);}assert.ok(layout.tiles.every(t=>/^https:\/\/tile.openstreetmap.org\/\d+\/\d+\/\d+\.png$/.test(t.url)));}
 assert.deepEqual(route,original);
});
test('dateline crossing uses nearby wrapped tiles, not a world-wide map',()=>{const layout=shareMapLayout([[[179.99,10],[-179.99,10.01]]],912,600);assert.ok(Math.abs(layout.segments[0][0][0]-layout.segments[0][1][0])>100);assert.ok(layout.tiles.length<30);assert.equal(shareMapLayout([],912,600),undefined);});

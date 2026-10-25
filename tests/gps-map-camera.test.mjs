import {test} from 'node:test';
import assert from 'node:assert/strict';
import {clampZoom,dragCenter,pinchCamera} from '../app/gps-map-camera.ts';
test('pinch preserves a free-map anchor at the same screen position',()=>{
 const center=[.2,.6],anchor=[80,-45],zoom=12;
 const next=pinchCamera(center,zoom,2,anchor,false);
 assert.equal(next.zoom,13);
 for(let i=0;i<2;i++)assert.ok(Math.abs((center[i]+anchor[i]/(256*2**zoom)-next.center[i])*256*2**next.zoom-anchor[i])<1e-7);
});
test('follow pinch retains GPS center while changing zoom',()=>{
 const center=[.3,.5];assert.deepEqual(pinchCamera(center,16,.5,[120,-50],true),{center,zoom:15});
 assert.equal(pinchCamera(center,17,100,[0,0],true).zoom,18);
 assert.equal(pinchCamera(center,2,.01,[0,0],false).zoom,1);
});
test('drag moves map under the finger and keeps latitude in bounds',()=>{
 assert.deepEqual(dragCenter([.5,.5],256,-256,1),[0,1]);
 assert.deepEqual(dragCenter([.5,.5],0,1000,1),[.5,0]);
 assert.equal(clampZoom(22),18);assert.equal(clampZoom(-2),1);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {workoutPhotos} from '../app/workout-photos.ts';
test('legacy photo and gallery roundtrip retain images without mutating source',()=>{
 const old={workoutPhoto:'data:image/jpeg;base64,old'};
 assert.deepEqual(workoutPhotos(old),[old.workoutPhoto]);
 const saved={...old,workoutPhotos:[old.workoutPhoto,'data:image/jpeg;base64,new']};
 assert.deepEqual(workoutPhotos(JSON.parse(JSON.stringify(saved))),saved.workoutPhotos);
 assert.deepEqual(workoutPhotos({...saved,workoutPhotos:[saved.workoutPhotos[1]],workoutPhoto:saved.workoutPhotos[1]}),[saved.workoutPhotos[1]]);
 assert.deepEqual(workoutPhotos({}),[]);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { adventureSceneFor, adventureBackgroundFor } from '../app/adventure-scenes.ts';
test('every standard workout resolves to its distinct illustrated setting', () => {
  assert.equal(adventureSceneFor('strength').name,'Indoor strength room');
  assert.equal(adventureSceneFor('speed').name,'Downhill switchbacks');
  assert.equal(adventureSceneFor('aerobic').name,'Easy riverside jog');
  assert.equal(adventureSceneFor('mobility').name,'Indoor mobility studio');
  assert.equal(adventureSceneFor('endurance').name,'Long winding trail');
  assert.equal(adventureSceneFor('rest').name,'Quiet beach');
  assert.equal(new Set(['strength','speed','aerobic','mobility','endurance','rest'].map(k=>adventureSceneFor(k).position)).size,6);
});
test('a changed workout key immediately selects different artwork; custom types remain supported', () => {
  let plan = { key:'strength' };
  assert.equal(adventureSceneFor(plan.key).position,'0% 0%');
  plan = { key:'rest' };
  assert.equal(adventureSceneFor(plan.key).position,'100% 100%');
  assert.equal(adventureSceneFor('custom:Yoga').name,'Indoor mobility studio');
});

test('endurance and mobility select their standalone artwork',()=>{assert.match(adventureBackgroundFor('endurance').backgroundImage,/endurance-trail/);assert.equal(adventureBackgroundFor('endurance').backgroundSize,'cover');assert.match(adventureBackgroundFor('mobility').backgroundImage,/mobility-rear-view/);});

test('strength and aerobic use their approved text-free standalone assets',()=>{assert.match(adventureBackgroundFor('strength').backgroundImage,/strength-kettlebell/);assert.match(adventureBackgroundFor('aerobic').backgroundImage,/aerobic-woman/);});

import test from 'node:test';
import assert from 'node:assert/strict';
import { adventureSceneFor, adventureBackgroundFor } from '../app/adventure-scenes.ts';
test('every standard workout resolves to its distinct illustrated terrain', () => {
  assert.equal(adventureSceneFor('strength').name,'Alpine boulder lift');
  assert.equal(adventureSceneFor('speed').name,'Downhill switchbacks');
  assert.equal(adventureSceneFor('aerobic').name,'Easy riverside jog');
  assert.equal(adventureSceneFor('mobility').name,'Wildflower meadow');
  assert.equal(adventureSceneFor('endurance').name,'Long winding trail');
  assert.equal(adventureSceneFor('rest').name,'Quiet beach');
  assert.equal(new Set(['strength','speed','aerobic','mobility','endurance','rest'].map(k=>adventureSceneFor(k).position)).size,6);
});
test('a changed workout key immediately selects different artwork; custom types remain supported', () => {
  let plan = { key:'strength' };
  assert.equal(adventureSceneFor(plan.key).position,'0% 0%');
  plan = { key:'rest' };
  assert.equal(adventureSceneFor(plan.key).position,'100% 100%');
  assert.equal(adventureSceneFor('custom:Yoga').name,'Wildflower meadow');
});

test('endurance uses the approved standalone landscape while other scenes keep their atlas',()=>{assert.match(adventureBackgroundFor('endurance').backgroundImage,/endurance-trail/);assert.equal(adventureBackgroundFor('endurance').backgroundSize,'cover');assert.match(adventureBackgroundFor('mobility').backgroundImage,/adventure-terrain/);});

test('strength and aerobic use their approved text-free standalone assets',()=>{assert.match(adventureBackgroundFor('strength').backgroundImage,/strength-boulder/);assert.match(adventureBackgroundFor('aerobic').backgroundImage,/aerobic-jogger/);});

import test from 'node:test';
import assert from 'node:assert/strict';
import { adventureSceneFor, adventureBackgroundFor } from '../app/adventure-scenes.ts';
test('every standard workout resolves to its distinct illustrated setting', () => {
  assert.equal(adventureSceneFor('strength').name,'Indoor strength room');
  assert.equal(adventureSceneFor('speed').name,'Running on the track');
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
  assert.equal(adventureSceneFor('custom:Yoga').name,'Indoor yoga studio');
});

test('endurance and mobility select their standalone artwork',()=>{assert.match(adventureBackgroundFor('endurance').backgroundImage,/endurance-trail/);assert.equal(adventureBackgroundFor('endurance').backgroundSize,'cover');assert.match(adventureBackgroundFor('mobility').backgroundImage,/mobility-rear-view/);});

test('strength and aerobic use their approved text-free standalone assets',()=>{assert.match(adventureBackgroundFor('strength').backgroundImage,/strength-kettlebell/);assert.match(adventureBackgroundFor('aerobic').backgroundImage,/aerobic-woman/);});


test('new activities and existing custom names share distinct artwork', () => {
  for (const key of ['yoga','pilates','swimming','pickleball','tennis','basketball']) {
    const direct = adventureBackgroundFor(key);
    assert.match(direct.backgroundImage, new RegExp(key + '-2026.10.11'));
    assert.equal(direct.backgroundSize, 'cover');
    assert.deepEqual(adventureBackgroundFor('custom:' + key[0].toUpperCase() + key.slice(1)), direct);
  }
  assert.deepEqual(adventureBackgroundFor('custom:Swim'), adventureBackgroundFor('swimming'));
  assert.match(adventureBackgroundFor('speed').backgroundImage, /speed-2026.10.11/);
  assert.equal(adventureSceneFor('custom:Unknown').name, 'Indoor mobility studio');
});

test('Walk uses the existing outdoor trail consistently, including custom Walk names',()=>{
 assert.equal(adventureSceneFor('walk').name,'Walking trail');assert.match(adventureBackgroundFor('walk').backgroundImage,/endurance-trail/);assert.deepEqual(adventureBackgroundFor('custom:Walk'),adventureBackgroundFor('walk'));
});

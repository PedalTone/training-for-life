import test from 'node:test';
import assert from 'node:assert/strict';
import {swipeStep, adjacentSwipeTab} from '../app/swipe-navigation.ts';
test('deliberate horizontal swipes navigate in either direction',()=>{
 assert.equal(swipeStep(-120,15,250),1); assert.equal(swipeStep(120,15,250),-1);
 assert.equal(adjacentSwipeTab('today',1),'week'); assert.equal(adjacentSwipeTab('today',-1),'home');
 assert.equal(adjacentSwipeTab('more',1),undefined); assert.equal(adjacentSwipeTab('home',-1),undefined);
});
test('short, diagonal, vertical and slow gestures do not navigate',()=>{
 for(const gesture of [[30,0,100],[100,70,100],[10,120,100],[100,0,900]]) assert.equal(swipeStep(...gesture),0);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {Pond} from '../src/core.mjs';
test('feeds are limited per viewer, grow the pond every three accepted feeds, and cap population',()=>{
 let time=0;const pond=new Pond({now:()=>time,random:()=>.9});
 assert.equal(pond.feed('River').ok,true);assert.equal(pond.feed('river').ok,false);assert.equal(pond.feeds,1);
 pond.feed('Other');time=6000;assert.equal(pond.feed('River').added,true);assert.equal(pond.residents,8);
 for(let i=0;i<100;i++){time+=6000;pond.feed('River');}
 assert.equal(pond.residents,24);assert.equal(pond.feed('  ').ok,false);
});
test('encounters reject duplicate entries, close on deadline, and record exactly one winner',()=>{
 let time=0;const pond=new Pond({now:()=>time,random:()=>.6});
 assert.equal(pond.catch('a').ok,false);assert.equal(pond.startEncounter(),true);assert.equal(pond.startEncounter(),false);
 assert.equal(pond.catch('River').ok,true);assert.equal(pond.catch(' river ').ok,false);assert.equal(pond.catch('Ocean').ok,true);
 assert.equal(pond.finishEncounter(),null);time=20000;assert.equal(pond.catch('late').ok,false);
 assert.deepEqual(pond.finishEncounter(),{winner:'Ocean'});assert.equal(pond.collection.length,1);assert.equal(pond.finishEncounter(),null);
});
test('an empty encounter expires without inventing a winner',()=>{let time=0;const pond=new Pond({now:()=>time});pond.startEncounter();time=21000;assert.deepEqual(pond.finishEncounter(),{winner:null});assert.equal(pond.collection.length,0);});
test('random encounters begin only after six feeds and can be disabled',()=>{let time=0;const pond=new Pond({now:()=>time,random:()=>0});for(let i=0;i<5;i++){pond.feed('river');time+=6000;}assert.equal(pond.encounter,null);assert.equal(pond.feed('river').appeared,true);const other=new Pond({random:()=>0});other.autoEncounters=false;for(let i=0;i<10;i++)other.feed(`user${i}`);assert.equal(other.encounter,null);});

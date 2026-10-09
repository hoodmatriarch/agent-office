import test from 'node:test';
import assert from 'node:assert/strict';
import { STUDY, STUDY_PLAN } from '../src/shared/study-plan.js';
import { BREAK,builtinFloor } from '../src/shared/builtin-floors.js';
import { seatHereOn } from '../src/shared/maps/index.js';
import { StudyData,studyHint,type Lesson } from '../src/client/features/study/data.js';
import { Collection } from '../src/client/features/facilities/data.js';
const lesson:Lesson={id:'math-1',subject:'Math',title:'Addition',lecture:'Combine groups',task:'Try two groups',hints:'Use counters',homework:'Draw two groups',test:'1 + 1 = ?'};
test('study floor has distinct shared seating, independent of the break floor',()=>{
  assert.equal(builtinFloor(STUDY)?.plan,STUDY_PLAN);
  assert.ok(seatHereOn(STUDY_PLAN,'study-desk-0-0:0',false));
  assert.equal(seatHereOn(builtinFloor(BREAK)!.plan,'study-desk-0-0:0',false),undefined);
  assert.equal(STUDY_PLAN.seating.length,13);
});
test('homework keeps work and locker location when assigned again, and creates a new attempt after submission',()=>{
  const data=new StudyData();const first=data.assign(lesson);first.work='My answer';first.location='locker';
  assert.equal(data.assign(lesson),first);assert.equal(data.value.homework.length,1);assert.equal(first.work,'My answer');assert.equal(first.location,'locker');
  first.submitted=true;assert.notEqual(data.assign(lesson).id,first.id);assert.equal(data.value.homework.length,2);
});
test('help follows the chosen approach and uses authored guidance without inventing subject answers',()=>{
  assert.match(studyHint('Visual examples','Help',lesson),/diagram/);
  assert.match(studyHint('Practice first','Help',lesson),/smaller example/);
  assert.match(studyHint('Step by step','Help',lesson),/Use counters/);
  assert.match(studyHint('Read and reflect','Help'),/when we add your curriculum/);
});
test('rapid note saves serialize revisions rather than rejecting each other',async()=>{
  const original=globalThis.fetch;const revisions:number[]=[];let revision=0;
  globalThis.fetch=async(_url,options)=>{const body=JSON.parse(String(options?.body));revisions.push(body.revision);await new Promise(r=>setTimeout(r,5));assert.equal(body.revision,revision);return new Response(JSON.stringify({revision:++revision}),{status:200});};
  try{const collection=new Collection('study',{note:'First'});const a=collection.save();collection.value.note='Second';const b=collection.save();await Promise.all([a,b]);assert.deepEqual(revisions,[0,1]);assert.equal(collection.revision,2);}finally{globalThis.fetch=original;}
});

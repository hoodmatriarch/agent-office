import test from 'node:test';
import assert from 'node:assert/strict';
import {spreadPages,turnPage,noteMarkdown,readingTags,type ReadingNote} from '../src/shared/reading.js';
test('cover, facing spreads and last single leaf turn without skipping pages',()=>{
  assert.deepEqual(spreadPages(0,6),[0]);assert.deepEqual(spreadPages(2,6),[1,2]);assert.deepEqual(spreadPages(5,6),[5]);
  let page=0;const forward:number[]=[];while(page<5){forward.push(page);page=turnPage(page,6,1);}assert.deepEqual(forward,[0,1,3]);
  assert.equal(turnPage(5,6,-1),4);assert.deepEqual(spreadPages(4,6),[3,4]);assert.equal(turnPage(1,6,-1),0);
  assert.deepEqual(spreadPages(2,6,true),[2]);assert.equal(turnPage(2,6,1,true),3);assert.deepEqual(spreadPages(999,5),[3,4]);
});
test('saved note export includes automatic metadata and exact encoded citation links',()=>{
  const note:ReadingNote={id:'note / 1',source:{id:'book',title:'Joinery',asset:{id:'asset',name:'joinery.pdf',size:1,type:'application/pdf'},bucket:'organizer'},title:'Mortise notes',subject:'Woodwork',date:'2026-10-10',updated:'',tags:'practice',text:'Measure twice.',citations:[{id:'ref & 2',page:4,quote:'Cut carefully.'}]};
  assert.match(readingTags(note),/book:Joinery, subject:Woodwork, date:2026-10-10, reading-notes, practice/);
  const md=noteMarkdown(note,'http://localhost:4600');assert.match(md,/PDF\/file page 5/);assert.ok(md.includes('reading-note=note%20%2F%201&citation=ref%20%26%202'));assert.match(md,/> Cut carefully\./);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {assigned,importShelves,type ArchiveItem} from '../src/shared/resources.js';
const asset={id:'one-original',name:'guide.pdf',size:42,type:'application/pdf'};
test('one original can live on multiple station shelves with searchable sections',()=>{
  const items:ArchiveItem[]=[{id:'one',title:'Tool safety',folder:'Guides',tags:'workshop',note:'',asset,stations:['woodwork','jewellery'],section:'Safety'}];
  assert.equal(assigned(items,'woodwork','safety')[0].asset,asset);assert.equal(assigned(items,'jewellery').length,1);assert.equal(assigned(items,'textiles').length,0);
  items[0].stations=['woodwork'];assert.equal(assigned(items,'jewellery').length,0);assert.equal(items[0].asset,asset);
});
test('legacy migration reuses originals, preserves document details and respects later unassignment',()=>{
  const items:ArchiveItem[]=[{id:'existing',title:'My custom title',folder:'Keep folder',tags:'personal',note:'Keep note',asset,section:'Safety'}];
  const shelves=[{bucket:'craft-library',books:[{id:'old1',title:'Old title',asset,station:'woodwork'},{id:'old2',title:'Other title',asset,station:'jewellery'}]}];
  assert.equal(importShelves(items,shelves,()=>{throw Error('Must reuse original');}),true);assert.equal(items.length,1);assert.deepEqual(items[0].stations,['woodwork','jewellery']);assert.equal(items[0].folder,'Keep folder');assert.equal(items[0].title,'My custom title');
  items[0].stations=['woodwork'];assert.equal(importShelves(items,shelves,()=>''),false);assert.deepEqual(items[0].stations,['woodwork']);assert.equal(items[0].legacyRefs?.length,2);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readdirSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {Readable,PassThrough} from 'node:stream';
import {Facilities} from '../src/server/facilities.js';
import {uploadStream,UploadError} from '../src/server/storage/uploads.js';
import {byteRange} from '../src/server/storage/media.js';
import {storageSnapshot} from '../src/server/storage/stats.js';
import {MAX_UPLOAD_BYTES,formatBytes} from '../src/shared/capacity.js';
test('140 MB files stream into the correct vault and inventory without duplicating shared shelf assignments',async()=>{
 const dir=mkdtempSync(path.join(os.tmpdir(),'office-storage-'));
 try{const vault=new Facilities(dir,'one'),other=new Facilities(dir,'two'),chunk=Buffer.alloc(1024*1024,32);chunk.write('%PDF-1.4');
  async function* parts(){for(let i=0;i<140;i++)yield chunk;}
  const asset=await uploadStream(vault.dir,'../Oxford-size-fixture.pdf',Readable.from(parts()),140*1024*1024);
  assert.equal(asset.name,'Oxford-size-fixture.pdf');assert.equal(asset.size,140*1024*1024);assert.equal(vault.fileLocation(asset.id)?.asset.size,asset.size);assert.equal(other.fileLocation(asset.id),null);
  vault.put('organizer',0,[{id:'shared',asset,stations:['woodwork','jewellery']}]);
  const stats=await storageSnapshot(vault.dir);assert.equal(stats.files,1);assert.equal(stats.originalsBytes,asset.size);assert.equal(stats.types[0].type,'PDF books');assert.equal(stats.largest[0].id,asset.id);assert.ok(stats.cabinetBytes>asset.size);
  assert.equal((await storageSnapshot(other.dir)).files,0);assert.ok(stats.memory.server>0);assert.equal(stats.limits.file,MAX_UPLOAD_BYTES);assert.equal(stats.limits.concurrentUploads,2);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('oversized, empty, invalid and interrupted uploads do not publish or leave partial files',async()=>{
 const dir=mkdtempSync(path.join(os.tmpdir(),'office-partial-'));
 try{
  await assert.rejects(uploadStream(dir,'large.pdf',Readable.from([]),MAX_UPLOAD_BYTES+1),e=>e instanceof UploadError&&e.status===413);
  await assert.rejects(uploadStream(dir,'empty.pdf',Readable.from([]),0),/non-empty/);
  await assert.rejects(uploadStream(dir,'fake.pdf',Readable.from([Buffer.from('not a PDF')]),9),/not a PDF/);
  async function* broken(){yield Buffer.from('%PDF-');throw Error('connection lost');}
  await assert.rejects(uploadStream(dir,'cutoff.pdf',Readable.from(broken())),/connection lost/);
  await assert.rejects(uploadStream(dir,'incomplete.txt',Readable.from([Buffer.from('short')]),20),/incomplete/);
  assert.deepEqual(readdirSync(dir),[]);
  const valid=await uploadStream(dir,'hello.txt',Readable.from([Buffer.from('hello')]),5);assert.equal((await readFile(path.join(dir,valid.id+'.bin'))).toString(),'hello');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('streamed media range decisions support seeking and reject malformed or out-of-bounds ranges',()=>{
 assert.equal(byteRange(undefined,100),null);assert.deepEqual(byteRange('bytes=20-29',100),{start:20,end:29});assert.deepEqual(byteRange('bytes=-12',100),{start:88,end:99});assert.deepEqual(byteRange('bytes=90-',100),{start:90,end:99});assert.deepEqual(byteRange('bytes=90-200',100),{start:90,end:99});
 for(const bad of ['bytes=100-','bytes=20-10','bytes=-0','bytes=','bytes=1-2,4-5','bytes=9007199254740993-'])assert.equal(byteRange(bad,100),false);
 assert.equal(formatBytes(MAX_UPLOAD_BYTES),'512 MB');
});
test('only two uploads run concurrently and completing them releases capacity',async()=>{
 const dir=mkdtempSync(path.join(os.tmpdir(),'office-concurrent-'));
 try{const a=new PassThrough(),b=new PassThrough(),first=uploadStream(dir,'one.txt',a,1),second=uploadStream(dir,'two.txt',b,1);
  await assert.rejects(uploadStream(dir,'three.txt',Readable.from([Buffer.from('c')]),1),e=>e instanceof UploadError&&e.status===429);
  a.end('a');b.end('b');await Promise.all([first,second]);assert.equal((await uploadStream(dir,'three.txt',Readable.from([Buffer.from('c')]),1)).size,1);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

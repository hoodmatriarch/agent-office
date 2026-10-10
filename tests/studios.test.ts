import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync,readFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { recipe,scad,svgPattern } from '../src/shared/studio-files.js';
import { wav,midi } from '../src/shared/studio-audio.js';
import { validateGLB } from '../src/shared/studio-model.js';
import { Facilities } from '../src/server/facilities.js';
import { serveMedia } from '../src/server/studios/media.js';
import { saveSettings,studioSettings } from '../src/server/studios/settings.js';
import { concept } from '../src/server/studios/ai.js';
import { builtinFloor } from '../src/shared/builtin-floors.js';
import { CREATIVE,CRAFT } from '../src/shared/studio-plans.js';
const valid={shape:'box',width:120,height:80,depth:100,wall:3,color:'#aabbcc'};
test('creative floors are independent of repositories and have safe native arrivals',()=>{for(const id of [CREATIVE,CRAFT]){const f=builtinFloor(id)!;assert.ok(f);assert.equal(f.plan.desks.length,0);assert.equal(f.plan.spawn.z,12.6);assert.equal(f.plan.seating.length,0);}});
test('design recipes reject code, unbounded geometry and hollow walls that close openings',()=>{
  assert.deepEqual(recipe(valid),valid);assert.throws(()=>recipe({...valid,shape:'exec'}));assert.throws(()=>recipe({...valid,width:NaN}));assert.throws(()=>recipe({...valid,wall:70}));assert.throws(()=>recipe({...valid,parts:[],shape:'assembly'}));
  const assembly=recipe({...valid,shape:'assembly',parts:[{kind:'box',size:[100,100,5],position:[0,0,20],rotation:[0,0,0],cut:false}]});assert.ok(scad(assembly).includes('cube([100,100,5]'));assert.throws(()=>recipe({...assembly,parts:Array(49).fill(assembly.parts![0])}));assert.throws(()=>recipe({...assembly,parts:[{...assembly.parts![0],position:[Infinity,0,0]}]}));
  assert.ok(svgPattern(200,300,10).includes('width="220mm"'));assert.throws(()=>svgPattern(200,300,-1));
});
test('audio exports are standard PCM WAV and MIDI with tempo and note-on/off events',()=>{
  const bytes=wav(new Float32Array([0,1,-1]),44100),view=new DataView(bytes.buffer);assert.equal(Buffer.from(bytes.subarray(0,4)).toString(),'RIFF');assert.equal(view.getUint32(24,true),44100);assert.equal(view.getUint32(40,true),6);assert.equal(view.getInt16(46,true),32767);assert.equal(view.getInt16(48,true),-32767);
  const sequence=midi([{pitch:60,start:0,duration:.5,velocity:1}],120);assert.equal(Buffer.from(sequence.subarray(0,4)).toString(),'MThd');assert.ok(Buffer.from(sequence).includes(Buffer.from([0x90,60,127])));assert.ok(Buffer.from(sequence).includes(Buffer.from([0x80,60,0])));
});
function glb(json:unknown){const text=Buffer.from(JSON.stringify(json)),size=Math.ceil(text.length/4)*4,bytes=Buffer.alloc(20+size,32);bytes.writeUInt32LE(0x46546c67,0);bytes.writeUInt32LE(2,4);bytes.writeUInt32LE(bytes.length,8);bytes.writeUInt32LE(size,12);bytes.writeUInt32LE(0x4e4f534a,16);text.copy(bytes,20);return bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength) as ArrayBuffer;}
test('prototype display refuses resource fetches and oversized geometry',()=>{assert.ok(validateGLB(glb({asset:{version:'2.0'},buffers:[{byteLength:0}]})));assert.throws(()=>validateGLB(glb({images:[{uri:'http://attacker.example/image.png'}]})));assert.throws(()=>validateGLB(glb({buffers:[{uri:'/api/facilities/file?id=secret'}]})));assert.throws(()=>validateGLB(glb({accessors:[{count:2000000}]})));});
test('video seeking sends only requested bytes and correctly refuses invalid ranges',()=>{
  const asset={id:'a',name:'Lesson.mp4',type:'video/mp4',size:10},body=Buffer.from('0123456789');
  for(const [range,expected,code]of [['bytes=2-5','2345',206],['bytes=-3','789',206],['bytes=30-','',416]]as const){let status=0,headers:any,result=Buffer.alloc(0);const res={writeHead(c:number,h:unknown){status=c;headers=h;},end(b?:Buffer){result=b??Buffer.alloc(0);}};serveMedia(res as any,asset,body,range,false);assert.equal(status,code);assert.equal(result.toString(),expected);assert.equal(headers['accept-ranges'],'bytes');}
});
test('API settings are encrypted, isolated and never returned by the status endpoint',async()=>{
  const dir=mkdtempSync(path.join(os.tmpdir(),'studio-vault-'));try{const vault=new Facilities(dir,'one'),other=new Facilities(dir,'two');saveSettings(vault,'test-secret',{openai:'fixture-secret',openaiModel:'test-model'});assert.equal(studioSettings(vault,'test-secret').openai,'fixture-secret');assert.deepEqual(studioSettings(other,'test-secret'),{});assert.ok(!readFileSync(path.join(vault.dir,'connections.enc')).includes('fixture-secret'));assert.throws(()=>studioSettings(vault,'wrong-secret'));
    const original=globalThis.fetch;globalThis.fetch=(async(_url,init)=>{const body=JSON.parse(String(init!.body));assert.equal(body.model,'test-model');assert.equal(body.store,false);return new Response(JSON.stringify({output:[{content:[{type:'output_text',text:JSON.stringify(valid)}]}]}),{status:200,headers:{'content-type':'application/json'}});}) as typeof fetch;
    try{assert.deepEqual(await concept(vault,'test-secret','openai','A hollow wooden box'),valid);}finally{globalThis.fetch=original;}
    const a=vault.upload('lesson.mp4',Buffer.from('video-fixture'));assert.equal(a.type,'video/mp4');assert.equal(other.file(a.id),null);vault.put('creative-music',0,{notes:[60]});assert.deepEqual(new Facilities(dir,'one').get('creative-music').value,{notes:[60]});
  }finally{rmSync(dir,{recursive:true,force:true});}
});

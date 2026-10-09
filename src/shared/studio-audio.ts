export interface Note {pitch:number;start:number;duration:number;velocity:number;}
export function wav(samples:Float32Array,rate:number):Uint8Array {
  const bytes=new Uint8Array(44+samples.length*2),v=new DataView(bytes.buffer);
  const text=(at:number,s:string)=>{for(let i=0;i<s.length;i++)bytes[at+i]=s.charCodeAt(i);};
  text(0,'RIFF');v.setUint32(4,bytes.length-8,true);text(8,'WAVE');text(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);text(36,'data');v.setUint32(40,samples.length*2,true);
  samples.forEach((s,i)=>v.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,s))*32767),true));return bytes;
}
const variable=(n:number)=>{const out=[n&127];while((n>>=7)>0)out.unshift((n&127)|128);return out;};
export function midi(notes:Note[],bpm=120):Uint8Array {
  const ticks=(s:number)=>Math.round(s*bpm/60*480),tempo=Math.round(60000000/bpm);
  const events=notes.flatMap(n=>[{tick:ticks(n.start),data:[0x90,n.pitch,Math.max(1,Math.min(127,Math.round(n.velocity*127)))]},{tick:ticks(n.start+n.duration),data:[0x80,n.pitch,0]}]).sort((a,b)=>a.tick-b.tick||a.data[0]-b.data[0]);
  const track=[0,0xff,0x51,3,(tempo>>16)&255,(tempo>>8)&255,tempo&255];let last=0;
  for(const e of events){track.push(...variable(e.tick-last),...e.data);last=e.tick;}track.push(0,0xff,0x2f,0);
  const size=track.length;return new Uint8Array([77,84,104,100,0,0,0,6,0,0,0,1,1,224,77,84,114,107,(size>>>24)&255,(size>>>16)&255,(size>>>8)&255,size&255,...track]);
}

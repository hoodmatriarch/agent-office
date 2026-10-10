import type { Note } from '../../../shared/studio-audio';
export class PianoEngine {
  context:AudioContext|null=null;sample:AudioBuffer|null=null;
  volume=.35;root=60;private voices=new Map<number,{source:AudioScheduledSourceNode;gain:GainNode}>();
  async ready(){this.context??=new AudioContext();await this.context.resume();return this.context;}
  async setSample(bytes:ArrayBuffer){const ctx=await this.ready();this.sample=await ctx.decodeAudioData(bytes);}
  voice(ctx:BaseAudioContext,pitch:number,start:number,duration?:number,velocity=.8) {
    const gain=ctx.createGain();gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(velocity*this.volume,start+.008);gain.connect(ctx.destination);
    let source:AudioScheduledSourceNode;
    if(this.sample){const node=ctx.createBufferSource();node.buffer=this.sample;node.playbackRate.value=2**((pitch-this.root)/12);source=node;}
    else{const node=ctx.createOscillator();node.type='triangle';node.frequency.value=440*2**((pitch-69)/12);source=node;gain.gain.exponentialRampToValueAtTime(Math.max(.001,velocity*this.volume*.35),start+.4);}
    source.connect(gain);source.start(start);
    if(duration!==undefined){const end=start+Math.max(.04,duration);gain.gain.setTargetAtTime(.0001,end,.035);source.stop(end+.25);}
    source.onended=()=>{source.disconnect();gain.disconnect();};return {source,gain};
  }
  press(pitch:number){if(!this.context||this.voices.has(pitch))return;this.voices.set(pitch,this.voice(this.context,pitch,this.context.currentTime));}
  release(pitch:number){const v=this.voices.get(pitch);if(!v||!this.context)return;v.gain.gain.cancelScheduledValues(this.context.currentTime);v.gain.gain.setTargetAtTime(.0001,this.context.currentTime,.035);try{v.source.stop(this.context.currentTime+.25);}catch{}this.voices.delete(pitch);}
  play(notes:Note[]){if(!this.context)return;const now=this.context.currentTime+.03;for(const n of notes)this.voice(this.context,n.pitch,now+n.start,n.duration,n.velocity);}
  async render(notes:Note[]) {
    if(!notes.length)throw new Error('Record a performance first.');const duration=Math.max(...notes.map(n=>n.start+n.duration))+.5;
    if(duration>900)throw new Error('Export a recording under 15 minutes.');
    const offline=new OfflineAudioContext(1,Math.ceil(duration*44100),44100);for(const n of notes)this.voice(offline,n.pitch,n.start,n.duration,n.velocity);return (await offline.startRendering()).getChannelData(0);
  }
  stop(){for(const pitch of this.voices.keys())this.release(pitch);void this.context?.close();this.context=null;}
}

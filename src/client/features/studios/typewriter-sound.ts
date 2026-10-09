/** Original mechanical key, spacebar and carriage sounds synthesized locally. */
export class TypewriterSound {
  private context: AudioContext | null = null;
  enabled = true;
  volume = .25;
  async key(kind: 'key' | 'space' | 'return') {
    if (!this.enabled || this.volume <= 0) return;
    const ctx = this.context ??= new AudioContext();
    await ctx.resume();
    if (!this.enabled || ctx.state !== 'running') return;
    const start = ctx.currentTime, duration = kind === 'return' ? .22 : kind === 'space' ? .07 : .045;
    const noise = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate), samples = noise.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * .012));
    const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
    source.buffer = noise; filter.type = 'bandpass'; filter.frequency.value = kind === 'space' ? 650 : 1700 + Math.random() * 700; filter.Q.value = .7;
    gain.gain.setValueAtTime(this.volume * .55, start); gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    source.connect(filter).connect(gain).connect(ctx.destination); source.start(start); source.stop(start + duration);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
    const tone = ctx.createOscillator(), click = ctx.createGain(); tone.type = kind === 'return' ? 'sine' : 'triangle';
    tone.frequency.setValueAtTime(kind === 'return' ? 1850 : 250 + Math.random() * 80, start);
    click.gain.setValueAtTime(this.volume * (kind === 'return' ? .18 : .12), start); click.gain.exponentialRampToValueAtTime(.0001, start + (kind === 'return' ? .4 : .06));
    tone.connect(click).connect(ctx.destination); tone.start(start); tone.stop(start + (kind === 'return' ? .42 : .07));
    tone.onended = () => { tone.disconnect(); click.disconnect(); };
  }
  stop() { this.enabled = false; void this.context?.close(); this.context = null; }
}

/** A real copy of the outgoing page turns over the newly rendered spread. */
export function turnAnimation(stage: HTMLElement, leaf: HTMLElement | null, forward: boolean) {
  if (!leaf || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const clone = leaf.cloneNode(true) as HTMLElement, box = leaf.getBoundingClientRect(), parent = stage.getBoundingClientRect();
  const originals = leaf.querySelectorAll('canvas'); clone.querySelectorAll('canvas').forEach((canvas, i) => canvas.getContext('2d')?.drawImage(originals[i], 0, 0));
  clone.querySelectorAll('.reading-corner').forEach(c => c.remove()); clone.classList.add('reading-turn-leaf'); clone.removeAttribute('data-reading-page'); clone.setAttribute('aria-hidden', 'true');
  Object.assign(clone.style, { width: box.width + 'px', height: box.height + 'px', left: box.left - parent.left + stage.scrollLeft + 'px', top: box.top - parent.top + stage.scrollTop + 'px', transformOrigin: forward ? 'left center' : 'right center' });
  stage.append(clone);
  const animation = clone.animate([{ transform: 'rotateY(0deg)', filter: 'brightness(1)' }, { transform: `rotateY(${forward ? -170 : 170}deg)`, filter: 'brightness(.78)' }], { duration: 420, easing: 'ease-in-out', fill: 'forwards' });
  void animation.finished.catch(() => {}).finally(() => clone.remove());
}
export class PaperSound {
  private context: AudioContext | null = null;
  enabled = false;
  async play() {
    if (!this.enabled) return; const ctx = this.context ??= new AudioContext(); await ctx.resume(); if (!this.enabled || ctx.state !== 'running') return;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * .16), ctx.sampleRate), samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / samples.length);
    const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain(); source.buffer = buffer; filter.type = 'lowpass'; filter.frequency.value = 2200; gain.gain.value = .025;
    source.connect(filter).connect(gain).connect(ctx.destination); source.start(); source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
  }
  close() { this.enabled = false; void this.context?.close(); this.context = null; }
}

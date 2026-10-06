import * as THREE from 'three';

/** A separate, non-looping copy of the intro's audio, placed at the boss's computer. */
export class BossSound {
  private readonly media = document.createElement('video');
  private audio: AudioContext | null = null;
  private gain: GainNode | null = null;
  private panner: PannerNode | null = null;
  private tone: BiquadFilterNode | null = null;
  private readonly at = new THREE.Vector3();
  private readonly forward = new THREE.Vector3();
  private readonly up = new THREE.Vector3();

  constructor() { this.media.playsInline = true; this.media.preload = 'metadata'; }

  setSource(url: string) { this.stop(); this.media.src = url; }

  unlock() {
    if (!this.audio) {
      const audio = this.audio = new AudioContext();
      this.gain = audio.createGain();
      this.gain.gain.value = 0;
      this.panner = audio.createPanner();
      this.panner.panningModel = 'HRTF';
      this.panner.distanceModel = 'inverse';
      this.panner.refDistance = 2;
      // Room gains already set the desired level; keep directional positioning without
      // attenuating the main office's 45% a second time with distance.
      this.panner.rolloffFactor = 0;
      this.panner.maxDistance = 40;
      this.tone = audio.createBiquadFilter();
      this.tone.type = 'lowpass';
      audio.createMediaElementSource(this.media).connect(this.gain).connect(this.tone).connect(this.panner).connect(audio.destination);
    }
    void this.audio.resume().catch(() => {});
  }

  async play(): Promise<boolean> {
    if (!this.audio || !this.media.src) return false;
    try { await this.audio.resume(); } catch { return false; }
    if (this.audio.state !== 'running') return false;
    this.media.currentTime = 0;
    try { await this.media.play(); return true; } catch { return false; }
  }

  stop() { this.media.pause(); }

  update(camera: THREE.Camera, screen: THREE.Mesh, volume: number, enabled: boolean) {
    if (!this.audio || !this.gain || !this.panner || !this.tone) return;
    const audio = this.audio;
    const listener = audio.listener;
    screen.getWorldPosition(this.at);
    this.panner.positionX.value = this.at.x;
    this.panner.positionY.value = this.at.y;
    this.panner.positionZ.value = this.at.z;
    camera.getWorldPosition(this.forward);
    const distance = this.forward.distanceTo(this.at);
    listener.positionX.value = this.forward.x;
    listener.positionY.value = this.forward.y;
    listener.positionZ.value = this.forward.z;
    camera.getWorldDirection(this.forward);
    this.up.set(0, 1, 0).applyQuaternion(camera.getWorldQuaternion(new THREE.Quaternion()));
    listener.forwardX.value = this.forward.x;
    listener.forwardY.value = this.forward.y;
    listener.forwardZ.value = this.forward.z;
    listener.upX.value = this.up.x;
    listener.upY.value = this.up.y;
    listener.upZ.value = this.up.z;
    this.gain.gain.setTargetAtTime(enabled ? volume : 0, audio.currentTime, 0.05);
    this.tone.frequency.setTargetAtTime(distance < 5 ? 16000 : 2200, audio.currentTime, 0.1);
    if (!enabled) this.stop();
  }
}

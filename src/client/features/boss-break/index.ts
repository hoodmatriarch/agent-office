import * as THREE from 'three';
import type { Ctx } from '../../core/context';
import { hintTitle, key, onE } from '../../core/hint';
import { h, openModal, toast, type Modal } from '../../ui/dom';
import { textPlane } from '../../world/toon';
import type { Interactable } from '../../world/types';
import { BreakSchedule } from './schedule';
import { BossSound } from './sound';
import { mediaFile } from './storage';
import './ui.css';

declare module '../../world/types' {
  interface InteractKinds {
    bossbreak: true;
  }
}

/** Personal boss-room television: muted on the monitor, spatial audio only during a break. */
export function installBossBreak(ctx: Ctx, deps: { playing(): boolean }) {
  const screen = ctx.office.bossScreen;
  const material = screen.material as THREE.MeshBasicMaterial;
  const gameTexture = material.map;
  const video = document.createElement('video');
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  const texture = new THREE.VideoTexture(video);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sound = new BossSound();
  const schedule = new BreakSchedule();
  let url = '';
  let fileName = '';
  let ready = false;
  let volume = 0.5;
  let modal: Modal | null = null;
  let status: HTMLElement | null = null;
  const message = (text: string) => { if (status) status.textContent = text; };

  // A playful desk plaque doubles as the media controls without changing the Minesweeper chair.
  const plaque = textPlane("WORLD'S BEST BOSS", { bg: '#fff4c7', color: '#342d26', size: 32 });
  plaque.scale.set(0.65 / plaque.geometry.parameters.width, 0.16 / plaque.geometry.parameters.height, 1);
  plaque.position.set(0.82, -0.25, 0.12);
  screen.add(plaque);
  const plaqueAt = plaque.getWorldPosition(new THREE.Vector3());
  const interaction: Interactable = { kind: 'bossbreak', x: plaqueAt.x, y: plaqueAt.y, z: plaqueAt.z, radius: 0.4, label: 'Boss’s extremely important television' };
  plaque.userData.interact = interaction;
  ctx.office.interactables.push(interaction);
  const memo = textPlane('MORALE MEETING\nYou work. I supervise.', { bg: '#fff4c7', color: '#342d26', size: 32 });
  memo.scale.set(0.5 / memo.geometry.parameters.width, 0.3 / memo.geometry.parameters.height, 1);
  memo.position.set(-0.8, -0.23, 0.12);
  screen.add(memo);

  const showVideo = () => {
    const next = ready && !deps.playing() ? texture : gameTexture;
    if (material.map !== next) { material.map = next; material.needsUpdate = true; }
  };
  async function load(file: File) {
    if (!file.type.startsWith('video/') || file.size > 100 * 1024 * 1024) throw new Error('Choose a video file up to 100 MB. MP4 with H.264/AAC works in most browsers.');
    ready = false;
    showVideo();
    video.pause();
    sound.stop();
    if (url) URL.revokeObjectURL(url);
    url = URL.createObjectURL(file);
    fileName = file.name;
    video.src = url;
    sound.setSource(url);
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => { video.onloadeddata = video.onerror = null; resolve(); };
      video.onerror = () => { video.onloadeddata = video.onerror = null; reject(new Error('This browser cannot play that video. Try an H.264/AAC MP4.')); };
      video.load();
    });
    ready = true;
    void video.play().catch(() => message('Video loaded. Click or press a key in the office to start it.'));
    schedule.arm(Date.now());
    showVideo();
    message(`${fileName} · muted video loops continuously · theme every 15 minutes`);
  }

  function controls() {
    if (modal) return;
    const input = h('input', { type: 'file', accept: 'video/*', 'aria-label': 'Original U.S. Office intro video' });
    status = h('p.boss-break-status', { role: 'status' }, ready ? `${fileName} · muted video loops continuously · theme every 15 minutes` : 'No intro loaded. Minesweeper is still available.');
    const level = h('input', { type: 'range', min: 0, max: 100, value: Math.round(volume * 100), 'aria-label': 'Boss theme volume' });
    const percent = h('span', {}, `${Math.round(volume * 100)}%`);
    const preview = h('button.btn', { type: 'button' }, 'Play theme now');
    const panel = h('section.boss-break-panel', {},
      h('h2', {}, 'The boss is “supervising”'),
      h('p', {}, 'The original American Office opening. Bring your own video copy; no covers or substitute recordings are bundled.'),
      h('label', {}, 'Intro video', input),
      status,
      h('label', {}, 'Theme volume ', percent, level),
      h('p', {}, 'The theme plays once every 15 minutes from this computer, fading with distance. The screen loops silently. Sit in the boss’s chair and press E to play Minesweeper.'),
      preview,
      h('p', {}, 'Your video stays in this browser. Playback runs while this office page is open.'),
    );
    level.oninput = () => { volume = Number(level.value) / 100; percent.textContent = `${level.value}%`; };
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      input.disabled = true;
      message('Loading the intro…');
      sound.unlock();
      try {
        await load(file);
        try { await mediaFile(file); } catch { message(`${file.name} is playing, but browser storage is unavailable. Choose it again next visit.`); }
      } catch (error) { message((error as Error).message); }
      finally { input.disabled = false; }
    };
    preview.onclick = async () => {
      sound.unlock();
      if (!ready) { message('Choose the original U.S. intro video first.'); return; }
      if (!(await sound.play())) message('Audio could not start. Click Play theme now again.');
      else schedule.arm(Date.now());
    };
    modal = openModal(panel, { onClose: () => { modal = null; status = null; } });
  }

  ctx.interactions.define('bossbreak', {
    reach: 4,
    hint: () => ({ k: String(ready), parts: [hintTitle('World’s Best Boss'), key('E', 'Boss TV controls')] }),
    use: onE(controls),
  });
  const unlock = () => {
    try { sound.unlock(); } catch { /* This browser has no Web Audio. */ }
    if (ready && video.paused) void video.play().catch(() => {});
  };
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
  ctx.ticks.add('world', () => {
    const active = ctx.inOffice() && !ctx.upTop() && !ctx.trip() && !document.hidden;
    if (active && ready) {
      if (video.paused) void video.play().catch(() => {});
    } else video.pause();
    showVideo();
    const audible = active && ready && !ctx.settings.muted && !ctx.settings.musicMuted;
    sound.update(ctx.camera, screen, volume * ctx.settings.volume, audible);
    if (schedule.due(Date.now(), audible)) void sound.play();
  });
  void mediaFile().then(file => file && load(file)).catch(() => toast('Boss TV: choose the intro again from the World’s Best Boss plaque.', 'warn'));
}


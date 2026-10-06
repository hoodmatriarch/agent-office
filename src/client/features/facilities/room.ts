import * as THREE from 'three';
import { h, modalOpen, toast } from '../../ui/dom';
import { GuideWalker } from '../guide/walker';
import { BreakWorld, type Station } from './world';
import { RoutineStaff, CLEANING, MAINTENANCE } from './staff';
import { panel, action, closeCleanup } from './panels';
import { guideAccess } from '../guide/access';

export class BreakRoom {
  world: BreakWorld | null = null;
  private exit: (() => void) | null = null;
  private position: [number, number] = [0, 10];
  private yaw = 0;
  private pitch = -.06;
  private walker = new GuideWalker();
  private keys = new Set<string>();
  private seated = false;
  private last = 0;
  private frame = 0;
  private queued = false;
  carried = '';
  tray = '';
  constructor(private readonly visit: (station: Station) => void | Promise<void>, private readonly ready: (world: BreakWorld) => void | Promise<void>) {}
  open() {
    if (this.exit) return;
    const { root, body, modal } = panel('🌿 The break floor', true);
    root.classList.add('break-floor');
    const world = this.world = new BreakWorld();
    const canvas = h('canvas.break-view', { tabindex: 0, 'aria-label': 'Walkable break floor. W A S D to move, drag to look, E to use a nearby station.' });
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8)); renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const camera = new THREE.PerspectiveCamera(50, 1, .1, 130); camera.rotation.order = 'YXZ';
    const hint = h('div.break-hint'), map = h('div.break-map'), belongings = h('span.break-belongings');
    const mode = action('Walk around', () => { overview = !overview; mode.textContent = overview ? 'Walk around' : 'Floor overview'; });
    let overview = true, dragging = false, lastX = 0, lastY = 0, hintKey = '', destination: typeof world.spots[number] | null = null;
    const cleaner = new RoutineStaff('June · cleaning lady', CLEANING, () => world.nav, world.scene);
    const maintenance = new RoutineStaff('Leon · maintenance', MAINTENANCE, () => world.nav, world.scene, true);
    this.position = [0, 10]; this.walker.at = [...this.position]; this.seated = false;
    const use = async (id: Station) => {
      if (id === 'exit') return modal.close();
      if (id === 'couch') this.sit();
      this.queued = true;
      try { await this.visit(id); } catch (error) { toast((error as Error).message, 'error'); } finally { this.queued = false; }
    };
    for (const spot of world.spots.filter((spot, i, all) => all.findIndex(s => s.id === spot.id) === i)) map.append(action(spot.name, () => { overview = false; mode.textContent = 'Floor overview'; destination = spot; this.walker.at = [...this.position]; this.walker.go(world.nav, spot.approach); this.seated = false; canvas.focus(); }));
    body.append(h('div.break-controls', {}, mode, action('Ask Pip', () => guideAccess.show?.()), h('span', {}, 'WASD / arrows: walk · drag: look · E: use · choose a place below to walk there'), belongings), canvas, hint, map);
    const interact = () => { let best = Infinity, target: Station | null = null; for (const spot of world.spots) { const d = Math.hypot(this.position[0] - spot.approach[0], this.position[1] - spot.approach[1]); if (d < best && d < 2.6) { best = d; target = spot.id; } } return target; };
    const down = (event: KeyboardEvent) => {
      if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement || !root.parentElement || root.parentElement.nextElementSibling) return;
      if (event.code === 'F2') { event.preventDefault(); event.stopPropagation(); guideAccess.show?.(); return; }
      if (['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(event.code)) { event.preventDefault(); event.stopPropagation(); this.keys.add(event.code); this.walker.stop(); this.seated = false; overview = false; mode.textContent = 'Floor overview'; }
      if (event.code === 'KeyE' && !event.repeat) { event.preventDefault(); event.stopPropagation(); const id = interact(); if (id) void use(id); }
    };
    const up = (event: KeyboardEvent) => this.keys.delete(event.code);
    const blur = () => { this.keys.clear(); dragging = false; };
    window.addEventListener('keydown', down, true); window.addEventListener('keyup', up); window.addEventListener('blur', blur);
    canvas.onpointerdown = event => { dragging = true; lastX = event.clientX; lastY = event.clientY; canvas.setPointerCapture(event.pointerId); canvas.focus(); };
    canvas.onpointermove = event => { if (!dragging || overview) return; this.yaw -= (event.clientX - lastX) * .005; this.pitch = Math.max(-1.2, Math.min(.7, this.pitch - (event.clientY - lastY) * .005)); lastX = event.clientX; lastY = event.clientY; };
    canvas.onpointerup = () => { dragging = false; };
    const observer = new ResizeObserver(() => { const rect = canvas.getBoundingClientRect(); renderer.setSize(rect.width, rect.height, false); camera.aspect = rect.width / Math.max(1, rect.height); camera.updateProjectionMatrix(); }); observer.observe(canvas);
    const tick = (now: number) => {
      this.frame = requestAnimationFrame(tick); const dt = this.last ? Math.min(.05, (now - this.last) / 1000) : .016; this.last = now;
      const front = root.parentElement && !root.parentElement.nextElementSibling && !document.hidden;
      if (front) {
        if (this.walker.walking) { this.walker.update(dt * 2); this.position = [...this.walker.at]; if (!this.walker.walking && destination) { this.yaw = Math.atan2(this.position[0] - destination.x, this.position[1] - destination.z); this.pitch = -.06; destination = null; } }
        else if (this.keys.size) {
          const forward = Number(this.keys.has('KeyW') || this.keys.has('ArrowUp')) - Number(this.keys.has('KeyS') || this.keys.has('ArrowDown'));
          const side = Number(this.keys.has('KeyD') || this.keys.has('ArrowRight')) - Number(this.keys.has('KeyA') || this.keys.has('ArrowLeft'));
          const length = Math.hypot(forward, side) || 1, speed = (this.keys.has('ShiftLeft') ? 6 : 3.4) * dt;
          const dx = (side * Math.cos(this.yaw) - forward * Math.sin(this.yaw)) / length * speed, dz = (-forward * Math.cos(this.yaw) - side * Math.sin(this.yaw)) / length * speed;
          if (world.nav.walkable(this.position[0] + dx, this.position[1])) this.position[0] += dx;
          if (world.nav.walkable(this.position[0], this.position[1] + dz)) this.position[1] += dz;
        }
      } else this.keys.clear();
      if (overview) { camera.position.set(24, 30, 26); camera.lookAt(0, 0, 0); } else { camera.position.set(this.position[0], this.seated ? 1.12 : 1.7, this.position[1]); camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ'); }
      cleaner.update(front ? dt : 0, now / 1000); maintenance.update(front ? dt : 0, now / 1000); world.update(now / 1000, this.position[0], this.position[1]);
      const id = interact(), spot = world.spots.find(s => s.id === id);
      const key = `${id}|${this.walker.walking}|${this.seated}`;
      if (key !== hintKey) { hintKey = key; hint.replaceChildren(h('span', {}, this.walker.walking ? 'Walking around the furniture… press a movement key to take over.' : this.seated ? 'Seated · use a movement key to stand' : spot ? `E · ${spot.name}` : 'Take a stroll, or choose a destination below.'), ...(spot && !this.walker.walking ? [action('Use', () => use(spot.id))] : [])); }
      belongings.textContent = [this.carried, this.tray].filter(Boolean).join(' · ');
      if (front) renderer.render(world.scene, camera);
    };
    this.frame = requestAnimationFrame(tick);
    this.exit = () => modal.close();
    closeCleanup(modal, () => { cancelAnimationFrame(this.frame); observer.disconnect(); window.removeEventListener('keydown', down, true); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); cleaner.dispose(); maintenance.dispose(); world.dispose(); renderer.dispose(); this.world = null; this.exit = null; this.keys.clear(); this.last = 0; });
    void Promise.resolve(this.ready(world)).catch(error => toast((error as Error).message, 'error'));
  }
  sit() { this.seated = true; this.walker.stop(); }
  takeBook(title: string) { this.carried = `📖 ${title}`; this.position = [8, -3.4]; this.walker.stop(); this.sit(); this.yaw = -Math.PI / 2; this.pitch = -.02; }
  stop() { this.exit?.(); }
}

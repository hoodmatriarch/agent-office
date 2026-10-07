import type { Ctx } from '../../core/context';
import { hintTitle, key, onE } from '../../core/hint';
import { noOutline } from '../../core/outline';
import { BREAK } from '../../../shared/builtin-floors';
import type { installWalking } from '../walking';
import { h, toast, modalOpen } from '../../ui/dom';
import { store } from '../../state';
import { BreakRoom } from './room';
import { Studio } from './studio';
import { Library } from './library';
import { Organizer } from './organizer';
import { StorageRoom } from './storage-ui';
import { FoodService } from './service';
import { VendingMachine } from './vending';
import { RoutineStaff } from './staff';
import { panel, action } from './panels';
import type { Interactable } from '../../world/types';
import './ui.css';

declare module '../../world/types' {
  interface InteractKinds {
    facilitiesstaff: true;
    facility: true;
  }
}

export function installFacilities(ctx: Ctx, deps: { walking: Pick<ReturnType<typeof installWalking>, 'walkThen'> }) {
  const library = new Library(), organizer = new Organizer(), storage = new StorageRoom();
  let room: BreakRoom;
  const food = new FoodService(text => { room.tray = text; });
  const vending = new VendingMachine();
  const studio = new Studio(() => { if (room.world) { room.world.artCanvas.getContext('2d')!.drawImage(studio.canvas, 0, 0); room.world.artTexture.needsUpdate = true; } });
  room = new BreakRoom(ctx, deps.walking, async id => {
    if (id === 'service') return food.open();
    if (id === 'vending') return vending.open();
    if (id === 'volunteer') return food.volunteer();
    if (id === 'studio') return studio.open();
    if (id === 'library') return library.open(book => { room.takeBook(book.title, () => void library.read()); });
    if (id === 'couch') return food.eat(() => library.read());
    if (id === 'organizer') return organizer.open();
    if (id === 'records') { const p = panel('🗄️ Store room'); p.body.append(action('Employee files', () => storage.files()), action('Work documents, projects & accounting', () => organizer.open()), action('Office supplies', () => storage.inventory())); return; }
    if (id === 'supplies') return storage.inventory();
    if (id === 'locker') return storage.coatLocker();
    if (id === 'men' || id === 'women') {
      const p = panel(id === 'men' ? '🚹 Men’s bathroom' : '🚺 Women’s bathroom');
      p.body.append(h('p', {}, 'A private break-floor restroom with toilets, sinks, mirrors, soap, and paper supplies. June includes both bathrooms in her cleaning rounds.'), action('Wash hands', () => { toast('Hands washed. June approves.'); }), action('Flush toilet', () => { toast('Flushed. Leon’s plumbing survives another day.'); }), action('Check / restock bathroom supplies', () => storage.inventory()));
    }
  }, async () => { await Promise.all([studio.load(), food.data.load()]); food.updateTray(); });
  ctx.interactions.define('facility', { reach: 3, hint: it => ({ k: it.label ?? '', parts: [hintTitle(it.label ?? 'Break-floor station'), key('E', 'Use')] }), use: onE(it => room.use(it)) });
  const call = h('button.btn.fac-call', { type: 'button', 'aria-label': 'Find places on the break floor', hidden: true }, '🌿 Floor guide'); call.onclick = () => room.places(); document.body.append(call);
  const location = h('span.fac-belongings'); document.body.append(location);
  ctx.ticks.add('hud', () => { call.hidden = store.floor !== BREAK || modalOpen(); location.hidden = store.floor !== BREAK || modalOpen(); location.textContent = [room.carried,room.tray].filter(Boolean).join(' · '); });

  // Staff also keep doing their rounds on normal project floors. Their tools and routes are visual routines.
  const cleaner = new RoutineStaff('June · cleaning lady', [
    { name: 'Emptying the trash', at: [-5, 3] }, { name: 'Wiping tables', at: [5, -3] }, { name: 'Washing dishes', at: [-11, 10] }, { name: 'Mopping the floor', at: [0, 2] }, { name: 'Polishing the golf clubs', at: [14, 5] },
  ], () => ctx.world().nav, ctx.scene);
  const maintenance = new RoutineStaff('Leon · maintenance', [
    { name: 'Changing a light bulb', at: [1, -7] }, { name: 'Checking the wiring', at: [14, -7] }, { name: 'Repairing a desk', at: [-3, 0] }, { name: 'Checking the coffee machine', at: [-12, 9] },
  ], () => ctx.world().nav, ctx.scene, true);
  const staff = [cleaner, maintenance], usable: Interactable[] = staff.map(person => ({ kind: 'facilitiesstaff', label: person.name, x: person.walker.at[0], z: person.walker.at[1], radius: 1.8 }));
  staff.forEach((person, i) => { person.person.root.userData.interact = usable[i]; noOutline(person.person.root); });
  staff.forEach((person, i) => ctx.usables.add({ usable: () => ctx.inOffice() && !ctx.upTop() ? [usable[i]] : [], pickable: () => person.person.root }));
  ctx.interactions.define('facilitiesstaff', { reach: 3, hint: it => ({ k: it.label ?? '', parts: [hintTitle(it.label ?? 'Office staff'), key('E', 'Ask about my work')] }), use: onE(it => { const person = staff.find(s => s.name === it.label)!; const p = panel(person.name); p.body.append(h('p', {}, `Right now: ${person.current}.`), h('p', {}, 'I keep the office comfortable while the coding workers do their jobs. My rounds run locally and use no AI allowance.'), h('ul', {}, ...person.jobs.map(job => h('li', {}, job.name)))); }) });
  ctx.ticks.add('others', ({ dt, t }) => {
    for (let i = 0; i < staff.length; i++) {
      const active = ctx.inOffice() && !ctx.upTop() && !ctx.trip() && !!store.floor;
      staff[i].person.root.visible = active; usable[i].off = !active;
      if (!active) continue;
      staff[i].update(modalOpen() ? 0 : dt, t, Math.hypot(ctx.player.pos.x - staff[i].walker.at[0], ctx.player.pos.z - staff[i].walker.at[1]) < 1.8);
      usable[i].x = staff[i].walker.at[0]; usable[i].z = staff[i].walker.at[1];
    }
  });
  return { room, studio, library, organizer, storage, food };
}

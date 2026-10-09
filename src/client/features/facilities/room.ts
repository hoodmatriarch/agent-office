import { BREAK, builtinFloor } from '../../../shared/builtin-floors';
import { seatPlace } from '../../../shared/layout';
import type { Ctx } from '../../core/context';
import { floorTravel, floorWorlds } from '../../core/floor-worlds';
import type { installWalking } from '../walking';
import { store } from '../../state';
import { h, toast } from '../../ui/dom';
import { action, panel } from './panels';
import { BreakWorld, type Station } from './world';
import { nativeBreakWorld } from './native-world';
import type { World } from '../../world/world';
import type { Interactable } from '../../world/types';

/** Facility panels are tools on a normal floor; the floor itself never opens in a modal. */
export class BreakRoom {
  world: BreakWorld | null = null;
  private native: World | null = null;
  private stations = new Map<Interactable, Station>();
  carried = '';
  tray = '';
  constructor(private readonly ctx: Ctx, private readonly walking: Pick<ReturnType<typeof installWalking>, 'walkThen'>, private readonly visit: (id: Station) => void | Promise<void>, private readonly ready: () => void | Promise<void>) { floorWorlds.set(BREAK, () => this.build()); }
  private build() {
    if (this.native) return this.native;
    const world = this.world = new BreakWorld();
    const interactions = world.spots.map(spot => {
      const it: Interactable = { kind: 'facility', label: spot.name, x: spot.approach[0], z: spot.approach[1], radius: 2 };
      spot.object.userData.interact = it;
      // A clear eye-level control sits in front of furniture rather than behind the counter or desk.
      const control = world.box(spot.approach[0], 1.15, spot.approach[1] - .35, .65, .45, .12, '#537d70');
      control.userData.interact = it;
      const label = world.sign('E · Use', spot.approach[0], 1.5, spot.approach[1] - .35, .75); label.userData.interact = it;
      this.stations.set(it, spot.id); return it;
    });
    this.native = nativeBreakWorld(world, interactions);
    void Promise.resolve(this.ready()).catch(error => toast((error as Error).message, 'error'));
    return this.native;
  }
  open() { floorTravel.ride?.(BREAK); }
  use(it: Interactable) { const id = this.stations.get(it); if (id) { if (id === 'couch') this.sit(); void Promise.resolve(this.visit(id)).catch(error => toast((error as Error).message, 'error')); } }
  sit() {
    const seats = builtinFloor(BREAK)!.plan.seating, player = this.ctx.player;
    const taken = new Set([...store.peers.values()].filter(p => p.id !== store.you && p.floor === BREAK).map(p => p.seat));
    const places = seats.flatMap(seat => seat.places.map((_,i) => seatPlace(seat,i))).filter(p => !taken.has(p.key)).sort((a,b) => Math.hypot(a.x-player.pos.x,a.z-player.pos.z)-Math.hypot(b.x-player.pos.x,b.z-player.pos.z));
    const seat = places[0]; if (!seat) return toast('Every seat is occupied.');
    player.sit(seat); this.ctx.me.sit(seat.hips); this.ctx.net.send({t:'sit',seat:seat.key});
  }
  takeBook(title: string, read: () => void) { this.carried = `📖 ${title}`; this.walking.walkThen({ x: 11, z: -4.5 }, 'the window lounge', () => { this.sit(); read(); }, {x:11,z:-6}); }
  places() {
    if (store.floor !== BREAK || !this.world) return;
    const p = panel('🌿 Around the break floor');
    p.body.append(h('p', {}, 'Choose a place and walk there, or explore with the normal office controls. Press E to use a station. The elevator takes you to the office, rooftop bar, or garage.'));
    const grid = h('div.fac-grid');
    for (const spot of this.world.spots.filter((s,i,a) => a.findIndex(t => t.id===s.id)===i)) grid.append(action(spot.name, () => { p.modal.close(); this.walking.walkThen({x:spot.approach[0],z:spot.approach[1]},spot.name,()=>this.use([...this.stations.keys()].find(it=>this.stations.get(it)===spot.id)! ), {x:spot.x,z:spot.z}); }));
    grid.append(action('🛗 Elevator · choose a floor', () => { p.modal.close(); this.walking.walkThen({x:0,z:10},'the elevator',()=>floorTravel.elevator?.(),{x:0,z:12}); })); p.body.append(grid);
  }
  stop() { /* Travelling is handled by the building. */ }
}

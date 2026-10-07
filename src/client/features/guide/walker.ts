import type { NavGrid, Pt } from '../../../shared/nav';

/** A small walker using the same obstacle map as the office, without taking control of the player. */
export class GuideWalker {
  at: Pt = [7, -8];
  yaw = 0;
  private path: Pt[] = [];
  get walking(): boolean { return this.path.length > 0; }
  go(nav: Pick<NavGrid, 'route'>, to: Pt) { this.path = nav.route(this.at, to).slice(1); }
  stop() { this.path = []; }
  update(dt: number): boolean {
    let left = Math.max(0, Math.min(dt, 0.1)) * 1.4;
    const moving = this.walking;
    while (this.path.length && left > 0) {
      const next = this.path[0];
      const x = next[0] - this.at[0];
      const z = next[1] - this.at[1];
      const distance = Math.hypot(x, z);
      if (distance > 0.001) this.yaw = Math.atan2(x, z);
      if (distance <= left) { this.at = [...next]; this.path.shift(); left -= distance; }
      else { this.at = [this.at[0] + x / distance * left, this.at[1] + z / distance * left]; left = 0; }
    }
    return moving && !this.walking;
  }
}

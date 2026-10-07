import * as THREE from 'three';
import { Person } from '../../world/character';
import { mesh, toon } from '../../world/toon';
import type { NavGrid } from '../../../shared/nav';
import { GuideWalker } from '../guide/walker';
export interface Job { name: string; at: [number, number] }
export class RoutineStaff {
  readonly person: Person;
  readonly walker = new GuideWalker();
  private job = 0;
  private pause = 1;
  private tool = new THREE.Group();
  constructor(readonly name: string, readonly jobs: Job[], private readonly nav: () => NavGrid, scene: THREE.Scene, maintenance = false) {
    this.person = new Person(name, maintenance ? '#bd8848' : '#7d9fbd', { skin: maintenance ? 1 : 2, hair: maintenance ? 1 : 3, style: maintenance ? 1 : 3 });
    this.walker.at = nav().nearestWalkable(jobs[0].at);
    if (maintenance) { this.tool.add(mesh(new THREE.BoxGeometry(.4, .3, .2), toon('#9f6247'), .5, .55, 0)); this.tool.add(mesh(new THREE.TorusGeometry(.12, .025, 6, 12), toon('#333b3b'), .5, .76, 0)); }
    else { this.tool.add(mesh(new THREE.CylinderGeometry(.02, .02, 1.15, 8), toon('#b98a59'), .48, .55, .2)); this.tool.add(mesh(new THREE.BoxGeometry(.45, .07, .18), toon('#d8d2b8'), .48, .035, .2)); }
    this.person.root.add(this.tool); scene.add(this.person.root);
  }
  update(dt: number, time: number, near = false) {
    if (!near) {
      if (this.walker.walking) { if (this.walker.update(dt)) { this.pause = 12; this.person.setDoing(this.jobs[this.job].name); } }
      else if ((this.pause -= dt) <= 0) { this.job = (this.job + 1) % this.jobs.length; this.walker.go(this.nav(), this.jobs[this.job].at); this.person.setDoing(`On my way: ${this.jobs[this.job].name}`); }
    }
    const working = !this.walker.walking && !near;
    this.person.root.position.set(this.walker.at[0], 0, this.walker.at[1]); this.person.root.rotation.y = this.walker.yaw;
    this.person.pose = working ? 'type' : 'stand'; this.person.update(dt, time, this.walker.walking && !near, false);
    this.tool.position.z = working ? Math.sin(time * 3) * .18 : 0;
  }
  get current() { return this.jobs[this.job].name; }
  dispose() { this.person.root.traverse(object => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); const materials = Array.isArray(object.material) ? object.material : [object.material]; materials.forEach(material => material.dispose()); } if (object instanceof THREE.Sprite) { object.material.map?.dispose(); object.material.dispose(); } }); this.person.root.removeFromParent(); }
}
export const CLEANING: Job[] = [
  { name: 'Wiping dining tables', at: [1, 1] }, { name: 'Washing dishes', at: [-7, -4.5] }, { name: 'Emptying the bins', at: [-4, 5] },
  { name: 'Mopping the floor', at: [3, -1] }, { name: 'Cleaning and restocking the men’s bathroom', at: [-14.5, 9] }, { name: 'Cleaning and restocking the women’s bathroom', at: [-8, 9] },
];
export const MAINTENANCE: Job[] = [
  { name: 'Restocking the vending machine', at: [-3, .4] }, { name: 'Checking the lights', at: [0, -7] }, { name: 'Repairing a chair', at: [4, 6] }, { name: 'Checking the supply shelves', at: [-13, 3] },
];

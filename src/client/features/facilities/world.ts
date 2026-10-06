import * as THREE from 'three';
import { NavGrid, type Rect } from '../../../shared/nav';
import { mesh, roundedBox, textSprite, toon } from '../../world/toon';
import { Person } from '../../world/character';
import type { Collider } from '../../world/types';
export type Station = 'service' | 'volunteer' | 'library' | 'couch' | 'studio' | 'organizer' | 'records' | 'supplies' | 'locker' | 'vending' | 'men' | 'women' | 'exit';
export interface Spot { id: Station; name: string; x: number; z: number; approach: [number, number]; object: THREE.Object3D }

/** The shared break floor has its own furniture, doors, navigation and panorama, independent of projects. */
export class BreakWorld {
  readonly scene = new THREE.Scene();
  readonly spots: Spot[] = [];
  readonly obstacles: Rect[] = [];
  readonly colliders: Collider[] = [{ minX: -18, maxX: 18, minZ: -14, maxZ: 14, bottom: -.3, top: 0 }];
  readonly artCanvas = document.createElement('canvas');
  readonly artTexture: THREE.CanvasTexture;
  readonly barista = new Person('Mae · cashier & barista', '#4a8b79', { skin: 2, hair: 2, style: 3 });
  readonly chef = new Person('Gus · chef', '#eee4cf', { skin: 1, hair: 1, style: 1 });
  readonly nav: NavGrid;
  private doors: { hinge: THREE.Group; x: number; z: number }[] = [];
  constructor() {
    this.scene.background = new THREE.Color('#cfe8e7');
    this.scene.fog = new THREE.Fog('#cfe8e7', 45, 95);
    this.scene.add(new THREE.HemisphereLight('#fff6dc', '#869381', 1));
    const sun = new THREE.DirectionalLight('#fff4dc', 1.25); sun.position.set(15, 25, -10); this.scene.add(sun);
    const fill = new THREE.DirectionalLight('#d7efff', .4); fill.position.set(-12, 10, 12); this.scene.add(fill);
    this.box(0, -.16, 0, 36, .3, 28, '#d6bc96');
    for (let z = -14; z < 14; z += 1.2) this.box(0, .006, z, 36, .008, .018, '#baa180');
    this.box(-18, 1.6, 0, .2, 3.2, 28, '#e6e1d4', true);
    this.box(0, 1.6, -14, 36, 3.2, .2, '#e6e1d4', true);
    this.box(0, 1.6, 14, 36, 3.2, .2, '#e6e1d4', true);
    this.box(18, .4, 0, .2, .8, 28, '#e6e1d4', true);
    for (let z = -14; z <= 14; z += 4) this.box(18, 2.1, z, .18, 3, .1, '#5c776d');
    this.box(18, 3.2, 0, .2, .12, 28, '#5c776d');
    const glass = mesh(new THREE.BoxGeometry(.04, 2.4, 28), new THREE.MeshPhysicalMaterial({ color: '#c0e5e6', transparent: true, opacity: .13, roughness: .1 }), 18, 2, 0); this.scene.add(glass);
    // A quiet elevated view across trees and an original little city skyline.
    this.box(46, -5, 0, 50, .2, 150, '#8daf91');
    for (let i = 0; i < 23; i++) {
      const x = 25 + (i % 4) * 8, z = -43 + i * 4, height = 3 + (i % 6) * 1.7;
      this.box(x, height / 2 - 4, z, 3.4, height, 3.5, ['#8fa5ab', '#b8b4a6', '#91a899'][i % 3]);
      for (let y = 0; y < height - 1; y += 1.4) this.box(x - 1.72, y - 3, z, .02, .7, 2.2, '#efdbaa');
    }
    this.kitchen(); this.lounge(); this.rooms(); this.dining(); this.creative();
    this.nav = new NavGrid({ minX: -17.6, maxX: 17.6, minZ: -13.6, maxZ: 13.6 }, { rects: this.obstacles, circles: [] });
    this.artCanvas.width = 1200; this.artCanvas.height = 750;
    const g = this.artCanvas.getContext('2d')!; g.fillStyle = '#fffaf0'; g.fillRect(0, 0, 1200, 750); g.fillStyle = '#476657'; g.font = '50px sans-serif'; g.fillText('Your ideas belong here.', 220, 375);
    this.artTexture = new THREE.CanvasTexture(this.artCanvas); this.artTexture.colorSpace = THREE.SRGBColorSpace;
    const art = mesh(new THREE.PlaneGeometry(3.2, 2), new THREE.MeshBasicMaterial({ map: this.artTexture }), 12, 2, 13.4, false); art.rotation.y = Math.PI; this.scene.add(art);
    this.spot('studio', '🎨 Drawing desk · art stays here', 12, 11.3, [12, 9.5], art);
  }
  box(x: number, y: number, z: number, w: number, h: number, d: number, color: string, solid = false) {
    const object = mesh(roundedBox(w, h, d, Math.min(.06, w / 5, h / 5, d / 5)), toon(color), x, y, z); this.scene.add(object);
    if (solid) { this.obstacles.push([x - w / 2, x + w / 2, z - d / 2, z + d / 2]); this.colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, bottom: y - h / 2, top: y + h / 2 }); }
    return object;
  }
  sign(text: string, x: number, y: number, z: number, width = 3) {
    const label = textSprite(text, { size: 40, bg: '#fcfaf4', color: '#355348', border: '#b2c6b9' }); label.position.set(x, y, z); label.scale.multiplyScalar(Math.min(width, 2.9) / label.scale.x); this.scene.add(label); return label;
  }
  private spot(id: Station, name: string, x: number, z: number, approach: [number, number], object: THREE.Object3D) {
    const spot = { id, name, x, z, approach, object }; object.userData.station = id; this.spots.push(spot); this.sign(name, x, 2.8, z, Math.min(4.6, Math.max(2.5, name.length * .12)));
  }
  private plant(x: number, z: number) {
    this.scene.add(mesh(new THREE.CylinderGeometry(.3, .23, .55, 12), toon('#b27658'), x, .28, z));
    for (let i = 0; i < 5; i++) { const leaf = mesh(new THREE.SphereGeometry(.28, 10, 8), toon('#628b65'), x + Math.sin(i) * .2, .8 + i * .1, z + Math.cos(i) * .2); leaf.scale.set(.45, 1.8, .45); this.scene.add(leaf); }
  }
  private kitchen() {
    this.box(-9, .015, -10, 16, .03, 7, '#e4dfce');
    this.box(-10, .65, -6.2, 13, 1.3, 1.1, '#466d5e', true); this.box(-10, 1.34, -6.2, 13.4, .15, 1.25, '#f5ead3');
    this.box(-13, .7, -12.3, 8, 1.4, 1.5, '#bdc6bd', true);
    for (let i = 0; i < 3; i++) { this.box(-14 + i * 1.4, 1.43, -12.2, 1, .1, .9, '#2f3e42'); this.scene.add(mesh(new THREE.CylinderGeometry(.28, .28, .09, 16), toon('#b9b7ac'), -14 + i * 1.4, 1.55, -12.2)); }
    this.box(-7, 1.7, -12.5, 1.6, 3.4, 1.1, '#dee7df', true); this.box(-7, 1.7, -11.92, .07, .6, .05, '#596d67');
    this.box(-5, 1.6, -6.2, 1.1, .6, .7, '#283f3e'); this.box(-5, 1.91, -6.15, .8, .12, .6, '#d0b899');
    for (let x = -5.3; x < -4.7; x += .3) this.scene.add(mesh(new THREE.CylinderGeometry(.09, .07, .18, 12), toon('#ffefd0'), x, 1.5, -5.75));
    const cabinet = this.box(-10, 1.72, -6.1, 3.5, .7, .8, '#a2cbc0');
    this.box(-10, 1.76, -5.67, 3.2, .45, .03, '#d6e8e6');
    for (let i = 0; i < 6; i++) this.scene.add(mesh(new THREE.ConeGeometry(.16, .22, 3), toon('#e3c084'), -11.1 + i * .43, 1.65, -5.58));
    this.barista.root.position.set(-5, 0, -7.6); this.chef.root.position.set(-12, 0, -10.8); this.scene.add(this.barista.root, this.chef.root);
    this.chef.root.add(mesh(new THREE.CylinderGeometry(.24, .28, .4, 12), toon('#fffcf0'), 0, 1.95, 0));
    this.spot('service', '☕ Mae & Gus · order food', -8, -6.2, [-8, -4.6], cabinet);
    this.spot('volunteer', '🍳 Volunteer kitchen shifts', -14.5, -5.3, [-14.5, -3.5], this.box(-14.5, 1.4, -5.3, .7, 1.2, .3, '#dd9a6b'));
    this.box(-3, 1.05, -1.8, 1.4, 2.1, 1, '#497891', true); const vending = this.box(-3, 1.3, -1.26, .95, 1.1, .04, '#dbe8e9');
    for (let i = 0; i < 9; i++) this.box(-3.3 + i % 3 * .3, .9 + Math.floor(i / 3) * .3, -1.2, .16, .2, .12, ['#e2b95c', '#cb765c', '#7fa880'][i % 3]);
    this.spot('vending', '🥤 Vending machine', -3, -1.4, [-3, .3], vending);
  }
  private lounge() {
    this.box(11, .03, -4, 12, .035, 12, '#b9ccc3');
    for (const [x, z] of [[8, -5], [14, .6]]) {
      const sofa = this.box(x, .45, z, 3.8, .9, 1.1, '#688778', true); this.box(x, .95, z - .48, 3.8, .8, .28, '#688778');
      for (const side of [-1, 1]) this.box(x + side * 1.75, .85, z, .3, .8, 1.2, '#59776b');
      for (let i = 0; i < 3; i++) this.box(x - 1 + i, .92, z + .04, .85, .15, .9, '#86a493');
      this.spot('couch', '🛋️ Sit & read your book', x, z, [x, z + 1.5], sofa);
    }
    this.box(10, .45, -1, 3.5, .1, 1.8, '#bd8e65', true); for (const x of [8.7, 11.3]) this.box(x, .22, -1, .1, .45, 1.2, '#765847');
    this.box(13, 1.4, -12.5, 8, 2.8, .5, '#9c7955', true);
    for (let row = 0; row < 4; row++) { this.box(13, .32 + row * .62, -12.1, 8, .07, .85, '#bc9973'); for (let i = 0; i < 22; i++) this.box(9.5 + i * .32, .62 + row * .62, -12.1, .22, .5 + i % 3 * .025, .4, ['#527969', '#d19b79', '#dfbf75', '#728cad', '#a47372'][i % 5]); }
    this.spot('library', '📚 Upload & choose a real book', 13, -11.8, [13, -10.3], this.box(13, 1, -11.8, 1.8, .1, .6, '#dabe97'));
    this.plant(16.7, -9); this.plant(16.7, 3);
  }
  private partition(x: number, z: number, width: number, depth: number, title: string, id: Station) {
    this.box(x - width / 2, 1.4, z, .15, 2.8, depth, '#e1d9cb', true); this.box(x + width / 2, 1.4, z, .15, 2.8, depth, '#e1d9cb', true);
    this.box(x, 1.4, z + depth / 2, width, 2.8, .15, '#e1d9cb', true);
    for (const side of [-1, 1]) this.box(x + side * (width / 4 + .45), 1.4, z - depth / 2, width / 2 - .9, 2.8, .15, '#e1d9cb', true);
    const hinge = new THREE.Group(); hinge.position.set(x - .8, 0, z - depth / 2); const door = mesh(roundedBox(1.6, 2.5, .1), toon('#78998b'), .8, 1.25, 0); hinge.add(door); this.scene.add(hinge); this.doors.push({ hinge, x, z: z - depth / 2 });
    this.spot(id, title, x, z - depth / 2 - .2, [x, z - depth / 2 - 1.7], door);
  }
  private rooms() {
    for (const [x, id, title] of [[-14.5, 'men', '🚹 Men’s bathroom'], [-8, 'women', '🚺 Women’s bathroom']] as const) {
      this.partition(x, 10.6, 6, 6.3, title, id);
      this.box(x, .015, 10.5, 5.8, .03, 6, '#cfdbd3');
      for (const side of [-1, 1]) {
        const tx = x + side * 1.6; this.box(tx, .5, 12.5, .75, 1, .3, '#f5f3e9'); this.scene.add(mesh(new THREE.CylinderGeometry(.3, .24, .42, 20), toon('#f5f3e9'), tx, .35, 12));
        this.box(tx, .6, 12, .75, .09, .85, '#e6e4db'); this.box(tx, .8, 9.5, 1, .12, .65, '#f6f4e8'); this.box(tx, 1.6, 9.83, .9, 1.1, .03, '#b6cdd0'); this.box(tx + .4, 1, 9.5, .14, .2, .12, '#9db8a8');
      }
      this.box(x, 1.4, 13.5, .15, 2.8, 2.6, '#d2d6cb');
    }
    this.partition(-14.2, 2.6, 6.4, 6.2, '🗄️ Store room', 'records');
    for (let i = 0; i < 3; i++) { this.box(-16.4, .85, .5 + i * 1.5, 1.1, 1.7, 1.1, '#798a80', true); this.box(-16.4, .9, .5 + i * 1.5, .8, .08, 1.14, '#d8d9c4'); }
    const rack = this.box(-11.8, 1.25, 3.5, .5, 2.5, 3, '#a99070', true); for (let i = 0; i < 9; i++) this.box(-11.75, .4 + Math.floor(i / 3) * .7, 2.6 + i % 3 * .8, .7, .45, .6, ['#e7d5b8', '#dedfd1', '#eae8df'][i % 3]);
    this.spot('supplies', '📦 Supplies inventory', -11.8, 3, [-13, 3], rack);
    const lockers = this.box(-17.2, 1.15, -3.2, .9, 2.3, 4.2, '#6d8c87', true);
    for (let i = 0; i < 5; i++) { this.box(-16.72, 1.15, -4.8 + i * .8, .03, 2.1, .7, '#8aa59d'); this.box(-16.66, 1.2, -4.6 + i * .8, .08, .2, .06, '#e7d6a7'); }
    this.spot('locker', '🧥 Coat & personal lockers', -16.8, -3, [-15.2, -3], lockers);
  }
  private dining() {
    for (const [x, z] of [[-5, 3], [1.5, 3], [1.5, 8], [7, 6]]) {
      const table = this.box(x, .8, z, 2.6, .15, 1.7, '#b7865f', true); this.box(x, .4, z, .35, .8, .35, '#57665a');
      for (const side of [-1, 1]) for (const xx of [-.75, .75]) { this.box(x + xx, .43, z + side * 1.35, .7, .14, .65, '#d2a26e'); this.box(x + xx, .78, z + side * 1.6, .7, .7, .12, '#d2a26e'); }
      this.spot('couch', '🍽️ Sit, eat & take a break', x, z, [x, z - 1.8], table);
    }
    this.plant(5, 11.7);
  }
  private creative() {
    const board = this.box(16.4, 1.65, 10.5, .25, 2.5, 3.5, '#c2a16e', true);
    for (let i = 0; i < 6; i++) this.box(16.23, 1 + Math.floor(i / 3) * .8, 9.5 + i % 3 * .8, .03, .6, .65, ['#ddb6a0', '#a4c7b4', '#efd394'][i % 3]);
    this.spot('organizer', '🗂️ Documents & mood boards', 16, 10.5, [14.6, 10.5], board);
    this.box(12, .8, 11.6, 3.7, .15, 1.4, '#b7865f', true); this.box(12, .4, 11.6, .3, .8, .4, '#57665a');
  }
  update(t: number, x: number, z: number) {
    this.barista.pose = 'type'; this.chef.pose = 'type'; this.barista.update(.016, t, false, false); this.chef.update(.016, t, false, false);
    for (const door of this.doors) { const open = Math.hypot(x - door.x, z - door.z) < 2.7; door.hinge.rotation.y += ((open ? -1.25 : 0) - door.hinge.rotation.y) * .07; }
  }
  dispose() {
    this.scene.traverse(object => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); const materials = Array.isArray(object.material) ? object.material : [object.material]; for (const material of materials) material.dispose(); } if (object instanceof THREE.Sprite) { object.material.map?.dispose(); object.material.dispose(); } }); this.artTexture.dispose();
  }
}

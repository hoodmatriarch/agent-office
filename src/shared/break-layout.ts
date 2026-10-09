import type { SeatDef } from './layout.js';
/** North is -z. Coordinates follow the owner's revised 36 × 28 floor plan. */
export const BREAK_TABLES = [-1.3, 3.7].flatMap(z => [-15.1, -8.6, -2].map(x => ({ x, z })));
export const BREAK_SOFAS = [{ x: 11, z: -6, direction: 1 }, { x: 11, z: 0, direction: -1 }];
export const BREAK_SEATS: SeatDef[] = [
  ...BREAK_SOFAS.map((s, i) => ({ id: `break-couch-${i}`, label: '🛋️ Window lounge couch', x: s.x, y: 0, z: s.z, rotY: s.direction === 1 ? 0 : Math.PI, places: [-1, 0, 1], hips: .5, depth: .1, out: 1.5 })),
  ...BREAK_TABLES.flatMap((t, i) => [-1, 1].map(side => ({ id: `break-dining-${i}${side === 1 ? '-south' : ''}`, label: '🍽️ Dining chair', x: t.x, y: 0, z: t.z + side * 1.35, rotY: side === -1 ? 0 : Math.PI, places: [-.75, .75], hips: .43, depth: 0, out: -.9 }))),
];

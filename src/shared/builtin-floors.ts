import { OFFICE_PLAN, type MapPlan } from './maps/index.js';
import type { SeatDef } from './layout.js';
import { STUDY, STUDY_FLOOR } from './study-plan.js';
import { CREATIVE, CRAFT, CREATIVE_FLOOR, CRAFT_FLOOR } from './studio-plans.js';

export const BREAK = '@break';
const seating: SeatDef[] = [
  ...[[8, -5], [14, .6]].map(([x, z], i) => ({ id: `break-couch-${i}`, label: '🛋️ Window lounge couch', x, y: 0, z, rotY: 0, places: [-1, 0, 1], hips: .5, depth: .1, out: 1.5 })),
  ...[[-5, 3], [1.5, 3], [1.5, 8], [7, 6]].map(([x, z], i) => ({ id: `break-dining-${i}`, label: '🍽️ Dining chair', x, y: 0, z: z - 1.35, rotY: 0, places: [-.75, .75], hips: .43, depth: 0, out: -.9 })),
];
const plan: MapPlan = { ...OFFICE_PLAN, id: 'break-floor', name: 'Break floor', icon: '🌿', description: 'Food, books, creative tools and a place to take a break', style: 'castle', bounds: { minX: -18, maxX: 18, minZ: -14, maxZ: 14 }, height: 3.8, spawn: { x: 0, y: 0, z: 12.6, rotY: Math.PI }, desks: [], overflow: [], stations: [], meeting: [], byId: new Map(), seating, seatingById: new Map(seating.map(s => [s.id, s])), lineup: [], tables: [], agents: { outfit: 'none', ageMinutes: 0 } };
/** Shared facilities are real destinations, independent of the building's project checkouts and map. */
export const BUILTIN_FLOORS = new Map([[BREAK, { id: BREAK, name: 'Break floor', icon: '🌿', description: plan.description, plan }], [STUDY, STUDY_FLOOR]]);
export const builtinFloor = (id: string | null | undefined) => id ? BUILTIN_FLOORS.get(id) : undefined;
BUILTIN_FLOORS.set(CREATIVE,CREATIVE_FLOOR);
BUILTIN_FLOORS.set(CRAFT,CRAFT_FLOOR);

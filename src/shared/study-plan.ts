import { OFFICE_PLAN, type MapPlan } from './maps/index.js';
import type { SeatDef } from './layout.js';
export const STUDY = '@study';
export const STUDY_DESKS = [-11.3, -7.5, -3.7].flatMap((x, col) => [-4.8, -1.2, 2.4].map((z, row) => ({ x, z, id: `study-desk-${row}-${col}` })));
export const STUDY_READING_DESKS = [-5.9, -1.1].flatMap(z => [9, 14].map(x => ({ x, z }))).map((d, i) => ({ ...d, id: `study-library-${i}` }));
const seats: SeatDef[] = [
  ...STUDY_DESKS.map(d => ({ id: d.id, label: '📖 Study desk', x: d.x, y: 0, z: d.z + .9, rotY: Math.PI, places: [0], hips: .44, depth: 0, out: 1.1 })),
  ...STUDY_READING_DESKS.map(d => ({ id: d.id, label: '📚 Library reading seat', x: d.x, y: 0, z: d.z + 1.1, rotY: Math.PI, places: [0], hips: .44, depth: 0, out: 1.1 })),
];
export const STUDY_PLAN: MapPlan = { ...OFFICE_PLAN, id: 'study-hall', name: 'Classroom & study hall', icon: '🎓', description: 'Lessons, independent study, a subject library and homework', style: 'castle', bounds: { minX: -18, maxX: 18, minZ: -14, maxZ: 14 }, height: 3.8, spawn: { x: 0, y: 0, z: 12.6, rotY: Math.PI }, desks: [], overflow: [], stations: [], meeting: [], byId: new Map(), seating: seats, seatingById: new Map(seats.map(s => [s.id,s])), lineup: [], tables: [], agents: { outfit: 'none', ageMinutes: 0 } };
export const STUDY_FLOOR = { id: STUDY, name: STUDY_PLAN.name, icon: STUDY_PLAN.icon, description: STUDY_PLAN.description, plan: STUDY_PLAN };

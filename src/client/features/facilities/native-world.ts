import * as THREE from 'three';
import { BREAK, builtinFloor } from '../../../shared/builtin-floors';
import { ELEVATOR, FLOOR } from '../../../shared/layout';
import type { World } from '../../world/world';
import type { Interactable } from '../../world/types';
import { buildElevator } from '../../world/elevator';
import { NavGrid } from '../../../shared/nav';
import { BreakWorld } from './world';
import { RoutineStaff, CLEANING, MAINTENANCE } from './staff';

/** Uses the same scene, player, camera, collisions, interaction hints and presence as every other floor. */
export function nativeBreakWorld(building: BreakWorld, interactions: Interactable[]): World {
  const group = new THREE.Group(); group.add(building.scene);
  for (const light of [...building.scene.children]) if (light instanceof THREE.Light) building.scene.remove(light);
  building.box(0, 3.95, 0, 36, .18, 28, '#f0eee5', true);
  for (const x of [-12, -4, 4, 12]) for (const z of [-9, -1, 7]) building.box(x, 3.82, z, 2, .06, .65, '#fffaf0');
  const elevator = buildElevator(3.8), offset = 14 + FLOOR.minZ;
  elevator.group.rotation.y = Math.PI; elevator.group.position.set(ELEVATOR.x, 0, offset);
  for (const collider of elevator.colliders) {
    const { minX, maxX, minZ, maxZ } = collider;
    Object.assign(collider, { minX: ELEVATOR.x - maxX, maxX: ELEVATOR.x - minX, minZ: offset - maxZ, maxZ: offset - minZ });
  }
  Object.assign(elevator.interactable, { x: 0, z: 10.8 }); elevator.group.userData.interact = elevator.interactable;
  elevator.setSign('🌿 Break floor'); group.add(elevator.group);
  // The ceiling and sliding doorway aren't permanent obstacles for routes along the floor.
  const nav = new NavGrid({ minX: -17.6, maxX: 17.6, minZ: -13.6, maxZ: 13.6 }, { rects: [...building.obstacles.slice(0,-1), ...elevator.colliders.slice(0,-1).map(c => [c.minX,c.maxX,c.minZ,c.maxZ] as [number,number,number,number])], circles: [] });
  const cleaner = new RoutineStaff('June · cleaning lady', CLEANING, () => nav, building.scene);
  const maintenance = new RoutineStaff('Leon · maintenance', MAINTENANCE, () => nav, building.scene, true);
  const boards = Object.fromEntries(['issues','pulls','queue','services'].map(key => [key, new THREE.Mesh()]));
  return {
    plan: builtinFloor(BREAK)!.plan, group, elevator, colliders: [...building.colliders, ...elevator.colliders], interactables: [elevator.interactable, ...interactions], pickables: [group], desks: new Map(), boardMeshes: boards as World['boardMeshes'], nav,
    ways: { home: () => ({ way: [], chute: false }), in: () => [] }, rain: [], device: 'laptop', room: { wall: .15, enclosed: true }, acoustics: { gong: null, windows: [{ x: 18, y: 1.6, z: -5 }] },
    setBeanbags: () => [], setLook: () => {}, setProjectName: () => {},
    update(t, dt, people) { const at = [...people][0] ?? {x:0,z:10}; building.update(t, at.x, at.z); elevator.update(dt); cleaner.update(dt,t); maintenance.update(dt,t); },
    mood({sun,hemi,ambient}) { sun.intensity = 1.25; hemi.intensity = 1; ambient.intensity = .4; },
    dispose() { cleaner.dispose(); maintenance.dispose(); building.dispose(); },
  };
}

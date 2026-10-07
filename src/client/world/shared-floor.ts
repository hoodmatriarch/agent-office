import * as THREE from 'three';
import { ELEVATOR, FLOOR } from '../../shared/layout';
import type { MapPlan } from '../../shared/maps';
import { NavGrid } from '../../shared/nav';
import { buildElevator } from './elevator';
import type { Collider, Interactable } from './types';
import type { World } from './world';
/** Common native-floor shell: features supply geometry and tools through the world registry. */
export function sharedFloor(plan: MapPlan, group: THREE.Group, colliders: Collider[], interactables: Interactable[], update: World['update']): World {
  const elevator = buildElevator(plan.height), offset = 14 + FLOOR.minZ;
  elevator.group.rotation.y = Math.PI; elevator.group.position.set(ELEVATOR.x, 0, offset);
  for (const c of elevator.colliders) {
    const {minX,maxX,minZ,maxZ} = c;
    Object.assign(c, { minX: ELEVATOR.x-maxX, maxX: ELEVATOR.x-minX, minZ: offset-maxZ, maxZ: offset-minZ });
  }
  Object.assign(elevator.interactable, {x:0,z:10.8}); elevator.group.userData.interact = elevator.interactable;
  elevator.setSign(`${plan.icon} ${plan.name}`); group.add(elevator.group);
  const rects = [...colliders.filter(c => c.top > .2 && (c.bottom ?? 0) < 1.7), ...elevator.colliders.slice(0,-1)].map(c => [c.minX,c.maxX,c.minZ,c.maxZ] as [number,number,number,number]);
  const nav = new NavGrid({ minX:-17.6,maxX:17.6,minZ:-13.6,maxZ:13.6 }, {rects,circles:[]});
  return {
    plan, group, elevator, colliders:[...colliders,...elevator.colliders], interactables:[elevator.interactable,...interactables], pickables:[group], desks:new Map(), nav,
    boardMeshes:Object.fromEntries(['issues','pulls','queue','services'].map(k=>[k,new THREE.Mesh()])) as World['boardMeshes'],
    ways:{home:()=>({way:[],chute:false}),in:()=>[]}, rain:[], device:'laptop', room:{wall:.15,enclosed:true}, acoustics:{gong:null,windows:[{x:18,y:1.6,z:-5}]},
    setBeanbags:()=>[],setLook:()=>{},setProjectName:()=>{},
    update(t,dt,people) { elevator.update(dt); update?.(t,dt,people); },
    mood({sun,hemi,ambient}) {sun.intensity=1.25;hemi.intensity=1;ambient.intensity=.4;},
  };
}

import { LOFT } from '../../../shared/layout';

export const BOSS_LEVEL = 0.8;
export const WORK_LEVEL = 0.45;

/** Use the player's room, including height, rather than the orbit camera's location. */
export function inBossRoom(at: { x: number; y: number; z: number }): boolean {
  return at.x >= LOFT.minX && at.x <= LOFT.maxX && at.z >= LOFT.minZ && at.z <= LOFT.maxZ && at.y >= LOFT.y - 0.15 && at.y < LOFT.y + LOFT.height;
}

export function roomLevel(at: { x: number; y: number; z: number }, boss = BOSS_LEVEL, work = WORK_LEVEL): number {
  return inBossRoom(at) ? boss : work;
}

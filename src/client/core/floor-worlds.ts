import type { World } from '../world/world';
/** Features register the native worlds for shared floors here, beside the project's map builders. */
export const floorWorlds = new Map<string, () => World>();
export const floorTravel: { ride?: (id: string) => void; elevator?: () => void } = {};

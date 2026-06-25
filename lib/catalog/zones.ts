import type { BackZone, PatchZone } from './types';
export const BACK_ZONE: BackZone = 'back_center';
// Priority = fill order (front first, then sleeves alternating L/R for balance).
export const PATCH_ZONE_PRIORITY: PatchZone[] = [
  'front_chest', 'back_upper',
  'left_sleeve_1', 'right_sleeve_1',
  'left_sleeve_2', 'right_sleeve_2',
  'left_sleeve_3', 'right_sleeve_3',
  'left_sleeve_4', 'right_sleeve_4',
];
// 9-zone orientation = drop the 4th sleeve position each side.
export const ZONES_9: PatchZone[] = PATCH_ZONE_PRIORITY.filter(
  z => z !== 'left_sleeve_4' && z !== 'right_sleeve_4',
);
export const ZONE_DEFAULTS: Record<PatchZone, { scale: number; rotationDeg: number }> = {
  front_chest:    { scale: 0.55, rotationDeg: 0 },
  back_upper:     { scale: 0.45, rotationDeg: 0 },
  left_sleeve_1:  { scale: 0.40, rotationDeg: 0 },
  left_sleeve_2:  { scale: 0.40, rotationDeg: 0 },
  left_sleeve_3:  { scale: 0.40, rotationDeg: 0 },
  left_sleeve_4:  { scale: 0.40, rotationDeg: 0 },
  right_sleeve_1: { scale: 0.40, rotationDeg: 0 },
  right_sleeve_2: { scale: 0.40, rotationDeg: 0 },
  right_sleeve_3: { scale: 0.40, rotationDeg: 0 },
  right_sleeve_4: { scale: 0.40, rotationDeg: 0 },
};

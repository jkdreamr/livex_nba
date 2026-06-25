import type { DesignSpec } from '@/lib/catalog/types';
import { PATCH_ZONE_PRIORITY, ZONE_DEFAULTS } from '@/lib/catalog/zones';

export function assignZones(orderedIds: string[], budget: number): DesignSpec['patches'] {
  const count = Math.max(0, Math.min(budget, orderedIds.length, PATCH_ZONE_PRIORITY.length));
  const patches: DesignSpec['patches'] = [];
  for (let i = 0; i < count; i++) {
    const zone = PATCH_ZONE_PRIORITY[i]!;
    const d = ZONE_DEFAULTS[zone];
    patches.push({ id: orderedIds[i]!, zone, scale: d.scale, rotationDeg: d.rotationDeg });
  }
  return patches;
}

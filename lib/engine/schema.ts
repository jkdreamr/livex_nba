import { z } from 'zod';
import type { DesignSpec, Density } from '@/lib/catalog/types';
import { PATCH_ZONE_PRIORITY } from '@/lib/catalog/zones';
import { backById, placementById } from '@/lib/catalog';
import { isHarmonious } from './harmony';

export const DENSITY_MAX: Record<Density, number> = { minimal: 1, balanced: 4, maximal: 10 };
const patchZoneEnum = z.enum(PATCH_ZONE_PRIORITY as [string, ...string[]]);

export const designSpecSchema = z.object({
  hoodieColor: z.enum(['bone', 'black', 'grey']),
  backGraphic: z.object({ id: z.string().min(1), zone: z.literal('back_center') }),
  patches: z.array(z.object({
    id: z.string().min(1),
    zone: patchZoneEnum,
    scale: z.number().min(0.05).max(1.5),
    rotationDeg: z.number().min(-180).max(180),
  })),
  densityTier: z.enum(['minimal', 'balanced', 'maximal']),
  rationale: z.string().min(1),
  meta: z.object({
    favoriteTeamsRanked: z.array(z.string()),
    vibe: z.string(),
    audience: z.enum(['adult', 'kid']).optional(),
    size: z.string().optional(),
    schemaVersion: z.literal('1.0'),
  }),
});

export function checkInvariants(spec: DesignSpec): string[] {
  const errors: string[] = [];
  if (spec.backGraphic.zone !== 'back_center') errors.push('backGraphic.zone must be back_center');
  if (!backById(spec.backGraphic.id)) errors.push(`backGraphic.id not in catalog: ${spec.backGraphic.id}`);

  const seen = new Set<string>();
  for (const p of spec.patches) {
    const g = placementById(p.id);
    if (!g) errors.push(`patch.id not in catalog: ${p.id}`);
    if (!(PATCH_ZONE_PRIORITY as string[]).includes(p.zone)) errors.push(`invalid patch zone: ${p.zone}`);
    if (seen.has(p.zone)) errors.push(`duplicate patch zone: ${p.zone}`);
    seen.add(p.zone);
    if (g && !isHarmonious(spec.hoodieColor, g.dominantColors)) {
      errors.push(`low-contrast patch ${p.id} on ${spec.hoodieColor}`);
    }
  }
  const cap = DENSITY_MAX[spec.densityTier];
  if (spec.patches.length > cap) errors.push(`patch count ${spec.patches.length} exceeds cap ${cap}`);
  return errors;
}

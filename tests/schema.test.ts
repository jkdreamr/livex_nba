import { describe, it, expect } from 'vitest';
import { designSpecSchema, checkInvariants } from '@/lib/engine/schema';
import type { DesignSpec } from '@/lib/catalog/types';

const valid: DesignSpec = {
  hoodieColor: 'black',
  backGraphic: { id: 'back_07_celtics', zone: 'back_center' },
  patches: [{ id: 'plc_40_flamingo', zone: 'front_chest', scale: 0.55, rotationDeg: 0 }],
  densityTier: 'minimal',
  rationale: 'ok',
  meta: { favoriteTeamsRanked: ['celtics'], vibe: 'vegas', schemaVersion: '1.0' },
};

describe('schema + invariants', () => {
  it('accepts a valid spec', () => {
    expect(designSpecSchema.safeParse(valid).success).toBe(true);
    expect(checkInvariants(valid)).toEqual([]);
  });
  it('rejects unknown back graphic id', () => {
    const s = { ...valid, backGraphic: { id: 'back_99_nope', zone: 'back_center' as const } };
    expect(checkInvariants(s)).toContain('backGraphic.id not in catalog: back_99_nope');
  });
  it('rejects a patch in back_center via schema enum', () => {
    const bad = { ...valid, patches: [{ id: 'plc_40_flamingo', zone: 'back_center', scale: 0.5, rotationDeg: 0 }] };
    expect(designSpecSchema.safeParse(bad).success).toBe(false);
  });
  it('rejects duplicate patch zones', () => {
    const s: DesignSpec = { ...valid, densityTier: 'balanced', patches: [
      { id: 'plc_40_flamingo', zone: 'front_chest', scale: 0.5, rotationDeg: 0 },
      { id: 'plc_05_basketball', zone: 'front_chest', scale: 0.5, rotationDeg: 0 },
    ]};
    expect(checkInvariants(s)).toContain('duplicate patch zone: front_chest');
  });
  it('rejects exceeding density cap', () => {
    const s: DesignSpec = { ...valid, densityTier: 'minimal', patches: [
      { id: 'plc_40_flamingo', zone: 'front_chest', scale: 0.5, rotationDeg: 0 },
      { id: 'plc_05_basketball', zone: 'back_upper', scale: 0.5, rotationDeg: 0 },
    ]};
    expect(checkInvariants(s).some(e => e.startsWith('patch count'))).toBe(true);
  });
  it('rejects a low-contrast patch (eclipse on black)', () => {
    const s: DesignSpec = { ...valid, patches: [
      { id: 'plc_90_eclipse', zone: 'front_chest', scale: 0.5, rotationDeg: 0 },
    ]};
    expect(checkInvariants(s).some(e => e.startsWith('low-contrast patch'))).toBe(true);
  });
});

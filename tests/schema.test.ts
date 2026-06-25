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
  it('rejects a low-contrast patch (yellow star on white)', () => {
    const s: DesignSpec = {
      ...valid, hoodieColor: 'white',
      backGraphic: { id: 'back_01_las-vegas-summer-league', zone: 'back_center' },
      patches: [{ id: 'plc_25_star-yellow', zone: 'front_chest', scale: 0.5, rotationDeg: 0 }],
    };
    expect(checkInvariants(s).some(e => e.startsWith('low-contrast patch'))).toBe(true);
  });
  it('checkInvariants flags a patch placed in back_center (runtime guard)', () => {
    const s = { ...valid, patches: [
      { id: 'plc_40_flamingo', zone: 'back_center', scale: 0.5, rotationDeg: 0 },
    ] } as unknown as DesignSpec;
    expect(checkInvariants(s)).toContain('invalid patch zone: back_center');
  });
  it('schema rejects out-of-range scale and rotationDeg', () => {
    expect(designSpecSchema.safeParse({ ...valid, patches: [{ id: 'plc_40_flamingo', zone: 'front_chest', scale: 2.0, rotationDeg: 0 }] }).success).toBe(false);
    expect(designSpecSchema.safeParse({ ...valid, patches: [{ id: 'plc_40_flamingo', zone: 'front_chest', scale: 0.5, rotationDeg: 270 }] }).success).toBe(false);
  });
  it('schema rejects a wrong schemaVersion', () => {
    expect(designSpecSchema.safeParse({ ...valid, meta: { ...valid.meta, schemaVersion: '2.0' } }).success).toBe(false);
  });
});

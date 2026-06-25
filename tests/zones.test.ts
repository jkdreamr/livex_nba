import { describe, it, expect } from 'vitest';
import { assignZones } from '@/lib/engine/zones';
import { PATCH_ZONE_PRIORITY } from '@/lib/catalog/zones';

describe('assignZones', () => {
  it('assigns ids to priority zones up to budget', () => {
    const out = assignZones(['a', 'b', 'c'], 2);
    expect(out).toHaveLength(2);
    expect(out.map(p => p.zone)).toEqual(['front_chest', 'back_upper']);
    expect(out[0]).toMatchObject({ id: 'a', scale: 0.55, rotationDeg: 0 });
  });
  it('never exceeds 10 zones even with a huge budget', () => {
    const ids = Array.from({ length: 20 }, (_, i) => `g${i}`);
    const out = assignZones(ids, 99);
    expect(out).toHaveLength(10);
    expect(new Set(out.map(p => p.zone)).size).toBe(10);
    expect(out.map(p => p.zone)).toEqual(PATCH_ZONE_PRIORITY);
  });
  it('budget 0 yields no patches', () => {
    expect(assignZones(['a'], 0)).toEqual([]);
  });
});

import { describe, it, expect } from 'vitest';
import { HOODIE_COLORS, FABRIC_HEX } from '@/lib/catalog/hoodie-colors';
import { BACK_ZONE, PATCH_ZONE_PRIORITY, ZONES_9, ZONE_DEFAULTS } from '@/lib/catalog/zones';
import { BACK_GRAPHIC_CATALOG, PLACEMENT_GRAPHIC_CATALOG } from '@/lib/catalog';
import { teamBackGraphic, teamPatch, placementByMood } from '@/lib/catalog';

const HEX = /^#[0-9A-Fa-f]{6}$/;

describe('catalog', () => {
  it('has 3 hoodie colors, each with a fabric hex', () => {
    expect(HOODIE_COLORS.map(c => c.id).sort()).toEqual(['black','bone','grey']);
    for (const c of HOODIE_COLORS) expect(FABRIC_HEX[c.id]).toMatch(HEX);
  });
  it('back zone is back_center; 10 patch zones; 9-zone is the 8-zone subset', () => {
    expect(BACK_ZONE).toBe('back_center');
    expect(PATCH_ZONE_PRIORITY).toHaveLength(10);
    expect(PATCH_ZONE_PRIORITY).not.toContain('back_center');
    expect(new Set(PATCH_ZONE_PRIORITY).size).toBe(10);
    expect(ZONES_9).toHaveLength(8);
    expect(ZONES_9.every(z => PATCH_ZONE_PRIORITY.includes(z))).toBe(true);
    for (const z of PATCH_ZONE_PRIORITY) expect(ZONE_DEFAULTS[z]).toBeTruthy();
  });
  it('every graphic has id/label/category/mood/dominantColors; ids unique within catalog', () => {
    for (const g of [...BACK_GRAPHIC_CATALOG, ...PLACEMENT_GRAPHIC_CATALOG]) {
      expect(g.id).toMatch(/^\w/);
      expect(g.label.length).toBeGreaterThan(0);
      expect(g.mood.length).toBeGreaterThan(0);
      expect(g.dominantColors.length).toBeGreaterThan(0);
      for (const c of g.dominantColors) expect(c).toMatch(HEX);
    }
    const backIds = BACK_GRAPHIC_CATALOG.map(g => g.id);
    const plcIds = PLACEMENT_GRAPHIC_CATALOG.map(g => g.id);
    expect(new Set(backIds).size).toBe(backIds.length);
    expect(new Set(plcIds).size).toBe(plcIds.length);
  });
  it('team lookups resolve a seeded team in both catalogs', () => {
    expect(teamBackGraphic('celtics')?.team).toBe('celtics');
    expect(teamPatch('celtics')?.team).toBe('celtics');
    expect(placementByMood('vegas').length).toBeGreaterThan(0);
  });
});

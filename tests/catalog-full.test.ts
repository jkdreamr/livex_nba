/**
 * Catalog integrity tests — asserts the real facts of catalog.json
 * so any future pipeline re-run that breaks a constraint is caught immediately.
 */
import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BACK_GRAPHIC_CATALOG, PLACEMENT_GRAPHIC_CATALOG } from '@/lib/catalog';

const PUBLIC_DIR = join(fileURLToPath(new URL('../', import.meta.url)), 'public');

/**
 * The 30 official NBA franchise slugs that must each appear exactly once
 * as a `team`-tagged placement graphic.
 */
const ALL_30_FRANCHISE_SLUGS = [
  'bucks', 'bulls', 'cavaliers', 'celtics', 'clippers',
  'grizzlies', 'hawks', 'heat', 'hornets', 'jazz',
  'kings', 'knicks', 'lakers', 'magic', 'mavericks',
  'nets', 'nuggets', 'pacers', 'pelicans', 'pistons',
  'raptors', 'rockets', 'sixers', 'spurs', 'suns',
  'thunder', 'timberwolves', 'trail-blazers', 'warriors', 'wizards',
] as const;

/**
 * 29 back-graphic team slugs — all 30 franchises EXCEPT 'bulls'
 * (Chicago Bulls is intentionally absent from the back catalog per the source PDF).
 */
const BACK_29_TEAM_SLUGS = ALL_30_FRANCHISE_SLUGS.filter(s => s !== 'bulls');

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

describe('catalog-full integrity', () => {
  it('has exactly 33 back graphics and 94 placement graphics', () => {
    expect(BACK_GRAPHIC_CATALOG).toHaveLength(33);
    expect(PLACEMENT_GRAPHIC_CATALOG).toHaveLength(94);
  });

  it('all 127 ids are unique across both catalogs', () => {
    const allIds = [
      ...BACK_GRAPHIC_CATALOG.map(g => g.id),
      ...PLACEMENT_GRAPHIC_CATALOG.map(g => g.id),
    ];
    expect(new Set(allIds).size).toBe(127);
  });

  it('every entry has a non-empty file starting with /logos/', () => {
    for (const g of [...BACK_GRAPHIC_CATALOG, ...PLACEMENT_GRAPHIC_CATALOG]) {
      expect(g.file, `${g.id}: file must be non-empty`).toBeTruthy();
      expect(g.file, `${g.id}: file must start with /logos/`).toMatch(/^\/logos\//);
    }
  });

  it('every file exists on disk under public/', () => {
    for (const g of [...BACK_GRAPHIC_CATALOG, ...PLACEMENT_GRAPHIC_CATALOG]) {
      const abs = join(PUBLIC_DIR, g.file);
      expect(existsSync(abs), `Missing file on disk: public${g.file} (id=${g.id})`).toBe(true);
    }
  });

  it('every entry has a non-empty label', () => {
    for (const g of [...BACK_GRAPHIC_CATALOG, ...PLACEMENT_GRAPHIC_CATALOG]) {
      expect(g.label.trim().length, `${g.id}: label must be non-empty`).toBeGreaterThan(0);
    }
  });

  it('every entry has at least 1 mood', () => {
    for (const g of [...BACK_GRAPHIC_CATALOG, ...PLACEMENT_GRAPHIC_CATALOG]) {
      expect(g.mood.length, `${g.id}: must have ≥1 mood`).toBeGreaterThanOrEqual(1);
    }
  });

  it('every dominantColors entry is a valid 6-digit hex', () => {
    for (const g of [...BACK_GRAPHIC_CATALOG, ...PLACEMENT_GRAPHIC_CATALOG]) {
      expect(g.dominantColors.length, `${g.id}: must have ≥1 dominantColor`).toBeGreaterThanOrEqual(1);
      for (const c of g.dominantColors) {
        expect(c, `${g.id}: bad color ${c}`).toMatch(HEX_RE);
      }
    }
  });

  it('placement contains exactly one entry per franchise slug (team set exactly once each)', () => {
    const teamMap = new Map<string, number>();
    for (const g of PLACEMENT_GRAPHIC_CATALOG) {
      if (g.team != null) {
        teamMap.set(g.team, (teamMap.get(g.team) ?? 0) + 1);
      }
    }
    for (const slug of ALL_30_FRANCHISE_SLUGS) {
      expect(teamMap.get(slug), `placement missing franchise: ${slug}`).toBe(1);
    }
    // No extra unknown team slugs beyond the 30 franchises
    expect(teamMap.size).toBe(30);
  });

  it('back contains exactly 29 team slugs (every franchise except bulls)', () => {
    const backTeams = BACK_GRAPHIC_CATALOG
      .filter(g => g.team != null)
      .map(g => g.team as string);
    const backTeamSet = new Set(backTeams);

    expect(backTeamSet.size).toBe(29);
    for (const slug of BACK_29_TEAM_SLUGS) {
      expect(backTeamSet.has(slug), `back missing team: ${slug}`).toBe(true);
    }
    // Bulls intentionally absent from back catalog (Chicago Bulls — per source PDF)
    expect(backTeamSet.has('bulls'), 'bulls must NOT appear in back catalog').toBe(false);
  });
});

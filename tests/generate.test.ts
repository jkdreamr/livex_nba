import { describe, it, expect } from 'vitest';
import { generate } from '@/lib/engine/generate';
import { designSpecSchema, checkInvariants } from '@/lib/engine/schema';
import type { QuestionnaireAnswers } from '@/lib/catalog/types';

const cases: QuestionnaireAnswers[] = [
  { hoodieColor: 'black', teamsRanked: ['celtics','mavericks'], density: 'maximal', vibe: 'vegas', mustHaveIds: ['plc_40_flamingo'] },
  { hoodieColor: 'bone',  teamsRanked: [], density: 'minimal', vibe: 'classic' },
  { hoodieColor: 'bone', teamsRanked: ['warriors'], density: 'balanced', vibe: 'playful' },
  { hoodieColor: 'grey',  teamsRanked: ['mavericks'], density: 'maximal', vibe: 'streetwear' },
];

describe('generate', () => {
  it('always returns a schema-valid, invariant-clean spec', () => {
    for (const a of cases) {
      const spec = generate(a);
      expect(designSpecSchema.safeParse(spec).success).toBe(true);
      expect(checkInvariants(spec)).toEqual([]);
    }
  });
  it('is deterministic', () => {
    expect(generate(cases[0]!)).toEqual(generate(cases[0]!));
  });
  it('puts #1 team on the back and respects density cap', () => {
    const spec = generate(cases[0]!);
    expect(spec.backGraphic).toEqual({ id: 'back_07_celtics', zone: 'back_center' });
    expect(spec.patches.length).toBeLessThanOrEqual(10);
    expect(new Set(spec.patches.map(p => p.zone)).size).toBe(spec.patches.length);
  });
  it('no-team minimal uses a Summer League back + ≤1 patch', () => {
    const spec = generate(cases[1]!);
    expect(spec.backGraphic.id).toBe('back_01_las-vegas-summer-league');
    expect(spec.patches.length).toBeLessThanOrEqual(1);
  });
  it('places multiple must-haves in priority zones, in the fan’s order', () => {
    const spec = generate({
      hoodieColor: 'black', teamsRanked: ['celtics'], density: 'balanced', vibe: 'vegas',
      mustHaveIds: ['plc_40_flamingo', 'plc_38_poker-chips'],
    });
    const byZone = Object.fromEntries(spec.patches.map((p) => [p.zone, p.id]));
    expect(byZone['front_chest']).toBe('plc_40_flamingo');  // #1 pick goes to chest
    expect(byZone['back_upper']).toBe('plc_38_poker-chips'); // #2 pick goes to next zone
  });
  it('honours the density cap even when more must-haves are picked', () => {
    const spec = generate({
      hoodieColor: 'black', teamsRanked: [], density: 'minimal', vibe: 'vegas',
      mustHaveIds: ['plc_40_flamingo', 'plc_38_poker-chips', 'plc_30_palm-tree'],
    });
    expect(spec.patches.length).toBe(1);                    // minimal = 1 patch
    expect(spec.patches[0]!.id).toBe('plc_40_flamingo');    // the top-priority must-have wins
  });
  it('maximal fills up to all ten zones', () => {
    const spec = generate({
      hoodieColor: 'black', teamsRanked: ['celtics'], density: 'maximal', vibe: 'vegas',
    });
    expect(spec.patches.length).toBe(10);
    expect(new Set(spec.patches.map((p) => p.zone)).size).toBe(10);
  });
  it('carries audience + size onto meta (adult is the default)', () => {
    const kid = generate({ hoodieColor: 'black', teamsRanked: ['celtics'], density: 'balanced', vibe: 'classic', audience: 'kid', size: 'L' });
    expect(kid.meta.audience).toBe('kid');
    expect(kid.meta.size).toBe('L');
    expect(generate(cases[1]!).meta.audience).toBe('adult'); // defaulted when omitted
  });
  it('a kid design never includes an adult-themed patch — even if pinned', () => {
    const adultIds = ['plc_01_martini', 'plc_04_what-happens-in-vegas', 'plc_10_cherries', 'plc_38_poker-chips'];
    const spec = generate({
      hoodieColor: 'black', teamsRanked: ['celtics'], density: 'maximal', vibe: 'vegas',
      audience: 'kid', mustHaveIds: adultIds,
    });
    const found = spec.patches.map((p) => p.id);
    for (const id of adultIds) expect(found).not.toContain(id);
  });
});

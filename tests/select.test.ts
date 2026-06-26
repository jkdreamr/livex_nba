import { describe, it, expect } from 'vitest';
import { resolveBack, densityBudget, buildCandidates } from '@/lib/engine/select';
import { placementById, teamPatch } from '@/lib/catalog';
import { isHarmonious } from '@/lib/engine/harmony';
import type { QuestionnaireAnswers } from '@/lib/catalog/types';

const base: QuestionnaireAnswers = { hoodieColor: 'black', teamsRanked: [], density: 'balanced', vibe: 'vegas' };

describe('select', () => {
  it('resolveBack uses #1 team when present', () => {
    expect(resolveBack({ ...base, teamsRanked: ['celtics', 'mavericks'] })).toBe('back_07_celtics');
  });
  it('resolveBack falls back to a Summer League back graphic with no team', () => {
    expect(resolveBack(base)).toBe('back_01_las-vegas-summer-league');
  });
  it('resolveBack places a league/event "rep" option directly (slug is a back id)', () => {
    expect(resolveBack({ ...base, teamsRanked: ['back_02_summer-league'] })).toBe('back_02_summer-league');
    expect(resolveBack({ ...base, teamsRanked: ['back_03_nba'] })).toBe('back_03_nba');
  });
  it('a league pick at #1 still uses a franchise at #2 for patches', () => {
    const answers = { ...base, teamsRanked: ['back_02_summer-league', 'lakers'] };
    expect(resolveBack(answers)).toBe('back_02_summer-league');           // back graphic = the league option
    expect(buildCandidates(answers)).toContain(teamPatch('lakers')!.id);  // #2 franchise still patched
  });
  it('densityBudget maps tiers to caps (1/4/10)', () => {
    expect(densityBudget('minimal')).toBe(1);
    expect(densityBudget('balanced')).toBe(4);
    expect(densityBudget('maximal')).toBe(10);
  });
  it('remaining team patches lead, then must-have add-ons; deduped; harmony-filtered', () => {
    const out = buildCandidates({
      ...base, teamsRanked: ['celtics', 'mavericks'], mustHaveIds: ['plc_40_flamingo'],
    });
    expect(out[0]).toBe('plc_66_mavericks');     // team pick takes the prime zone (chest)
    expect(out).toContain('plc_40_flamingo');    // must-have add-on still present (after teams)
    expect(new Set(out).size).toBe(out.length);    // deduped
    expect(out.every((id) => isHarmonious('black', placementById(id)!.dominantColors))).toBe(true);
  });
  it('multiple must-haves keep the fan’s order at the front of the list', () => {
    const out = buildCandidates({
      ...base, mustHaveIds: ['plc_40_flamingo', 'plc_38_poker-chips', 'plc_30_palm-tree'],
    });
    expect(out.slice(0, 3)).toEqual(['plc_40_flamingo', 'plc_38_poker-chips', 'plc_30_palm-tree']);
  });
  it('remaining team patches precede must-have add-ons', () => {
    const out = buildCandidates({
      ...base, teamsRanked: ['celtics', 'mavericks'], mustHaveIds: ['plc_40_flamingo'],
    });
    expect(out.indexOf('plc_66_mavericks')).toBeLessThan(out.indexOf('plc_40_flamingo'));
  });
  it('dedupes a must-have that is also a remaining team patch', () => {
    // mavericks canonical patch as an explicit must-have AND mavericks as team #2
    const mav = placementById('plc_66_mavericks')!;
    const out = buildCandidates({
      ...base, teamsRanked: ['celtics', 'mavericks'], mustHaveIds: [mav.id],
    });
    expect(out.filter((id) => id === mav.id)).toHaveLength(1);
    expect(out[0]).toBe(mav.id); // still first at team priority
  });
  it('drops an explicit must-have that is not harmonious on the fabric', () => {
    // yellow star is low-contrast on bone and must NOT appear even as a must-have
    const out = buildCandidates({
      hoodieColor: 'bone', teamsRanked: [], density: 'maximal', vibe: 'playful',
      mustHaveIds: ['plc_25_star-yellow'],
    });
    expect(out).not.toContain('plc_25_star-yellow');
  });
  it('is deterministic for the same answers', () => {
    const a: QuestionnaireAnswers = {
      ...base, teamsRanked: ['celtics', 'lakers'], mustHaveIds: ['plc_40_flamingo', 'plc_30_palm-tree'],
    };
    expect(buildCandidates(a)).toEqual(buildCandidates(a));
  });
  it('filters out low-contrast candidates for the chosen hoodie', () => {
    const out = buildCandidates({ hoodieColor: 'bone', teamsRanked: [], density: 'maximal', vibe: 'playful' });
    // every surviving candidate must be harmonious on bone
    for (const id of out) {
      const g = placementById(id)!;
      expect(isHarmonious('bone', g.dominantColors)).toBe(true);
    }
    expect(out).not.toContain('plc_25_star-yellow'); // concrete real low-contrast item on bone
  });
  it('vegas vibe surfaces vegas-mood graphics', () => {
    const out = buildCandidates(base);
    expect(out).toContain('plc_03_welcome-to-las-vegas');
  });
  it('drops adult-themed patches for a kid audience, keeps them for adults', () => {
    const adultIds = ['plc_01_martini', 'plc_04_what-happens-in-vegas', 'plc_10_cherries', 'plc_38_poker-chips'];
    const a = { ...base, density: 'maximal' as const, mustHaveIds: adultIds };
    const adult = buildCandidates(a);
    const kid = buildCandidates({ ...a, audience: 'kid' });
    for (const id of adultIds) expect(adult).toContain(id);    // all harmonious on black → admitted for adults
    for (const id of adultIds) expect(kid).not.toContain(id);  // excluded for kids everywhere
  });
  it('orders surprise fillers by the chosen team’s colours (team-aware)', () => {
    // same answers, different #1 team → different filler ordering (colour-matched).
    const celtics = buildCandidates({ ...base, teamsRanked: ['celtics'] });
    const lakers = buildCandidates({ ...base, teamsRanked: ['lakers'] });
    expect(celtics).not.toEqual(lakers);
  });
});

import { describe, it, expect } from 'vitest';
import { resolveBack, densityBudget, buildCandidates } from '@/lib/engine/select';
import { placementById } from '@/lib/catalog';
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
  it('densityBudget maps tiers to caps (1/4/10)', () => {
    expect(densityBudget('minimal')).toBe(1);
    expect(densityBudget('balanced')).toBe(4);
    expect(densityBudget('maximal')).toBe(10);
  });
  it('must-have is first; remaining teams follow; deduped; harmony-filtered', () => {
    const out = buildCandidates({
      ...base, teamsRanked: ['celtics', 'mavericks'], mustHaveIds: ['plc_40_flamingo'],
    });
    expect(out[0]).toBe('plc_40_flamingo');
    expect(out).toContain('plc_66_mavericks');   // remaining team (not the #1 back team)
    expect(new Set(out).size).toBe(out.length);    // deduped
    expect(out.every((id) => isHarmonious('black', placementById(id)!.dominantColors))).toBe(true);
  });
  it('multiple must-haves keep the fan’s order at the front of the list', () => {
    const out = buildCandidates({
      ...base, mustHaveIds: ['plc_40_flamingo', 'plc_38_poker-chips', 'plc_30_palm-tree'],
    });
    expect(out.slice(0, 3)).toEqual(['plc_40_flamingo', 'plc_38_poker-chips', 'plc_30_palm-tree']);
  });
  it('must-haves precede remaining team patches', () => {
    const out = buildCandidates({
      ...base, teamsRanked: ['celtics', 'mavericks'], mustHaveIds: ['plc_40_flamingo'],
    });
    expect(out.indexOf('plc_40_flamingo')).toBeLessThan(out.indexOf('plc_66_mavericks'));
  });
  it('dedupes a must-have that is also a remaining team patch', () => {
    // mavericks canonical patch as an explicit must-have AND mavericks as team #2
    const mav = placementById('plc_66_mavericks')!;
    const out = buildCandidates({
      ...base, teamsRanked: ['celtics', 'mavericks'], mustHaveIds: [mav.id],
    });
    expect(out.filter((id) => id === mav.id)).toHaveLength(1);
    expect(out[0]).toBe(mav.id); // still honoured at must-have priority
  });
  it('drops an explicit must-have that is not harmonious on the fabric', () => {
    // yellow star is low-contrast on white and must NOT appear even as a must-have
    const out = buildCandidates({
      hoodieColor: 'white', teamsRanked: [], density: 'maximal', vibe: 'playful',
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
    const out = buildCandidates({ hoodieColor: 'white', teamsRanked: [], density: 'maximal', vibe: 'playful' });
    // every surviving candidate must be harmonious on white
    for (const id of out) {
      const g = placementById(id)!;
      expect(isHarmonious('white', g.dominantColors)).toBe(true);
    }
    expect(out).not.toContain('plc_25_star-yellow'); // concrete real low-contrast item on white
  });
  it('vegas vibe surfaces vegas-mood graphics', () => {
    const out = buildCandidates(base);
    expect(out).toContain('plc_03_welcome-to-las-vegas');
  });
});

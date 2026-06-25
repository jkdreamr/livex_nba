import { describe, it, expect } from 'vitest';
import { resolveBack, densityBudget, buildCandidates } from '@/lib/engine/select';
import type { QuestionnaireAnswers } from '@/lib/catalog/types';

const base: QuestionnaireAnswers = { hoodieColor: 'black', teamsRanked: [], density: 'balanced', vibe: 'vegas' };

describe('select', () => {
  it('resolveBack uses #1 team when present', () => {
    expect(resolveBack({ ...base, teamsRanked: ['celtics', 'mavericks'] })).toBe('back_07_celtics');
  });
  it('resolveBack falls back to a Summer League back graphic with no team', () => {
    expect(resolveBack(base)).toBe('back_01_las-vegas-summer-league');
  });
  it('densityBudget maps tiers to targets', () => {
    expect(densityBudget('minimal')).toBe(1);
    expect(densityBudget('balanced')).toBe(3);
    expect(densityBudget('maximal')).toBe(8);
  });
  it('must-have is first; remaining teams follow; deduped; harmony-filtered', () => {
    const out = buildCandidates({
      ...base, teamsRanked: ['celtics', 'mavericks'], mustHaveId: 'plc_40_flamingo',
    });
    expect(out[0]).toBe('plc_40_flamingo');
    expect(out).toContain('plc_66_mavericks');   // remaining team (not the #1 back team)
    expect(out).not.toContain('plc_90_eclipse');  // low-contrast on black → filtered
    expect(new Set(out).size).toBe(out.length);    // deduped
  });
  it('vegas vibe surfaces vegas-mood graphics', () => {
    const out = buildCandidates(base);
    expect(out).toContain('plc_03_welcome-to-las-vegas');
  });
});

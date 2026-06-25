import { describe, it, expect } from 'vitest';
import { generate } from '@/lib/engine/generate';
import { designSpecSchema, checkInvariants } from '@/lib/engine/schema';
import type { QuestionnaireAnswers } from '@/lib/catalog/types';

const cases: QuestionnaireAnswers[] = [
  { hoodieColor: 'black', teamsRanked: ['celtics','mavericks'], density: 'maximal', vibe: 'vegas', mustHaveId: 'plc_40_flamingo' },
  { hoodieColor: 'bone',  teamsRanked: [], density: 'minimal', vibe: 'classic' },
  { hoodieColor: 'white', teamsRanked: ['warriors'], density: 'balanced', vibe: 'playful' },
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
});

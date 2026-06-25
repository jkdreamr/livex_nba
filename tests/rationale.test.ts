import { describe, it, expect } from 'vitest';
import { buildRationale } from '@/lib/engine/rationale';
import type { QuestionnaireAnswers } from '@/lib/catalog/types';

const a: QuestionnaireAnswers = { hoodieColor: 'black', teamsRanked: ['celtics'], density: 'balanced', vibe: 'vegas' };

describe('buildRationale', () => {
  it('names the back graphic and is deterministic', () => {
    const r1 = buildRationale(a, 'back_07_celtics', ['plc_40_flamingo']);
    const r2 = buildRationale(a, 'back_07_celtics', ['plc_40_flamingo']);
    expect(r1).toBe(r2);
    expect(r1).toMatch(/Boston Celtics/);
    expect(r1.length).toBeGreaterThan(10);
  });
  it('handles the no-team Summer League case', () => {
    const r = buildRationale({ ...a, teamsRanked: [] }, 'back_01_las-vegas-summer-league', []);
    expect(r).toMatch(/Summer League/i);
  });
});

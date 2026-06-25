import type { DesignSpec, QuestionnaireAnswers } from '@/lib/catalog/types';
import { resolveBack, densityBudget, buildCandidates } from './select';
import { assignZones } from './zones';
import { buildRationale } from './rationale';
import { designSpecSchema, checkInvariants } from './schema';

export class EngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EngineError';
  }
}

export function generate(answers: QuestionnaireAnswers): DesignSpec {
  const backId = resolveBack(answers);
  const budget = densityBudget(answers.density);
  const candidates = buildCandidates(answers);
  const patches = assignZones(candidates, budget);

  const spec: DesignSpec = {
    hoodieColor: answers.hoodieColor,
    backGraphic: { id: backId, zone: 'back_center' },
    patches,
    densityTier: answers.density,
    rationale: buildRationale(answers, backId, patches.map(p => p.id)),
    meta: { favoriteTeamsRanked: answers.teamsRanked, vibe: answers.vibe, schemaVersion: '1.0' },
  };

  const parsed = designSpecSchema.safeParse(spec);
  if (!parsed.success) throw new EngineError(`schema: ${JSON.stringify(parsed.error.issues)}`);
  const violations = checkInvariants(spec);
  if (violations.length) throw new EngineError(`invariants: ${violations.join('; ')}`);
  return spec;
}

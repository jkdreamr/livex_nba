import type { QuestionnaireAnswers, Density, Graphic } from '@/lib/catalog/types';
import {
  BACK_GRAPHIC_CATALOG, PLACEMENT_GRAPHIC_CATALOG,
  teamBackGraphic, teamPatch, placementById,
} from '@/lib/catalog';
import { isHarmonious } from './harmony';

const DENSITY_TARGET: Record<Density, number> = { minimal: 1, balanced: 3, maximal: 8 };
export const densityBudget = (d: Density): number => DENSITY_TARGET[d];

export function resolveBack(answers: QuestionnaireAnswers): string {
  const top = answers.teamsRanked[0];
  if (top) {
    const g = teamBackGraphic(top);
    if (g) return g.id;
  }
  // deterministic Summer League / Vegas fallback: lowest-id SL/vegas back graphic.
  const fallback = BACK_GRAPHIC_CATALOG
    .filter(g => g.category === 'summer_league' || g.category === 'vegas')
    .sort((a, b) => a.id.localeCompare(b.id))[0] ?? BACK_GRAPHIC_CATALOG[0]!;
  return fallback.id;
}

export function buildCandidates(answers: QuestionnaireAnswers): string[] {
  const ordered: string[] = [];
  const push = (g?: Graphic) => { if (g && !ordered.includes(g.id)) ordered.push(g.id); };

  // 1. must-have (if valid)
  if (answers.mustHaveId) push(placementById(answers.mustHaveId));
  // 2. remaining ranked teams (skip the #1 team that took the back slot)
  for (const slug of answers.teamsRanked.slice(1)) push(teamPatch(slug));
  // 3. Vegas / Summer League identity, deterministic by id
  PLACEMENT_GRAPHIC_CATALOG
    .filter(g => g.category === 'vegas' || g.category === 'summer_league')
    .sort((a, b) => a.id.localeCompare(b.id)).forEach(push);
  // 4. vibe(mood)-filtered fun graphics, deterministic by id
  PLACEMENT_GRAPHIC_CATALOG
    .filter(g => g.category === 'fun' && g.mood.includes(answers.vibe))
    .sort((a, b) => a.id.localeCompare(b.id)).forEach(push);

  // harmony filter against the chosen fabric
  return ordered.filter(id => {
    const g = placementById(id);
    return g ? isHarmonious(answers.hoodieColor, g.dominantColors) : false;
  });
}

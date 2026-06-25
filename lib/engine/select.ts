import type { QuestionnaireAnswers, Density, Graphic } from '@/lib/catalog/types';
import {
  BACK_GRAPHIC_CATALOG, PLACEMENT_GRAPHIC_CATALOG,
  teamBackGraphic, teamPatch, placementById,
} from '@/lib/catalog';
import { isHarmonious } from './harmony';

// Patch budget per tier. Equals DENSITY_MAX so the count the fan is promised
// ("up to N patches") is exactly what they get, and "maximal" fills all 10
// zones. assignZones still clamps to the number of available zones/candidates.
const DENSITY_TARGET: Record<Density, number> = { minimal: 1, balanced: 4, maximal: 10 };
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
  const seen = new Set<string>();
  // A candidate is admitted once, only if it survives the colour-harmony
  // invariant against the fabric (checkInvariants enforces this on every patch,
  // so an unharmonious graphic, even an explicit must-have, can never be
  // placed; it is dropped here and a later candidate fills the slot instead).
  const push = (g?: Graphic) => {
    if (!g || seen.has(g.id)) return;
    if (!isHarmonious(answers.hoodieColor, g.dominantColors)) return;
    seen.add(g.id);
    ordered.push(g.id);
  };

  // 1. must-haves (explicit picks), in the fan's priority order. They take the
  //    highest-priority zones (front chest first), so the #1 pick is front-and-centre.
  for (const id of answers.mustHaveIds ?? []) push(placementById(id));
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

  return ordered;
}

import type { QuestionnaireAnswers, Density, Graphic } from '@/lib/catalog/types';
import {
  BACK_GRAPHIC_CATALOG, PLACEMENT_GRAPHIC_CATALOG,
  teamBackGraphic, teamPatch, placementById,
} from '@/lib/catalog';
import { isHarmonious, paletteDistance } from './harmony';

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

  // Colour reference = the #1 team's palette, so the auto/"surprise" fillers are
  // chosen to look good with the team the fan reps. Empty when no team is picked.
  const topTeam = answers.teamsRanked[0];
  const teamColors = (topTeam ? teamPatch(topTeam)?.dominantColors : undefined) ?? [];

  // 1. TEAM picks take priority over the optional add-ons: the remaining ranked
  //    teams (#2..; the #1 team already owns the back). They claim the prime
  //    zones first (front chest, upper back), so team identity leads the look.
  for (const slug of answers.teamsRanked.slice(1)) push(teamPatch(slug));
  // 2. must-have ADD-ONS (the optional Extras picks), in the fan's order.
  for (const id of answers.mustHaveIds ?? []) push(placementById(id));
  // 3. "surprise" fillers: Vegas / Summer League identity + vibe-mood fun,
  //    ORDERED so the colours that match the chosen team come first (closest
  //    palette first), then deterministic id tiebreak. With no team, distance is
  //    a constant 0 so it falls back to a pure, deterministic id sort.
  PLACEMENT_GRAPHIC_CATALOG
    .filter(
      g => g.category === 'vegas' || g.category === 'summer_league'
        || (g.category === 'fun' && g.mood.includes(answers.vibe)),
    )
    .map(g => ({ g, d: teamColors.length ? paletteDistance(g.dominantColors, teamColors) : 0 }))
    .sort((a, b) => a.d - b.d || a.g.id.localeCompare(b.g.id))
    .forEach(({ g }) => push(g));

  return ordered;
}

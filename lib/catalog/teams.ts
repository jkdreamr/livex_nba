import type { Graphic } from './types';
import { PLACEMENT_GRAPHIC_CATALOG } from './placement-graphics';
import { BACK_GRAPHIC_CATALOG } from './back-graphics';

export interface TeamOption {
  slug: string;
  label: string;
  /** Picker thumbnail — a franchise logo, or a non-team back graphic for the
   *  league/event "rep" options. */
  logo: string;
}

/**
 * All 30 canonical NBA franchises, A-Z. Derived from the one `team`-tagged
 * placement graphic per franchise (see `teamPatch()`), so the picker can never
 * drift from the approved catalog. Chicago Bulls is included here even though it
 * has no back graphic; the engine falls back to the Summer League logo on the
 * back for Bulls fans (see `resolveBack()`).
 */
export const TEAMS: TeamOption[] = PLACEMENT_GRAPHIC_CATALOG
  .filter((g): g is Graphic & { team: string } => Boolean(g.team))
  .map((g) => ({ slug: g.team, label: g.label, logo: g.file }))
  .sort((a, b) => a.label.localeCompare(b.label));

/**
 * League / event "rep" options for fans who don't want a single franchise on
 * the back. Each maps 1:1 to a non-team back graphic, and the option's `slug`
 * IS that back graphic's id — so `resolveBack()` can place it directly with no
 * extra mapping. Validated against the live back catalog at module load, so a
 * renamed/removed graphic surfaces immediately instead of 404-ing later.
 */
const FEATURE_BACK_IDS = [
  'back_01_las-vegas-summer-league',
  'back_02_summer-league',
  'back_03_nba',
] as const;

export const FEATURE_OPTIONS: TeamOption[] = FEATURE_BACK_IDS
  .map((id) => BACK_GRAPHIC_CATALOG.find((g) => g.id === id))
  .filter((g): g is Graphic => Boolean(g))
  .map((g) => ({ slug: g.id, label: g.label, logo: g.file }));

const FEATURED_PATCH_IDS = [
  'plc_40_flamingo',
  'plc_30_palm-tree',
  'plc_05_basketball',
  'plc_16_trophy',
  'plc_38_poker-chips',
  'plc_03_welcome-to-las-vegas',
  'plc_04_what-happens-in-vegas',
  'plc_23_rainbow',
  'plc_29_shamrock',
  'plc_19_lips',
  'plc_07_sun',
  'plc_11_pizza',
  'plc_44_surfboard',
  'plc_53_sunglasses',
  'plc_54_cactus',
  'plc_55_sugar-skull',
  'plc_01_martini',
  'plc_10_cherries',
  'plc_06_foam-finger',
  'plc_17_evil-eye',
  'plc_13_wave',
  'plc_32_flaming-heart',
  'plc_08_planet-basketball',
  'plc_12_summer-league-flames',
] as const;

/**
 * A short set of fun/Vegas patches offered as the optional "must-have" in the
 * questionnaire. Every id is validated against the live catalog at module load,
 * so a renamed/removed graphic surfaces immediately instead of 404-ing later.
 */
export const FEATURED_PATCHES: Graphic[] = FEATURED_PATCH_IDS
  .map((id) => PLACEMENT_GRAPHIC_CATALOG.find((g) => g.id === id))
  .filter((g): g is Graphic => Boolean(g));

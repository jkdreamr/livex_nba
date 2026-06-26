/**
 * Patches with adult / vice themes (alcohol, gambling, the Vegas-adult tagline)
 * that are excluded when the wearer audience is `kid`, so a kid's hoodie stays
 * all-ages. Both the design engine (surprise fillers + must-haves) and the
 * Extras picker honour this set. The garment itself is unisex; audience only
 * affects content, never the cut.
 */
export const ADULT_PATCH_IDS: ReadonlySet<string> = new Set([
  'plc_01_martini',
  'plc_04_what-happens-in-vegas',
  'plc_10_cherries',
  'plc_38_poker-chips',
]);

/** True when a placement-graphic id is safe to show to a `kid` audience. */
export const isKidSafe = (id: string): boolean => !ADULT_PATCH_IDS.has(id);

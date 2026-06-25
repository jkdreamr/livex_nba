import { FABRIC_HEX } from '@/lib/catalog/hoodie-colors';
import type { HoodieColor } from '@/lib/catalog/types';

const CONTRAST_THRESHOLD = 1.6; // a patch must have ≥1 dominant color this distinct from fabric

function channelToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}
function luminance(hex: string): number {
  const stripped = hex.startsWith('#') ? hex.slice(1) : hex;
  if (!/^[0-9A-Fa-f]{6}$/.test(stripped)) {
    throw new Error(`luminance: expected 6-digit hex colour, got "${hex}"`);
  }
  const r = parseInt(stripped.slice(0, 2), 16),
        g = parseInt(stripped.slice(2, 4), 16),
        b = parseInt(stripped.slice(4, 6), 16);
  return 0.2126 * channelToLinear(r) + 0.7152 * channelToLinear(g) + 0.0722 * channelToLinear(b);
}
export function contrastRatio(hexA: string, hexB: string): number {
  const la = luminance(hexA), lb = luminance(hexB);
  const hi = Math.max(la, lb) + 0.05, lo = Math.min(la, lb) + 0.05;
  return hi / lo;
}
export function isHarmonious(hoodie: HoodieColor, dominantColors: string[]): boolean {
  const fabric = FABRIC_HEX[hoodie];
  return dominantColors.some(c => contrastRatio(c, fabric) >= CONTRAST_THRESHOLD);
}
/** Exposed for testing; validates the 6-hex guard. */
export { luminance as luminanceOf };

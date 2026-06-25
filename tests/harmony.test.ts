import { describe, it, expect } from 'vitest';
import { isHarmonious, contrastRatio } from '@/lib/engine/harmony';

describe('harmony', () => {
  it('contrastRatio is symmetric and ~21 for black/white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 0);
  });
  it('rejects dark-only graphic on black hoodie', () => {
    expect(isHarmonious('black', ['#0A0A0A', '#161616'])).toBe(false);
  });
  it('accepts a graphic with any high-contrast dominant color on black', () => {
    expect(isHarmonious('black', ['#0A0A0A', '#FFC72C'])).toBe(true);
  });
  it('rejects near-white graphic on white hoodie', () => {
    expect(isHarmonious('white', ['#F4F4F2'])).toBe(false);
  });
  it('grey hoodie accepts mid-to-high contrast', () => {
    expect(isHarmonious('grey', ['#1D428A'])).toBe(true);
  });
});

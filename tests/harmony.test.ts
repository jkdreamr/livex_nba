import { describe, it, expect } from 'vitest';
import { isHarmonious, contrastRatio, luminanceOf } from '@/lib/engine/harmony';

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

  describe('luminance hex guard', () => {
    it('throws on 3-digit shorthand hex', () => {
      expect(() => luminanceOf('#FFF')).toThrow('6-digit hex');
    });
    it('throws on a CSS named color', () => {
      expect(() => luminanceOf('red')).toThrow('6-digit hex');
    });
    it('throws on an empty string', () => {
      expect(() => luminanceOf('')).toThrow('6-digit hex');
    });
    it('does NOT throw on a valid 6-digit hex', () => {
      expect(() => luminanceOf('#FFFFFF')).not.toThrow();
      expect(() => luminanceOf('#000000')).not.toThrow();
    });
  });
});

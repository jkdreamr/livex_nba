import { describe, it, expect } from 'vitest';
import { LANDING_SECTIONS, ACT_KEYFRAMES } from '@/lib/landing/landing.config';

describe('landing config', () => {
  it('has unique section ids', () => {
    const ids = LANDING_SECTIONS.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('starts with a hero and ends with a cta', () => {
    expect(LANDING_SECTIONS[0]!.kind).toBe('hero');
    expect(LANDING_SECTIONS.at(-1)!.kind).toBe('cta');
  });
  it('act keyframes are sorted and span 0..1', () => {
    expect(ACT_KEYFRAMES[0]!.at).toBe(0);
    expect(ACT_KEYFRAMES.at(-1)!.at).toBe(1);
    for (let i = 1; i < ACT_KEYFRAMES.length; i++) {
      expect(ACT_KEYFRAMES[i]!.at).toBeGreaterThan(ACT_KEYFRAMES[i - 1]!.at);
    }
  });
});

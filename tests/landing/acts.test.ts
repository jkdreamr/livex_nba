import { describe, it, expect } from 'vitest';
import { poseAtProgress } from '@/lib/landing/acts';

describe('poseAtProgress', () => {
  it('returns the first keyframe at progress 0 (and clamps below)', () => {
    expect(poseAtProgress(0).rotationY).toBe(0);
    expect(poseAtProgress(-1).rotationY).toBe(0);
  });
  it('returns the last keyframe at progress 1 (and clamps above)', () => {
    expect(poseAtProgress(1).rotationY).toBe(720);
    expect(poseAtProgress(2).rotationY).toBe(720);
  });
  it('rotation increases monotonically across the page', () => {
    let prev = -1;
    for (let p = 0; p <= 1.0001; p += 0.05) {
      const r = poseAtProgress(Math.min(p, 1)).rotationY;
      expect(r).toBeGreaterThanOrEqual(prev);
      prev = r;
    }
  });
  it('interpolates position between surrounding keyframes', () => {
    // between at=0.14 (x=0) and at=0.34 (x=-1.6): midpoint x is between them
    const mid = poseAtProgress(0.24).position[0];
    expect(mid).toBeLessThan(0);
    expect(mid).toBeGreaterThan(-1.6);
  });
  it('hits an exact keyframe value at its `at`', () => {
    expect(poseAtProgress(0.34).position[0]).toBeCloseTo(-1.6, 5);
  });
});

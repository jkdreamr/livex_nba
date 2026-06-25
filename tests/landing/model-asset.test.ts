import { describe, it, expect } from 'vitest';
import { statSync, existsSync } from 'node:fs';

describe('lebron model asset', () => {
  it('exists and is reasonably sized (<3.5MB)', () => {
    const path = 'public/models/lebron.glb';
    expect(existsSync(path)).toBe(true);
    if (existsSync(path)) {
      expect(statSync(path).size).toBeLessThan(3.5 * 1024 * 1024);
    }
  });
  it('ships a license/attribution note', () => {
    expect(existsSync('public/models/lebron-LICENSE.txt')).toBe(true);
  });
});

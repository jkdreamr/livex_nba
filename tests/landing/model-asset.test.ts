import { describe, it, expect } from 'vitest';
import { statSync, existsSync } from 'node:fs';

describe('lebron model asset', () => {
  it('exists and is reasonably sized (<3.5MB)', () => {
    expect(existsSync('public/models/lebron.glb')).toBe(true);
    expect(statSync('public/models/lebron.glb').size).toBeLessThan(3.5 * 1024 * 1024);
  });
  it('ships a license/attribution note', () => {
    expect(existsSync('public/models/lebron-LICENSE.txt')).toBe(true);
  });
});

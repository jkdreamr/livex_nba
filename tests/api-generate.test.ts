import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/generate/route';

function req(body: unknown) {
  return new Request('http://localhost/api/generate', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
}
describe('POST /api/generate', () => {
  it('returns a valid spec for good input', async () => {
    const res = await POST(req({ hoodieColor: 'black', teamsRanked: ['celtics'], density: 'balanced', vibe: 'vegas' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.spec.backGraphic.id).toBe('back_07_celtics');
  });
  it('rejects malformed input with 400', async () => {
    const res = await POST(req({ hoodieColor: 'purple' }));
    expect(res.status).toBe(400);
  });
});

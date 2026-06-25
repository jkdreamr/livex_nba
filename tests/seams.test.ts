import { describe, it, expect } from 'vitest';
import { LocalJsonStore } from '@/lib/store/design-store';
import { getCurator } from '@/lib/curation/curator';
import { generate } from '@/lib/engine/generate';

const spec = generate({ hoodieColor: 'black', teamsRanked: ['celtics'], density: 'minimal', vibe: 'vegas' });

describe('seams', () => {
  it('LocalJsonStore round-trips a spec by id', async () => {
    const store = new LocalJsonStore();
    const id = await store.save(spec);
    expect(typeof id).toBe('string');
    expect(await store.get(id)).toEqual(spec);
    expect(await store.get('missing')).toBeNull();
  });
  it('default curator is identity when LLM disabled', async () => {
    delete process.env.ENABLE_LLM_CURATION;
    expect(await getCurator().curate(spec)).toEqual(spec);
  });
});

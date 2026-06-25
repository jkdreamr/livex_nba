import type { DesignSpec } from '@/lib/catalog/types';

export interface Curator {
  curate(spec: DesignSpec): Promise<DesignSpec>;
}

export class IdentityCurator implements Curator {
  async curate(spec: DesignSpec): Promise<DesignSpec> {
    return spec;
  }
}

// OpenRouter curator is added in a later milestone, behind ENABLE_LLM_CURATION.
export function getCurator(): Curator {
  return new IdentityCurator();
}

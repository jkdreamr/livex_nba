import type { DesignSpec } from '@/lib/catalog/types';

export interface DesignStore {
  save(spec: DesignSpec): Promise<string>;
  get(id: string): Promise<DesignSpec | null>;
}

export class LocalJsonStore implements DesignStore {
  private mem = new Map<string, DesignSpec>();
  private seq = 0;

  async save(spec: DesignSpec): Promise<string> {
    const id = `dsn_${(++this.seq).toString(36).padStart(4, '0')}`;
    this.mem.set(id, spec);
    return id;
  }

  async get(id: string): Promise<DesignSpec | null> {
    return this.mem.get(id) ?? null;
  }
}

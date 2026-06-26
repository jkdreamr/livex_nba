import type { Graphic } from './types';
import catalog from '@/assets/catalog.json';
import { PLACEMENT_GRAPHIC_CATALOG } from './placement-graphics';

const base = catalog.back as unknown as Graphic[];

// Chicago Bulls has no dedicated back graphic in the source PDF, so picking the
// Bulls used to fall back to the Summer League logo on the back. Reuse the
// official Bulls placement logo as a back graphic so Bulls fans see the Bulls
// on the back like every other franchise. (Real asset, not invented.)
const bullsPatch = PLACEMENT_GRAPHIC_CATALOG.find((g) => g.team === 'bulls');
const extraBacks: Graphic[] = bullsPatch
  ? [{ ...bullsPatch, id: 'back_34_bulls', category: 'team' }]
  : [];

export const BACK_GRAPHIC_CATALOG: Graphic[] = [...base, ...extraBacks];

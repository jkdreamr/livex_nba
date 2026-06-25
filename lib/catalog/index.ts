import type { Graphic, GraphicCategory, Mood } from './types';
import { BACK_GRAPHIC_CATALOG } from './back-graphics';
import { PLACEMENT_GRAPHIC_CATALOG } from './placement-graphics';
export { BACK_GRAPHIC_CATALOG } from './back-graphics';
export { PLACEMENT_GRAPHIC_CATALOG } from './placement-graphics';
export * from './types';

export const backById = (id: string): Graphic | undefined => BACK_GRAPHIC_CATALOG.find(g => g.id === id);
export const placementById = (id: string): Graphic | undefined => PLACEMENT_GRAPHIC_CATALOG.find(g => g.id === id);
export const teamBackGraphic = (slug: string): Graphic | undefined =>
  BACK_GRAPHIC_CATALOG.find(g => g.team === slug);
export const teamPatch = (slug: string): Graphic | undefined =>
  PLACEMENT_GRAPHIC_CATALOG.find(g => g.team === slug);
export const placementByCategory = (cat: GraphicCategory): Graphic[] =>
  PLACEMENT_GRAPHIC_CATALOG.filter(g => g.category === cat);
export const placementByMood = (mood: Mood): Graphic[] =>
  PLACEMENT_GRAPHIC_CATALOG.filter(g => g.mood.includes(mood));

import type { Density, Vibe } from '@/lib/catalog/types';
import { PLACEMENT_GRAPHIC_CATALOG } from '@/lib/catalog/placement-graphics';

export interface VibeOption {
  id: Vibe;
  label: string;
  blurb: string;
  /** A representative accent colour for the option card. */
  accent: string;
  /** A few example sticker images this vibe surfaces (shown on the Style step). */
  preview: string[];
}

// Stickers a vibe surfaces: its mood-tagged `fun` patches first (the part that
// actually changes per vibe), padded with the Vegas / Summer League patches that
// always appear, so even a sparse vibe still shows a full preview row.
const previewFor = (vibe: Vibe, n = 5): string[] => {
  const fun = PLACEMENT_GRAPHIC_CATALOG
    .filter((g) => g.category === 'fun' && g.mood.includes(vibe))
    .map((g) => g.file);
  const always = PLACEMENT_GRAPHIC_CATALOG
    .filter((g) => g.category === 'vegas' || g.category === 'summer_league')
    .map((g) => g.file)
    .filter((f) => !fun.includes(f));
  return [...fun, ...always].slice(0, n);
};

export const VIBE_OPTIONS: VibeOption[] = [
  { id: 'classic', label: 'Classic', blurb: 'Clean team pride. Logos and league marks, nothing loud.', accent: '#2845E7', preview: previewFor('classic') },
  { id: 'vegas', label: 'Vegas', blurb: 'Neon, dice, Strip signs, and Summer League marks.', accent: '#E7456B', preview: previewFor('vegas') },
  { id: 'streetwear', label: 'Streetwear', blurb: 'Bolder graphics with a patch-heavy look.', accent: '#15B981', preview: previewFor('streetwear') },
  { id: 'playful', label: 'Playful', blurb: 'Flamingos, rainbows, palm trees, and brighter colors.', accent: '#F5A524', preview: previewFor('playful') },
];

export interface DensityOption {
  id: Density;
  label: string;
  blurb: string;
  /** Max patches this tier allows (mirrors DENSITY_MAX in the engine). */
  max: number;
}

export const DENSITY_OPTIONS: DensityOption[] = [
  { id: 'minimal', label: 'Minimal', blurb: 'One hero graphic. Let it breathe.', max: 1 },
  { id: 'balanced', label: 'Balanced', blurb: 'A few well-placed patches.', max: 4 },
  { id: 'maximal', label: 'Maximal', blurb: 'Chest, back, and both sleeves.', max: 10 },
];

import type { Density, Vibe } from '@/lib/catalog/types';

export interface VibeOption {
  id: Vibe;
  label: string;
  blurb: string;
  /** A representative accent colour for the option card. */
  accent: string;
}

export const VIBE_OPTIONS: VibeOption[] = [
  { id: 'classic', label: 'Classic', blurb: 'Clean team pride. Logos and league marks, nothing loud.', accent: '#2845E7' },
  { id: 'vegas', label: 'Vegas', blurb: 'Neon, dice, Strip signs, and Summer League marks.', accent: '#E7456B' },
  { id: 'streetwear', label: 'Streetwear', blurb: 'Bolder graphics with a patch-heavy look.', accent: '#15B981' },
  { id: 'playful', label: 'Playful', blurb: 'Flamingos, rainbows, palm trees, and brighter colors.', accent: '#F5A524' },
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

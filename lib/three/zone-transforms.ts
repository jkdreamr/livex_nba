import type { BackZone, PatchZone } from '@/lib/catalog/types';

/**
 * Decal placement on the GLB body mesh, in the BAKED (clean-world) space of the
 * renderer. Each zone is a surface point plus outward normal raycast from the real
 * mesh. A shallow projector then embroiders the logo onto the local surface.
 * Matches the PDF Step-2 layout: front chest (1, RIGHT chest), upper back (2),
 * centre back (3, the hero), and patches down the OUTER side of each sleeve.
 */
export interface GlbZone {
  position: [number, number, number]; // surface point (clean-world)
  normal: [number, number, number]; // outward surface normal
  scale: number; // decal face size (world units)
  depth?: number; // projector depth override (shallow near thin layers e.g. hood)
}

export const ZONE_GLB: Record<BackZone | PatchZone, GlbZone> = {
  back_center: { position: [0, 1.2, -0.115], normal: [0, 0, -1], scale: 0.26 },
  // Upper-back patch, lifted up onto the hood-base ridge (~y1.40) so it clears
  // the centre-back hero (top ≈ y1.33) with a clean gap instead of touching it.
  // The deep projector (0.09) reaches across the ridge fold so the TOP of the
  // logo isn't clipped on the down-curving far side; slightly smaller scale
  // keeps the separation from the hero.
  back_upper: { position: [0, 1.4, -0.06], normal: [0.03, 0.34, -0.94], scale: 0.09, depth: 0.09 },
  front_chest: { position: [0.1, 1.25, 0.064], normal: [0.28, 0.34, 0.9], scale: 0.11 },

  // OUTER sleeve (normals ≈ ±x): four patches marching evenly DOWN the side of
  // each sleeve, top → cuff, with a uniform smaller scale and ~0.10 spacing so
  // adjacent patches never touch. The fill order (1→4) descends, so a maximal
  // design reads as an even column; lighter densities just use the top zones.
  // x widens slightly toward the cuff as the sleeve angles outward.
  left_sleeve_1: { position: [-0.202, 1.205, 0], normal: [-0.99, -0.02, 0.14], scale: 0.069 },
  left_sleeve_2: { position: [-0.228, 1.1, 0], normal: [-0.97, -0.19, 0.02], scale: 0.069 },
  left_sleeve_3: { position: [-0.248, 0.995, 0], normal: [-0.95, -0.1, 0.06], scale: 0.069 },
  left_sleeve_4: { position: [-0.252, 0.89, 0], normal: [-0.95, 0.16, 0.27], scale: 0.069 },

  right_sleeve_1: { position: [0.228, 1.205, 0], normal: [0.99, 0.07, -0.12], scale: 0.069 },
  right_sleeve_2: { position: [0.248, 1.1, 0], normal: [0.99, 0.05, -0.08], scale: 0.069 },
  right_sleeve_3: { position: [0.251, 0.995, 0], normal: [0.96, 0, 0.12], scale: 0.069 },
  right_sleeve_4: { position: [0.249, 0.89, 0], normal: [0.92, -0.1, 0.36], scale: 0.069 },
};

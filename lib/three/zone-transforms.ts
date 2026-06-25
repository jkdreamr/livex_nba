import type { BackZone, PatchZone } from '@/lib/catalog/types';

/**
 * Decal placement on the GLB body mesh, in the BAKED (clean-world) space of the
 * renderer — each zone is a surface POINT + outward NORMAL raycast from the real
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
  // The hood meets the back in a horizontal ridge (~y1.37–1.40): the surface
  // rolls from straight-back, over the ridge, to down-facing by y1.43. Centred
  // just below the ridge with a deeper projector so the box reaches across the
  // fold and the TOP of the logo isn't clipped on the down-curving far side.
  back_upper: { position: [0, 1.36, -0.072], normal: [0.03, 0.34, -0.94], scale: 0.095, depth: 0.09 },
  front_chest: { position: [0.1, 1.25, 0.064], normal: [0.28, 0.34, 0.9], scale: 0.11 },

  // OUTER sleeve (normals ≈ ±x), stacked down the side per the PDF
  left_sleeve_1: { position: [-0.205, 1.18, 0], normal: [-0.99, -0.02, 0.14], scale: 0.085 },
  left_sleeve_2: { position: [-0.243, 1.04, 0], normal: [-0.95, -0.3, -0.1], scale: 0.085 },
  left_sleeve_3: { position: [-0.251, 0.92, 0], normal: [-0.95, 0.16, 0.28], scale: 0.08 },
  left_sleeve_4: { position: [-0.225, 1.11, 0], normal: [-0.97, -0.12, 0.05], scale: 0.075 },

  right_sleeve_1: { position: [0.231, 1.18, 0], normal: [0.99, 0.07, -0.12], scale: 0.085 },
  right_sleeve_2: { position: [0.251, 1.04, 0], normal: [0.99, 0.06, -0.08], scale: 0.085 },
  right_sleeve_3: { position: [0.249, 0.92, 0], normal: [0.91, -0.1, 0.4], scale: 0.08 },
  right_sleeve_4: { position: [0.24, 1.11, 0], normal: [0.99, 0, 0], scale: 0.075 },
};

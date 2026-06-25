import type { BackZone, PatchZone } from '@/lib/catalog/types';

/**
 * 3D placement of each catalog zone on the procedural hoodie mesh.
 *
 * `mesh` names which sub-mesh the decal is a child of (drei <Decal> projects
 * onto its parent mesh). `position`/`rotation` are in that mesh's LOCAL space;
 * `scale` is the uniform decal-projector size (our PNGs are square so a scalar
 * keeps aspect ratio). These are CALIBRATION DEFAULTS — fine-tune live on the
 * /preview page (drei <Decal debug> shows the projector box).
 */
export type DecalMesh = 'body' | 'leftSleeve' | 'rightSleeve';

export interface ZoneTransform {
  mesh: DecalMesh;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}

// Body RoundedBox is ~[1.5 w, 1.9 h, 0.7 d]: front face z≈+0.37, back face z≈-0.37.
// Sleeve RoundedBoxes are ~[0.44 w, 1.5 h, 0.46 d] in their own local space.
export const ZONE_3D: Record<BackZone | PatchZone, ZoneTransform> = {
  back_center: { mesh: 'body', position: [0, -0.05, -0.31], rotation: [0, Math.PI, 0], scale: 0.78 },
  back_upper: { mesh: 'body', position: [0, 0.52, -0.31], rotation: [0, Math.PI, 0], scale: 0.3 },
  front_chest: { mesh: 'body', position: [-0.28, 0.46, 0.31], rotation: [0, 0, 0], scale: 0.3 },

  // sleeve decals are in the sleeve RoundedBox's local space (outer face x≈∓0.2)
  left_sleeve_1: { mesh: 'leftSleeve', position: [-0.21, 0.46, 0.0], rotation: [0, -Math.PI / 2, 0], scale: 0.26 },
  left_sleeve_2: { mesh: 'leftSleeve', position: [-0.21, 0.12, 0.0], rotation: [0, -Math.PI / 2, 0], scale: 0.26 },
  left_sleeve_3: { mesh: 'leftSleeve', position: [-0.21, -0.24, 0.0], rotation: [0, -Math.PI / 2, 0], scale: 0.26 },
  left_sleeve_4: { mesh: 'leftSleeve', position: [-0.21, -0.58, 0.0], rotation: [0, -Math.PI / 2, 0], scale: 0.26 },

  right_sleeve_1: { mesh: 'rightSleeve', position: [0.21, 0.46, 0.0], rotation: [0, Math.PI / 2, 0], scale: 0.26 },
  right_sleeve_2: { mesh: 'rightSleeve', position: [0.21, 0.12, 0.0], rotation: [0, Math.PI / 2, 0], scale: 0.26 },
  right_sleeve_3: { mesh: 'rightSleeve', position: [0.21, -0.24, 0.0], rotation: [0, Math.PI / 2, 0], scale: 0.26 },
  right_sleeve_4: { mesh: 'rightSleeve', position: [0.21, -0.58, 0.0], rotation: [0, Math.PI / 2, 0], scale: 0.26 },
};

/**
 * Decal placement on the real GLB body mesh (Object_8), from raycasting the
 * actual surface — each zone is a surface POINT + outward NORMAL. The renderer
 * projects from a point offset along the normal with a deep box, so decals land
 * reliably even on the draped sleeves. Matches the PDF Step-2 layout: front
 * chest (1), upper back (2), centre back (3, hero), and patches DOWN each sleeve.
 */
export interface GlbZone {
  position: [number, number, number]; // surface point (body-local)
  normal: [number, number, number]; // outward surface normal
  scale: number; // decal face size (world units)
}

export const ZONE_GLB: Record<BackZone | PatchZone, GlbZone> = {
  back_center: { position: [0, 1.3, -0.155], normal: [0, 0, -1], scale: 0.3 },
  back_upper: { position: [0, 1.57, -0.116], normal: [-0.01, 0.19, -0.98], scale: 0.12 },
  front_chest: { position: [-0.13, 1.46, 0.078], normal: [-0.4, 0.29, 0.87], scale: 0.13 },

  left_sleeve_1: { position: [-0.183, 1.4, 0.04], normal: [-0.92, -0.15, -0.36], scale: 0.1 },
  left_sleeve_2: { position: [-0.21, 1.26, 0.04], normal: [-0.98, -0.03, -0.19], scale: 0.1 },
  left_sleeve_3: { position: [-0.285, 1.12, 0.04], normal: [-0.58, 0.22, 0.78], scale: 0.095 },
  left_sleeve_4: { position: [-0.2, 1.33, 0.04], normal: [-0.95, -0.1, -0.27], scale: 0.09 },

  right_sleeve_1: { position: [0.219, 1.4, 0.04], normal: [0.84, -0.04, 0.55], scale: 0.1 },
  right_sleeve_2: { position: [0.25, 1.26, 0.04], normal: [0.32, -0.02, 0.95], scale: 0.1 },
  right_sleeve_3: { position: [0.28, 1.12, 0.04], normal: [0.57, -0.31, 0.77], scale: 0.095 },
  right_sleeve_4: { position: [0.23, 1.33, 0.04], normal: [0.7, -0.05, 0.7], scale: 0.09 },
};

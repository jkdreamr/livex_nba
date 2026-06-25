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

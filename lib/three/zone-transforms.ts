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
  back_center: { mesh: 'body', position: [0, 0.02, -0.38], rotation: [0, Math.PI, 0], scale: 0.86 },
  back_upper: { mesh: 'body', position: [0, 0.64, -0.38], rotation: [0, Math.PI, 0], scale: 0.4 },
  front_chest: { mesh: 'body', position: [-0.34, 0.52, 0.38], rotation: [0, 0, 0], scale: 0.36 },

  left_sleeve_1: { mesh: 'leftSleeve', position: [-0.24, 0.46, 0.0], rotation: [0, -Math.PI / 2, 0], scale: 0.3 },
  left_sleeve_2: { mesh: 'leftSleeve', position: [-0.24, 0.12, 0.0], rotation: [0, -Math.PI / 2, 0], scale: 0.3 },
  left_sleeve_3: { mesh: 'leftSleeve', position: [-0.24, -0.22, 0.0], rotation: [0, -Math.PI / 2, 0], scale: 0.3 },
  left_sleeve_4: { mesh: 'leftSleeve', position: [-0.24, -0.56, 0.0], rotation: [0, -Math.PI / 2, 0], scale: 0.3 },

  right_sleeve_1: { mesh: 'rightSleeve', position: [0.24, 0.46, 0.0], rotation: [0, Math.PI / 2, 0], scale: 0.3 },
  right_sleeve_2: { mesh: 'rightSleeve', position: [0.24, 0.12, 0.0], rotation: [0, Math.PI / 2, 0], scale: 0.3 },
  right_sleeve_3: { mesh: 'rightSleeve', position: [0.24, -0.22, 0.0], rotation: [0, Math.PI / 2, 0], scale: 0.3 },
  right_sleeve_4: { mesh: 'rightSleeve', position: [0.24, -0.56, 0.0], rotation: [0, Math.PI / 2, 0], scale: 0.3 },
};

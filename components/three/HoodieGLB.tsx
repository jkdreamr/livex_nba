'use client';

import { useGLTF, useTexture } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import type { DesignSpec } from '@/lib/catalog/types';
import { FABRIC_HEX } from '@/lib/catalog/hoodie-colors';
import { backById, placementById } from '@/lib/catalog';
import { ZONE_GLB, type GlbZone } from '@/lib/three/zone-transforms';

const MODEL = '/models/hoodie.glb';
// Tint the garment fabric; leave the zipper (Material94283) metallic.
const FABRIC_RE = /fleece|rib|fabric/i;
// The main body mesh whose local space + world matrix the patches ride on.
const BODY_MESH = 'Object_8';
const Z_AXIS = new THREE.Vector3(0, 0, 1);

/** A graphic as a flat quad laid tangent to the garment surface (a real patch
 *  is flat). Positioned at the raycast surface point, oriented to the surface
 *  normal — can't smear or float like a projected decal. */
function Patch({ file, zone }: { file: string; zone: GlbZone }) {
  const tex = useTexture(file) as THREE.Texture;
  const { position, quaternion } = useMemo(() => {
    const n = new THREE.Vector3(...zone.normal).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(Z_AXIS, n);
    const p = new THREE.Vector3(...zone.position).addScaledVector(n, 0.008);
    return {
      position: [p.x, p.y, p.z] as [number, number, number],
      quaternion: [q.x, q.y, q.z, q.w] as [number, number, number, number],
    };
  }, [zone]);

  return (
    <mesh position={position} quaternion={quaternion} renderOrder={3}>
      <planeGeometry args={[zone.scale, zone.scale]} />
      <meshStandardMaterial
        map={tex}
        map-colorSpace={THREE.SRGBColorSpace}
        map-anisotropy={8}
        transparent
        alphaTest={0.5}
        roughness={0.7}
        side={THREE.DoubleSide}
        polygonOffset
        polygonOffsetFactor={-4}
      />
    </mesh>
  );
}

export function HoodieGLB({ spec }: { spec: DesignSpec }) {
  const { scene } = useGLTF(MODEL);

  // Clone once; tint fabric; capture the body mesh's world matrix so the patch
  // group can ride the body's local space exactly (same as the rendered body).
  const { cloned, bodyMatrix } = useMemo(() => {
    const c = scene.clone(true);
    c.updateMatrixWorld(true);
    let matrix = new THREE.Matrix4();
    c.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
        m.material = (m.material as THREE.Material).clone();
        if (m.name === BODY_MESH) matrix = m.matrixWorld.clone();
      }
    });
    return { cloned: c, bodyMatrix: matrix };
  }, [scene]);

  const color = FABRIC_HEX[spec.hoodieColor];
  useMemo(() => {
    cloned.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        const mat = m.material as THREE.MeshStandardMaterial;
        if (FABRIC_RE.test(mat.name)) {
          mat.color.set(color);
          mat.roughness = 0.95;
          mat.metalness = 0;
          mat.needsUpdate = true;
        }
      }
    });
  }, [cloned, color]);

  const decals = useMemo(() => {
    const out: { key: string; file: string; zone: GlbZone }[] = [];
    const back = backById(spec.backGraphic.id);
    if (back) out.push({ key: `back-${back.id}`, file: back.file, zone: ZONE_GLB[spec.backGraphic.zone] });
    for (const p of spec.patches) {
      const g = placementById(p.id);
      const zone = ZONE_GLB[p.zone];
      if (g && zone) out.push({ key: `${p.zone}-${g.id}`, file: g.file, zone });
    }
    return out;
  }, [spec]);

  return (
    // The GLB's Sketchfab root presents the BACK (hero graphic) at 0° — a good
    // default. Patches ride the same transforms.
    <group>
      <primitive object={cloned} />
      {/* patches ride the body mesh's world matrix → exact body-local placement */}
      <group matrix={bodyMatrix} matrixAutoUpdate={false}>
        {decals.map((d) => (
          <Patch key={d.key} file={d.file} zone={d.zone} />
        ))}
      </group>
    </group>
  );
}

useGLTF.preload(MODEL);

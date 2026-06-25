'use client';

import { useGLTF, useTexture } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import type { DesignSpec } from '@/lib/catalog/types';
import { FABRIC_HEX } from '@/lib/catalog/hoodie-colors';
import { backById, placementById } from '@/lib/catalog';
import { ZONE_GLB, type GlbZone } from '@/lib/three/zone-transforms';

const MODEL = '/models/hoodie.glb';
const FABRIC_RE = /fleece|rib|fabric/i;
const BODY_MESH = 'Object_8';
// Shallow projector depth (world units) → conforms to the LOCAL surface curve
// without smearing across folds.
const DEPTH = 0.12;

/** Tangent-frame Euler from a surface normal: local +z = outward normal
 *  (projection axis), local +y = world-up projected onto the tangent plane —
 *  so the logo conforms AND stays upright (never upside-down). */
function tangentEuler(n: THREE.Vector3): THREE.Euler {
  const z = n.clone().normalize();
  const up = Math.abs(z.y) > 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
  const x = new THREE.Vector3().crossVectors(up, z).normalize();
  const y = new THREE.Vector3().crossVectors(z, x).normalize();
  return new THREE.Euler().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}

function DecalMesh({ geometry, file }: { geometry: THREE.BufferGeometry; file: string }) {
  const tex = useTexture(file) as THREE.Texture;
  return (
    <mesh geometry={geometry} renderOrder={3}>
      <meshStandardMaterial
        map={tex}
        map-colorSpace={THREE.SRGBColorSpace}
        map-anisotropy={8}
        transparent
        alphaTest={0.12}
        roughness={0.62}
        metalness={0}
        polygonOffset
        polygonOffsetFactor={-8}
        depthWrite={false}
      />
    </mesh>
  );
}

export function HoodieGLB({ spec }: { spec: DesignSpec }) {
  const { scene } = useGLTF(MODEL);

  // Bake every mesh's world transform into its geometry and reparent into a flat
  // identity-space group. Now the body's geometry, the decals, and the rendered
  // mesh all share ONE coordinate frame — no double-transform, no floating.
  const { flat, body, bodyMatrix, scaleK } = useMemo(() => {
    const c = scene.clone(true);
    c.updateMatrixWorld(true);
    let bm = new THREE.Matrix4();
    c.traverse((o) => {
      if ((o as THREE.Mesh).isMesh && o.name === BODY_MESH) bm = o.matrixWorld.clone();
    });
    const group = new THREE.Group();
    let bodyMesh: THREE.Mesh | null = null;
    const meshes: THREE.Mesh[] = [];
    c.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
    });
    for (const m of meshes) {
      const g = m.geometry.clone();
      g.applyMatrix4(m.matrixWorld);
      m.geometry = g;
      m.position.set(0, 0, 0);
      m.quaternion.identity();
      m.scale.set(1, 1, 1);
      m.matrixAutoUpdate = true;
      m.castShadow = true;
      m.receiveShadow = true;
      m.material = (m.material as THREE.Material).clone();
      group.add(m);
      if (m.name === BODY_MESH) bodyMesh = m;
    }
    group.updateMatrixWorld(true);
    const s = new THREE.Vector3();
    bm.decompose(new THREE.Vector3(), new THREE.Quaternion(), s);
    return { flat: group, body: bodyMesh as THREE.Mesh | null, bodyMatrix: bm, scaleK: s.x || 1 };
  }, [scene]);

  const color = FABRIC_HEX[spec.hoodieColor];
  useMemo(() => {
    flat.traverse((o) => {
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
  }, [flat, color]);

  // Build a conforming DecalGeometry per graphic, in the baked (clean) space.
  const decals = useMemo(() => {
    if (!body) return [];
    const out: { key: string; file: string; geo: THREE.BufferGeometry }[] = [];
    const make = (file: string, zone: GlbZone, key: string) => {
      try {
        const point = new THREE.Vector3(...zone.position).applyMatrix4(bodyMatrix);
        const normal = new THREE.Vector3(...zone.normal).transformDirection(bodyMatrix);
        const size = new THREE.Vector3(zone.scale * scaleK, zone.scale * scaleK, DEPTH);
        const geo = new DecalGeometry(body, point, tangentEuler(normal), size);
        if (geo.attributes.position && geo.attributes.position.count > 0) out.push({ key, file, geo });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('DECAL_FAIL', key, (e as Error).message);
      }
    };
    const back = backById(spec.backGraphic.id);
    if (back) make(back.file, ZONE_GLB[spec.backGraphic.zone], `back-${back.id}`);
    for (const p of spec.patches) {
      const g = placementById(p.id);
      const zone = ZONE_GLB[p.zone];
      if (g && zone) make(g.file, zone, `${p.zone}-${g.id}`);
    }
    return out;
  }, [spec, body, bodyMatrix, scaleK]);

  return (
    <group>
      <primitive object={flat} />
      {decals.map((d) => (
        <DecalMesh key={d.key} geometry={d.geo} file={d.file} />
      ))}
    </group>
  );
}

useGLTF.preload(MODEL);

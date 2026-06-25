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
// Shallow projector depth (world units) conforms to the local surface curve
// only, so a back logo can't punch through a thin layer (hood) to the front.
const DEPTH = 0.08;

// Interior occluder = a copy of the body shrunk toward its centroid (mostly in
// DEPTH) so it sits just inside every outer surface. It backs every opening
// (zipper slit, hood face-hole) with opaque fabric, so a back-panel logo can
// never be seen from the front. Because it stays strictly inside the outer
// shell, it's hidden from every exterior angle. Being inset in depth, it
// always sits IN FRONT of the back logos from the cavity side but BEHIND them
// from the back, so the back graphics still read cleanly from behind.
const SHELL_SCALE: [number, number, number] = [0.9, 1.0, 0.68];

/** Tangent-frame Euler from a surface normal: local +z = outward normal
 *  (projection axis), local +y = world-up projected onto the tangent plane.
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
  // mesh all share one coordinate frame: no double-transform, no floating.
  const { flat, body } = useMemo(() => {
    const c = scene.clone(true);
    c.updateMatrixWorld(true);
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
    return { flat: group, body: bodyMesh as THREE.Mesh | null };
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
      // DecalGeometry reads body.matrixWorld; once mounted that includes the
      // viewer's scale/rotation. Force identity so the decal is always built in
      // the baked space the body's geometry already lives in.
      const saved = body.matrixWorld.clone();
      body.matrixWorld.identity();
      try {
        const point = new THREE.Vector3(...zone.position);
        const normal = new THREE.Vector3(...zone.normal).normalize();
        const size = new THREE.Vector3(zone.scale, zone.scale, zone.depth ?? DEPTH);
        const geo = new DecalGeometry(body, point, tangentEuler(normal), size);
        if (geo.attributes.position && geo.attributes.position.count > 0) out.push({ key, file, geo });
      } catch {
        // a single bad projection should never break the whole scene
      } finally {
        body.matrixWorld.copy(saved);
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
  }, [spec, body]);

  // Interior colour reads slightly darker than the outer fabric (it's in shadow
  // inside the garment), which keeps openings looking like a real inner lining.
  const innerColor = useMemo(() => new THREE.Color(color).multiplyScalar(0.7), [color]);

  // Inner-shell occluder: clone the body geometry and scale it about its own
  // centroid. Rendered scaled-down it hugs the inside of the garment.
  const shell = useMemo(() => {
    if (!body) return null;
    const geo = body.geometry.clone();
    geo.computeBoundingBox();
    const c = new THREE.Vector3();
    geo.boundingBox!.getCenter(c);
    const [sx, sy, sz] = SHELL_SCALE;
    // position offset so the scale pivots about the centroid: p·S + offset = c at p=c
    const offset: [number, number, number] = [c.x * (1 - sx), c.y * (1 - sy), c.z * (1 - sz)];
    return { geo, offset };
  }, [body]);

  return (
    <group>
      <primitive object={flat} />
      {shell && (
        <mesh geometry={shell.geo} position={shell.offset} scale={SHELL_SCALE} renderOrder={0}>
          <meshStandardMaterial color={innerColor} roughness={1} metalness={0} side={THREE.DoubleSide} />
        </mesh>
      )}
      {decals.map((d) => (
        <DecalMesh key={d.key} geometry={d.geo} file={d.file} />
      ))}
    </group>
  );
}

useGLTF.preload(MODEL);

'use client';

import { RoundedBox, Decal, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { DesignSpec } from '@/lib/catalog/types';
import { FABRIC_HEX } from '@/lib/catalog/hoodie-colors';
import { backById, placementById } from '@/lib/catalog';
import { ZONE_3D, type DecalMesh, type ZoneTransform } from '@/lib/three/zone-transforms';

interface ResolvedDecal {
  key: string;
  file: string;
  mesh: DecalMesh;
  t: ZoneTransform;
}

function resolveDecals(spec: DesignSpec): ResolvedDecal[] {
  const out: ResolvedDecal[] = [];
  const back = backById(spec.backGraphic.id);
  if (back) {
    const t = ZONE_3D[spec.backGraphic.zone];
    out.push({ key: `back-${back.id}`, file: back.file, mesh: t.mesh, t });
  }
  for (const p of spec.patches) {
    const g = placementById(p.id);
    const t = ZONE_3D[p.zone];
    if (g && t) out.push({ key: `${p.zone}-${g.id}`, file: g.file, mesh: t.mesh, t });
  }
  return out;
}

function GraphicDecal({ file, t }: { file: string; t: ZoneTransform }) {
  const tex = useTexture(file) as THREE.Texture;
  // Configure the texture via R3F prop-piercing (no mutation of the hook value).
  return (
    <Decal position={t.position} rotation={t.rotation} scale={t.scale}>
      <meshStandardMaterial
        map={tex}
        map-colorSpace={THREE.SRGBColorSpace}
        map-anisotropy={8}
        transparent
        roughness={0.7}
        polygonOffset
        polygonOffsetFactor={-4}
        depthTest
      />
    </Decal>
  );
}

/** Procedural, swappable pullover-hoodie mesh. Decals are grouped onto the
 *  body / sleeve sub-meshes per ZONE_3D. Replace with a GLB later by swapping
 *  this component while keeping ZONE_3D. */
export function Hoodie({ spec }: { spec: DesignSpec }) {
  const color = FABRIC_HEX[spec.hoodieColor];
  const decals = resolveDecals(spec);
  const on = (m: DecalMesh) => decals.filter((d) => d.mesh === m);
  const fabric = { color, roughness: 0.94, metalness: 0.02 } as const;

  return (
    <group>
      {/* torso */}
      <RoundedBox args={[1.5, 1.9, 0.7]} radius={0.2} smoothness={5} castShadow receiveShadow>
        <meshStandardMaterial {...fabric} />
        {on('body').map((d) => (
          <GraphicDecal key={d.key} file={d.file} t={d.t} />
        ))}
      </RoundedBox>

      {/* hood */}
      <mesh position={[0, 1.04, -0.18]} rotation={[0.55, 0, 0]} castShadow>
        <sphereGeometry args={[0.47, 32, 24, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
        <meshStandardMaterial {...fabric} side={THREE.DoubleSide} />
      </mesh>

      {/* collar / neck rib */}
      <mesh position={[0, 0.92, 0.0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.34, 0.075, 16, 40]} />
        <meshStandardMaterial {...fabric} roughness={0.99} />
      </mesh>

      {/* left sleeve */}
      <group position={[-0.92, 0.18, 0]} rotation={[0, 0, 0.3]}>
        <RoundedBox args={[0.44, 1.5, 0.46]} radius={0.16} smoothness={4} castShadow>
          <meshStandardMaterial {...fabric} />
          {on('leftSleeve').map((d) => (
            <GraphicDecal key={d.key} file={d.file} t={d.t} />
          ))}
        </RoundedBox>
        {/* cuff */}
        <mesh position={[0, -0.82, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.2, 0.06, 12, 28]} />
          <meshStandardMaterial {...fabric} roughness={0.99} />
        </mesh>
      </group>

      {/* right sleeve */}
      <group position={[0.92, 0.18, 0]} rotation={[0, 0, -0.3]}>
        <RoundedBox args={[0.44, 1.5, 0.46]} radius={0.16} smoothness={4} castShadow>
          <meshStandardMaterial {...fabric} />
          {on('rightSleeve').map((d) => (
            <GraphicDecal key={d.key} file={d.file} t={d.t} />
          ))}
        </RoundedBox>
        <mesh position={[0, -0.82, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.2, 0.06, 12, 28]} />
          <meshStandardMaterial {...fabric} roughness={0.99} />
        </mesh>
      </group>

      {/* kangaroo pocket */}
      <RoundedBox
        args={[0.92, 0.46, 0.14]}
        radius={0.06}
        smoothness={4}
        position={[0, -0.52, 0.34]}
        castShadow
      >
        <meshStandardMaterial {...fabric} />
      </RoundedBox>

      {/* waist rib */}
      <mesh position={[0, -0.96, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.76, 0.76, 0.12, 40, 1, true]} />
        <meshStandardMaterial {...fabric} roughness={0.99} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Center, Environment, Lightformer } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';
import type { DesignSpec } from '@/lib/catalog/types';
import { HoodieGLB } from './HoodieGLB';

/** The hoodie on a turntable. We spin/orient the GROUP (camera stays fixed at
 *  the front) so the angle buttons are deterministic. "Back" always shows the
 *  back regardless of where a prior auto-spin left things. Rotating the outer
 *  group (not the Centered child) keeps <Center> from re-measuring every frame. */
function Turntable({ spec, autoRotate, spinY }: { spec: DesignSpec; autoRotate: boolean; spinY: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;
    if (autoRotate) g.rotation.y += delta * 0.5;
    else g.rotation.y = spinY;
  });
  return (
    <group ref={ref}>
      <Center>
        <group scale={2.2}>
          <HoodieGLB spec={spec} />
        </group>
      </Center>
    </group>
  );
}

/** Turntable viewer. A procedural studio Environment (Lightformers,
 *  no external HDRI) gives reflections + brand-blue/violet rim light that
 *  define the silhouette of even a black hoodie against the dark brand scene. */
export function HoodieViewer({
  spec,
  autoRotate = true,
  spinY = 0,
}: {
  spec: DesignSpec;
  autoRotate?: boolean;
  spinY?: number;
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0.2, 4.4], fov: 30 }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
    >
      <color attach="background" args={['#070811']} />
      <fog attach="fog" args={['#070811', 8, 14]} />
      <ambientLight intensity={0.45} />
      {/* neutral key light for soft form shadow + accurate colour */}
      <directionalLight
        position={[3.5, 6, 4]}
        intensity={2.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-4, 3, 2]} intensity={0.6} />

      <Suspense fallback={null}>
        <Turntable spec={spec} autoRotate={autoRotate} spinY={spinY} />

        {/* Studio env: bright neutral key + SUBTLE brand-coloured rim accents
            (kept low so the hoodie colour stays accurate). */}
        <Environment resolution={256} frames={1}>
          <Lightformer intensity={3.2} position={[0, 3, 4]} scale={[8, 8, 1]} color="#ffffff" />
          <Lightformer intensity={1.6} position={[0, 0, 5]} scale={[8, 8, 1]} color="#ffffff" />
          <Lightformer intensity={0.9} position={[-5, 1, -2]} scale={[2, 8, 1]} color="#2845E7" />
          <Lightformer intensity={0.7} position={[5, 1.5, -2]} scale={[2, 8, 1]} color="#7B5CFF" />
        </Environment>
      </Suspense>

      <ContactShadows
        position={[0, -1.62, 0]}
        opacity={0.6}
        scale={7}
        blur={2.8}
        far={3.4}
        color="#000000"
      />
      <OrbitControls
        enablePan={false}
        minDistance={2.8}
        maxDistance={6}
        minPolarAngle={Math.PI / 3.4}
        maxPolarAngle={Math.PI / 1.9}
      />
    </Canvas>
  );
}

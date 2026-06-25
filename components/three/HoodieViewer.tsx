'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Center, Environment, Lightformer } from '@react-three/drei';
import { Suspense } from 'react';
import type { DesignSpec } from '@/lib/catalog/types';
import { Hoodie } from './Hoodie';

/** Premium turntable viewer. A procedural studio Environment (Lightformers —
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
      <fog attach="fog" args={['#070811', 7, 13]} />
      <ambientLight intensity={0.18} />
      {/* key light for soft form shadow */}
      <directionalLight
        position={[3.5, 6, 4]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      />

      <Suspense fallback={null}>
        <Center>
          <group rotation={[0, spinY, 0]}>
            <Hoodie spec={spec} />
          </group>
        </Center>

        {/* Procedural studio env: bright key + coloured rim strips. */}
        <Environment resolution={256} frames={1}>
          <Lightformer intensity={2.2} position={[0, 3, 4]} scale={[7, 7, 1]} color="#ffffff" />
          <Lightformer intensity={2.6} position={[-5, 1, -2]} scale={[3, 9, 1]} color="#2845E7" />
          <Lightformer intensity={2.2} position={[5, 1.5, -2]} scale={[3, 9, 1]} color="#7B5CFF" />
          <Lightformer intensity={1.1} position={[0, -3, 3]} scale={[7, 4, 1]} color="#3a4a80" />
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
        autoRotate={autoRotate}
        autoRotateSpeed={1.3}
        enablePan={false}
        minDistance={2.8}
        maxDistance={6}
        minPolarAngle={Math.PI / 3.4}
        maxPolarAngle={Math.PI / 1.9}
      />
    </Canvas>
  );
}

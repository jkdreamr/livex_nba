'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Center } from '@react-three/drei';
import { Suspense } from 'react';
import type { DesignSpec } from '@/lib/catalog/types';
import { Hoodie } from './Hoodie';

/** Premium turntable viewer: dark brand background, three-point + brand-blue
 *  rim lighting, soft contact shadow, auto-rotating orbit. No external HDRI
 *  (reliable offline); fully client-side. */
export function HoodieViewer({
  spec,
  autoRotate = true,
}: {
  spec: DesignSpec;
  autoRotate?: boolean;
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0.25, 4.3], fov: 32 }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
    >
      <color attach="background" args={['#06070D']} />
      <hemisphereLight intensity={0.55} color="#aab4ff" groundColor="#0b0d14" />
      <ambientLight intensity={0.22} />
      <directionalLight
        position={[4, 6, 5]}
        intensity={2.3}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-6, 2.5, -3]} intensity={0.9} color="#2845E7" />
      <directionalLight position={[0, 1, -6]} intensity={0.55} color="#7B5CFF" />

      <Suspense fallback={null}>
        <Center>
          <Hoodie spec={spec} />
        </Center>
      </Suspense>

      <ContactShadows
        position={[0, -1.6, 0]}
        opacity={0.55}
        scale={7}
        blur={2.8}
        far={3.4}
        color="#000000"
      />
      <OrbitControls
        autoRotate={autoRotate}
        autoRotateSpeed={1.4}
        enablePan={false}
        minDistance={2.6}
        maxDistance={6}
        minPolarAngle={Math.PI / 3.5}
        maxPolarAngle={Math.PI / 1.9}
      />
    </Canvas>
  );
}

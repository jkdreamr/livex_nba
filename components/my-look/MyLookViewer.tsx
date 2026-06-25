'use client';

import { Canvas } from '@react-three/fiber';
import { Center, ContactShadows, Environment, Lightformer } from '@react-three/drei';
import { Suspense } from 'react';
import type { DesignSpec } from '@/lib/catalog/types';
import { HoodieGLB } from '@/components/three/HoodieGLB';

function TryOnModel({ spec }: { spec: DesignSpec }) {
  return (
    <Center>
      <group position={[0, -0.16, 0]} scale={2.34}>
        <HoodieGLB spec={spec} />
      </group>
    </Center>
  );
}

export function MyLookViewer({ spec }: { spec: DesignSpec }) {
  return (
    <Canvas camera={{ position: [0, 0.18, 5.35], fov: 30 }} shadows dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
      <color attach="background" args={['#05060b']} />
      <ambientLight intensity={0.38} />
      <directionalLight position={[1.8, 3.6, 2.4]} intensity={2.35} castShadow />
      <directionalLight position={[-2.2, 1.4, 2.2]} intensity={0.75} color="#d7ecff" />
      <Suspense fallback={null}>
        <Environment resolution={256}>
          <Lightformer intensity={1.6} position={[0, 3, 2]} scale={[4, 2, 1]} />
          <Lightformer intensity={0.75} position={[-3, 1, 2]} scale={[2, 4, 1]} />
        </Environment>
        <TryOnModel spec={spec} />
      </Suspense>
      <ContactShadows position={[0, -1.48, 0]} opacity={0.3} scale={3.6} blur={2.8} far={2.6} />
    </Canvas>
  );
}

export default MyLookViewer;

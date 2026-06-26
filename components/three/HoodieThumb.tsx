'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Center, Environment, Lightformer } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';
import type { DesignSpec } from '@/lib/catalog/types';
import { HoodieGLB } from './HoodieGLB';

function SpinModel({ spec }: { spec: DesignSpec }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.35;
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

/**
 * Lightweight comparison thumbnail — no shadows, dpr 1, a small single-frame
 * environment, and a gentle auto-spin. Three of these render side by side at the
 * reveal without the cost (shadow maps, high dpr, orbit controls) of the full
 * HoodieViewer.
 */
export function HoodieThumb({ spec }: { spec: DesignSpec }) {
  return (
    <Canvas dpr={1} camera={{ position: [0, 0.2, 4.6], fov: 30 }} gl={{ antialias: true }}>
      <color attach="background" args={['#0B0D14']} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[3.5, 6, 4]} intensity={2.2} />
      <directionalLight position={[-4, 3, 2]} intensity={0.55} />
      <Suspense fallback={null}>
        <SpinModel spec={spec} />
        <Environment resolution={128} frames={1}>
          <Lightformer intensity={3} position={[0, 3, 4]} scale={[8, 8, 1]} color="#ffffff" />
          <Lightformer intensity={1.4} position={[0, 0, 5]} scale={[8, 8, 1]} color="#ffffff" />
          <Lightformer intensity={0.8} position={[-5, 1, -2]} scale={[2, 8, 1]} color="#2845E7" />
        </Environment>
      </Suspense>
    </Canvas>
  );
}

'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';
import { scrollState } from '@/lib/landing/scroll-state';
import { poseAtProgress } from '@/lib/landing/acts';

const MODEL = '/models/lebron.glb';
const DEG = Math.PI / 180;

export function LebronModel({ onIntensity }: { onIntensity?: (v: number) => void }) {
  const { scene } = useGLTF(MODEL);
  const ref = useRef<THREE.Group>(null);
  const idle = useRef(0);

  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;
    const pose = poseAtProgress(scrollState.progress);
    idle.current += delta * 0.15; // gentle idle drift layered on the act rotation
    g.rotation.y = pose.rotationY * DEG + Math.sin(idle.current) * 0.03;
    g.position.set(pose.position[0], pose.position[1], pose.position[2]);
    g.scale.setScalar(pose.scale);
    onIntensity?.(pose.intensity);
  });

  return (
    <group ref={ref}>
      <Center>
        <primitive object={scene} />
      </Center>
    </group>
  );
}
useGLTF.preload(MODEL);

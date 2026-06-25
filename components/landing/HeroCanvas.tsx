'use client';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';
import { LebronModel } from './LebronModel';
import { LANDING_COLORS } from '@/lib/landing/design-tokens';

interface HeroCanvasProps {
  tier?: 'high' | 'low';
  reducedMotion?: boolean;
}

export function HeroCanvas({ tier = 'high' }: HeroCanvasProps) {
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const isLow = tier === 'low';
  return (
    <div className="fixed inset-0 -z-10" aria-hidden>
      <Canvas
        shadows
        dpr={isLow ? [1, 1.5] : [1, 2]}
        camera={{ position: [0, 0.2, 6], fov: 32 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={[LANDING_COLORS.void]} />
        <fog attach="fog" args={[LANDING_COLORS.void, 8, 18]} />
        <ambientLight intensity={0.25} />
        {/* blue arena key + gold rim */}
        <directionalLight ref={keyRef} position={[4, 6, 5]} intensity={2.6} color={LANDING_COLORS.brandGlow} castShadow shadow-mapSize={[2048, 2048]} />
        <directionalLight position={[-5, 3, -4]} intensity={1.4} color={LANDING_COLORS.gold} />
        {!isLow && (
          <spotLight position={[0, 8, 2]} angle={0.5} penumbra={1} intensity={2.0} color="#ffffff" />
        )}
        <Suspense fallback={null}>
          <LebronModel onIntensity={(v) => { if (keyRef.current) keyRef.current.intensity = 2.6 * v; }} />
          <Environment preset="city" />
        </Suspense>
        <ContactShadows position={[0, -1.6, 0]} opacity={0.55} scale={9} blur={3} far={4} color="#000000" />
        {!isLow && (
          <EffectComposer>
            <Bloom intensity={0.7} luminanceThreshold={0.7} luminanceSmoothing={0.3} mipmapBlur />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}

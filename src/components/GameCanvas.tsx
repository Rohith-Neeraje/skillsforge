import { Canvas } from '@react-three/fiber';
import { ReactNode, Suspense } from 'react';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

interface GameCanvasProps {
  children: ReactNode;
  onCreated?: () => void;
}

export default function GameCanvas({ children, onCreated }: GameCanvasProps) {
  return (
    <Canvas
      shadows
      camera={{ fov: 75, near: 0.1, far: 200, position: [0, 1.7, 0] }}
      dpr={[0.5, 1.5]}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        alpha: false,
        stencil: false,
        depth: true,
        toneMapping: 3, // ACESFilmic
        toneMappingExposure: 1.25,
      }}
      onCreated={onCreated}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <Bloom
            intensity={0.6}
            luminanceThreshold={0.85}
            luminanceSmoothing={0.08}
          />
        </EffectComposer>
      </Suspense>
      {children}
    </Canvas>
  );
}
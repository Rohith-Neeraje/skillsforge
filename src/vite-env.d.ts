/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

declare module '*.svg?react' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module '*.svg?import&react' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

// @react-three/fiber type stubs (fallback when bundled types don't resolve)
import type { ReactNode } from 'react';

declare module '@react-three/fiber' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ThreeElement<T = any> {
    children?: ReactNode;
    key?: React.Key;
    ref?: any;
    [key: string]: any;
  }

  interface ThreeElements {
    [element: string]: ThreeElement;
  }

  export const Canvas: React.FC<{
    children?: ReactNode;
    shadows?: boolean;
    camera?: Record<string, any>;
    dpr?: number | [number, number];
    gl?: Record<string, any>;
    onCreated?: (state: any) => void;
    style?: Record<string, any>;
    [key: string]: any;
  }>;

  export function useThree<T = any>(): T;
  export function useFrame(callback: (state: any, delta: number) => void, priority?: number): void;
  export function extend(objects: Record<string, any>): void;
  export function createRoot(canvas: HTMLCanvasElement): any;
  export type RootState = any;
}

// Three.js JSX intrinsic elements for use in R3F <Canvas>
// These augment the global JSX namespace so <mesh>, <group>, etc. are valid JSX.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      meshStandardMaterial: any;
      meshPhongMaterial: any;
      meshBasicMaterial: any;
      points: any;
      pointsMaterial: any;
      lineBasicMaterial: any;
      boxGeometry: any;
      planeGeometry: any;
      sphereGeometry: any;
      cylinderGeometry: any;
      ringGeometry: any;
      capsuleGeometry: any;
      bufferGeometry: any;
      bufferAttribute: any;
      ambientLight: any;
      directionalLight: any;
      hemisphereLight: any;
      spotLight: any;
      fog: any;
      gridHelper: any;
      primitive: any;
      octahedronGeometry: any;
      torusGeometry: any;
      coneGeometry: any;
    }
  }
}
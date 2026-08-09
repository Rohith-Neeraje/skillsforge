import type { ReactNode } from 'react';
declare module '@react-three/fiber' {
  export const Canvas: React.FC<{ children?: ReactNode; [key: string]: any }>;
  export function useThree<T = any>(): T;
  export function useFrame(callback: (state: any, delta: number) => void, priority?: number): void;
}
declare global { namespace JSX { interface IntrinsicElements { [element: string]: any } } }
export {};

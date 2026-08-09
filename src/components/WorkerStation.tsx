import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { LevelConfig } from '../types/challenge';
import type { ProximityLevel } from '../hooks/useProximity';

interface WorkerStationProps {
  config: LevelConfig;
  isCompleted: boolean;
  isUnlocked: boolean;
  isNearby: boolean;
  proximityLevel: ProximityLevel;
  playerDirection: THREE.Vector3;
}

export default function WorkerStation({
  config,
  isCompleted,
  isUnlocked,
  isNearby,
  proximityLevel,
  playerDirection,
}: WorkerStationProps) {
  const glowRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<number>(0);

  const glowColor = isCompleted ? '#00ff88' : isUnlocked ? config.stationColor : '#333355';
  const opacity = isUnlocked ? 1 : 0.3;

  useFrame((_: any, delta: number) => {
    pulseRef.current += delta;
    if (glowRef.current) {
      const pulse = Math.sin(pulseRef.current * 2) * 0.3 + 0.7;
      if (glowRef.current.material && !Array.isArray(glowRef.current.material)) {
        (glowRef.current.material as THREE.MeshBasicMaterial).opacity = pulse * 0.4 * opacity;
      }
    }
  });

  return (
    <group position={config.stationPosition}>
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <cylinderGeometry args={[1.2, 1.4, 0.3, 16]} />
        <meshStandardMaterial color="#0A0F1E" roughness={0.5} metalness={0.6} flatShading transparent opacity={opacity} />
      </mesh>
      <mesh ref={glowRef} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.3, 1.6, 32]} />
        <meshBasicMaterial color={glowColor} transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      <CharacterRouter
        characterType={config.characterType}
        color={config.stationColor}
        opacity={opacity}
        isCompleted={isCompleted}
        proximityLevel={proximityLevel}
        playerDirection={playerDirection}
      />

      <Html position={[0, 2.8, 0]} center>
        <div className="px-3 py-1 rounded-lg text-xs font-mono whitespace-nowrap"
          style={{
            background: isCompleted ? 'rgba(0,255,136,0.15)' : 'rgba(0,0,0,0.4)',
            border: `1px solid ${isCompleted ? '#00ff88' : glowColor}`,
            color: '#f0f0f0', backdropFilter: 'blur(4px)', opacity,
          }}>
          <div style={{ fontWeight: 600, fontSize: '10px', color: glowColor }}>{config.workerName}</div>
          <div style={{ fontSize: '8px', color: '#aabbcc' }}>{config.workerTitle}</div>
        </div>
      </Html>

      <Html position={[0, -0.8, 0]} center>
        <div className="px-2 py-0.5 rounded font-mono whitespace-nowrap text-center"
          style={{ color: glowColor, fontSize: '9px', opacity, textShadow: `0 0 4px ${glowColor}` }}>
          {config.title}
        </div>
      </Html>

      {isCompleted && (
        <mesh position={[0, 2.4, 0]}>
          <octahedronGeometry args={[0.1, 0]} />
          <meshBasicMaterial color="#00ff88" />
        </mesh>
      )}

      {isNearby && isUnlocked && (
        <Html position={[0, 3.2, 0]} center>
          <div className="px-4 py-2 rounded-lg animate-pulse text-center"
            style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${glowColor}`, color: glowColor, fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', backdropFilter: 'blur(8px)' }}>
            Press E to interact
          </div>
        </Html>
      )}

      {!isUnlocked && (
        <Html position={[0, 3.2, 0]} center>
          <div className="px-3 py-1 rounded-lg text-center"
            style={{ background: 'rgba(255,0,51,0.1)', border: '1px solid #ff0033', color: '#ff0033', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', backdropFilter: 'blur(4px)' }}>
            LOCKED
          </div>
        </Html>
      )}

      {proximityLevel !== 'none' && proximityLevel !== 'looking' && isUnlocked && (
        <ProximityRing level={proximityLevel} color={config.stationColor} />
      )}
    </group>
  );
}

/* ── Types ──────────────────────────────────── */
interface CharActorProps {
  characterType: string;
  color: string;
  opacity: number;
  isCompleted: boolean;
  proximityLevel: ProximityLevel;
  playerDirection: THREE.Vector3;
}

/* ── Character Router ──────────────────────── */
function CharacterRouter(props: CharActorProps) {
  switch (props.characterType) {
    case 'professional-f': return <PriyaCharacter {...props} />;
    case 'analyst-m':     return <RajCharacter {...props} />;
    case 'creative-f':    return <MayaCharacter {...props} />;
    case 'executive-m':   return <AlexCharacter {...props} />;
    default:              return <PriyaCharacter {...props} />;
  }
}

/* =============================================
   Shared Animation Hook
   ============================================= */
function useCharacterAnimation(
  groupRef: React.RefObject<THREE.Group | null>,
  bodyRef: React.RefObject<THREE.Group | null>,
  headRef: React.RefObject<THREE.Group | null>,
  leftArmRef: React.RefObject<THREE.Group | null>,
  rightArmRef: React.RefObject<THREE.Group | null>,
  leftLegRef: React.RefObject<THREE.Group | null>,
  rightLegRef: React.RefObject<THREE.Group | null>,
  proximityLevel: ProximityLevel,
  playerDirection: THREE.Vector3,
) {
  const t = useRef(0);
  const w = useRef(0);

  useFrame((_, delta) => {
    t.current += delta;
    const grp = groupRef.current;
    if (!grp) return;

    // + Math.PI so characters face TOWARDS the player instead of away
    const angle = Math.atan2(playerDirection.x, playerDirection.z) + Math.PI;
    const react = proximityLevel !== 'none';

    if (react) {
      grp.rotation.y += (angle - grp.rotation.y) * 0.15;
    } else {
      grp.rotation.y = Math.sin(t.current * 0.15) * 0.08;
    }

    const spd = react ? 2.0 : 1.5;
    const amp = proximityLevel === 'interacting' ? 0.05 : 0.03;
    grp.position.y = Math.sin(t.current * spd) * amp;

    if (bodyRef.current) {
      bodyRef.current.rotation.x = react ? -0.03 : 0;
      if (!react) bodyRef.current.rotation.y = Math.sin(t.current * 0.4) * 0.1;
    }

    if (headRef.current) {
      if (proximityLevel === 'looking' || proximityLevel === 'waving') {
        headRef.current.rotation.x = -0.05;
        headRef.current.rotation.z = Math.sin(t.current * 0.8) * 0.04;
      } else if (proximityLevel === 'interacting') {
        headRef.current.rotation.x = -0.08;
        headRef.current.rotation.z = 0;
      } else {
        headRef.current.rotation.z = Math.sin(t.current * 0.3) * 0.02;
        headRef.current.rotation.x = 0;
      }
    }

    if (leftArmRef.current && rightArmRef.current) {
      if (proximityLevel === 'waving' || proximityLevel === 'interacting') {
        w.current += delta * 4;
        rightArmRef.current.rotation.x = -1.2 + Math.sin(w.current) * 0.4;
        rightArmRef.current.rotation.z = -0.2;
        leftArmRef.current.rotation.x = 0.2 + Math.sin(t.current * 1.5) * 0.1;
        if (proximityLevel === 'interacting') {
          rightArmRef.current.rotation.x = -1.4 + Math.sin(w.current * 1.3) * 0.3;
        }
      } else if (proximityLevel === 'looking') {
        leftArmRef.current.rotation.x = Math.sin(t.current * 1.2) * 0.15 - 0.05;
        rightArmRef.current.rotation.x = Math.sin(t.current * 1.2 + Math.PI) * 0.15 + 0.05;
      } else {
        leftArmRef.current.rotation.x = Math.sin(t.current * 1.2) * 0.15 - 0.1;
        rightArmRef.current.rotation.x = Math.sin(t.current * 1.2 + Math.PI) * 0.15 + 0.1;
      }
    }

    if (leftLegRef.current && rightLegRef.current) {
      if (proximityLevel === 'interacting') {
        leftLegRef.current.rotation.x = Math.sin(t.current * 2.0) * 0.06;
        rightLegRef.current.rotation.x = Math.sin(t.current * 2.0 + Math.PI) * 0.06;
      } else {
        leftLegRef.current.rotation.x = Math.sin(t.current * 1.0) * 0.03;
        rightLegRef.current.rotation.x = Math.sin(t.current * 1.0 + Math.PI) * 0.03;
      }
    }
  });
}

/* ── Shared Sub-components ─────────────────── */

function Eyes({ opacity, z = 0.11 }: { opacity: number; z?: number }) {
  return (<>{[-0.06, 0.06].map(x => (
    <group key={x}>
      <mesh position={[x, 0.04, z]}>
        <boxGeometry args={[0.04, 0.04, 0.02]} />
        <meshBasicMaterial color={WHT} transparent opacity={opacity * 0.9} />
      </mesh>
      <mesh position={[x, 0.04, z + 0.02]}>
        <boxGeometry args={[0.02, 0.02, 0.01]} />
        <meshBasicMaterial color={BLK} transparent opacity={opacity * 0.9} />
      </mesh>
    </group>
  ))}</>);
}

function Mouth({ opacity }: { opacity: number }) {
  return (
    <mesh position={[0, -0.04, 0.11]}>
      <boxGeometry args={[0.06, 0.01, 0.01]} />
      <meshBasicMaterial color={BLK} transparent opacity={opacity * 0.7} />
    </mesh>
  );
}

function VoxelHead({ opacity, headRef, children }: {
  opacity: number;
  headRef: React.RefObject<THREE.Group | null>;
  children?: React.ReactNode;
}) {
  return (
    <group ref={headRef} position={[0, 0.5, 0]}>
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.22, 0.22, 0.2]} />
        <meshStandardMaterial color={SKIN} roughness={0.6} flatShading transparent opacity={opacity} />
      </mesh>
      <Eyes opacity={opacity} />
      <Mouth opacity={opacity} />
      {children}
    </group>
  );
}

function VoxelLegs({ opacity, leftRef, rightRef, color, w = 0.12, h = 0.25 }: {
  opacity: number;
  leftRef: React.RefObject<THREE.Group | null>;
  rightRef: React.RefObject<THREE.Group | null>;
  color: THREE.Color;
  w?: number; h?: number;
}) {
  const Leg = ({ elRef, x }: { elRef: React.RefObject<THREE.Group | null>; x: number }) => (
    <group ref={elRef} position={[x, -0.15, 0]}>
      <mesh position={[0, -0.2, 0]} castShadow>
        <boxGeometry args={[w, h, 0.12]} />
        <meshStandardMaterial color={color} roughness={0.8} flatShading transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, -0.38, 0.02]} castShadow>
        <boxGeometry args={[w + 0.02, 0.12, 0.18]} />
        <meshStandardMaterial color={BOT} roughness={0.9} flatShading transparent opacity={opacity} />
      </mesh>
    </group>
  );
  return (<><Leg elRef={leftRef} x={-0.12} /><Leg elRef={rightRef} x={0.12} /></>);
}

function VoxelArms({ opacity, leftRef, rightRef, shirtColor, w = 0.1, len = 0.25, shoulder = 0.22 }: {
  opacity: number;
  leftRef: React.RefObject<THREE.Group | null>;
  rightRef: React.RefObject<THREE.Group | null>;
  shirtColor: THREE.Color;
  w?: number; len?: number; shoulder?: number;
}) {
  const Arm = ({ elRef, x }: { elRef: React.RefObject<THREE.Group | null>; x: number }) => (
    <group ref={elRef} position={[x, 0.3, 0]}>
      <mesh position={[0, -0.15, 0]} castShadow>
        <boxGeometry args={[w, len, w]} />
        <meshStandardMaterial color={SKIN} roughness={0.7} flatShading transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[w + 0.01, 0.08, w]} />
        <meshStandardMaterial color={shirtColor} roughness={0.7} flatShading transparent opacity={opacity} />
      </mesh>
    </group>
  );
  return (<><Arm elRef={leftRef} x={-shoulder} /><Arm elRef={rightRef} x={shoulder} /></>);
}

/* ══════════════════════════════════════════════════
   PRIYA — Female Professional (Customer Support Lead)
   Dark tech-leather bodysuit + cyan accent highlights
   ============================================= */
function PriyaCharacter({ color, opacity, isCompleted, proximityLevel, playerDirection }: CharActorProps) {
  const g = useRef<THREE.Group>(null!);
  const b = useRef<THREE.Group>(null!);
  const h = useRef<THREE.Group>(null!);
  const la = useRef<THREE.Group>(null!);
  const ra = useRef<THREE.Group>(null!);
  const ll = useRef<THREE.Group>(null!);
  const rl = useRef<THREE.Group>(null!);
  useCharacterAnimation(g, b, h, la, ra, ll, rl, proximityLevel, playerDirection);

  const acc = new THREE.Color(color);
  const bodySuit = new THREE.Color('#0F1A2E');
  const armor = new THREE.Color('#1A2A44');

  return (
    <group ref={g} position={[0, 0.89, 0]} scale={1.5}>
      <VoxelLegs opacity={opacity} leftRef={ll} rightRef={rl} color={bodySuit} w={0.11} h={0.2} />
      <group ref={b} position={[0, 0, 0]}>
        <mesh position={[0, 0.08, 0]} castShadow><boxGeometry args={[0.28, 0.12, 0.16]} /><meshStandardMaterial color={bodySuit} roughness={0.6} metalness={0.3} flatShading transparent opacity={opacity} /></mesh>
        <mesh position={[0, 0.22, 0]} castShadow><boxGeometry args={[0.24, 0.18, 0.16]} /><meshStandardMaterial color={armor} roughness={0.5} metalness={0.5} flatShading transparent opacity={opacity} /></mesh>
        <mesh position={[0, 0.25, 0.02]} castShadow><boxGeometry args={[0.26, 0.2, 0.17]} /><meshStandardMaterial color={armor} roughness={0.5} metalness={0.5} flatShading transparent opacity={opacity} /></mesh>
        {[-0.08, 0.08].map(x => (
          <mesh key={x} position={[x, 0.22, 0.1]}><boxGeometry args={[0.06, 0.12, 0.02]} /><meshBasicMaterial color={acc} transparent opacity={opacity * 0.7} /></mesh>
        ))}
        <mesh position={[0, 0.34, 0.09]}><boxGeometry args={[0.16, 0.05, 0.03]} /><meshBasicMaterial color={acc} transparent opacity={opacity * 0.8} /></mesh>
        <VoxelArms opacity={opacity} leftRef={la} rightRef={ra} shirtColor={armor} w={0.08} len={0.22} shoulder={0.2} />
      </group>
      <VoxelHead opacity={opacity} headRef={h}>
        <mesh position={[0, 0.2, 0.04]} castShadow><boxGeometry args={[0.18, 0.06, 0.16]} /><meshStandardMaterial color={HAIR1} roughness={0.9} flatShading transparent opacity={opacity} /></mesh>
        <mesh position={[0, 0.12, -0.02]} castShadow><boxGeometry args={[0.26, 0.1, 0.2]} /><meshStandardMaterial color={HAIR1} roughness={0.9} flatShading transparent opacity={opacity} /></mesh>
        {[-0.13, 0.13].map(x => (
          <mesh key={x} position={[x, 0.04, 0]}><boxGeometry args={[0.04, 0.14, 0.04]} /><meshStandardMaterial color={HAIR1} roughness={0.9} flatShading transparent opacity={opacity} /></mesh>
        ))}
        {[-0.12, 0.12].map(x => (
          <mesh key={x} position={[x, 0, 0.02]}><sphereGeometry args={[0.015, 6, 6]} /><meshBasicMaterial color={acc} transparent opacity={opacity * 0.8} /></mesh>
        ))}
      </VoxelHead>
      {isCompleted && <OrbitAura />}
      {proximityLevel === 'waving' && !isCompleted && <EM color={color} />}
      {proximityLevel === 'interacting' && !isCompleted && <EM color={color} urgent />}
    </group>
  );
}

/* =============================================
   RAJ — Male Data Analyst
   Dark coat + harness + cargo pants, sci-fi visor
   ============================================= */
function RajCharacter({ color, opacity, isCompleted, proximityLevel, playerDirection }: CharActorProps) {
  const g = useRef<THREE.Group>(null!);
  const b = useRef<THREE.Group>(null!);
  const h = useRef<THREE.Group>(null!);
  const la = useRef<THREE.Group>(null!);
  const ra = useRef<THREE.Group>(null!);
  const ll = useRef<THREE.Group>(null!);
  const rl = useRef<THREE.Group>(null!);
  useCharacterAnimation(g, b, h, la, ra, ll, rl, proximityLevel, playerDirection);

  const acc = new THREE.Color(color);
  const underLayer = new THREE.Color('#0F1A2E');
  const coat = new THREE.Color('#1A2038');
  const pants = new THREE.Color('#141B30');

  return (
    <group ref={g} position={[0, 0.89, 0]} scale={1.5}>
      <VoxelLegs opacity={opacity} leftRef={ll} rightRef={rl} color={pants} w={0.13} />
      <group ref={b} position={[0, 0, 0]}>
        <mesh position={[0, 0.2, 0]} castShadow><boxGeometry args={[0.32, 0.35, 0.18]} /><meshStandardMaterial color={underLayer} roughness={0.6} metalness={0.3} flatShading transparent opacity={opacity} /></mesh>
        <mesh position={[0, 0.2, 0.02]} castShadow><boxGeometry args={[0.3, 0.26, 0.16]} /><meshStandardMaterial color={coat} roughness={0.5} metalness={0.5} flatShading transparent opacity={opacity} /></mesh>
        {[0.28, 0.2, 0.12].map(y => (
          <mesh key={y} position={[0, y, 0.1]}><boxGeometry args={[0.01, 0.01, 0.02]} /><meshBasicMaterial color={acc} transparent opacity={opacity * 0.9} /></mesh>
        ))}
        {[-0.06, 0.06].map(x => (
          <mesh key={x} position={[x, 0.38, 0.06]}><boxGeometry args={[0.04, 0.04, 0.02]} /><meshStandardMaterial color={underLayer} roughness={0.6} metalness={0.3} flatShading transparent opacity={opacity} /></mesh>
        ))}
        <mesh position={[0.12, 0.36, 0.1]}><boxGeometry args={[0.04, 0.05, 0.02]} /><meshBasicMaterial color={acc} transparent opacity={opacity * 0.8} /></mesh>
        <mesh position={[0, 0.02, 0]}><boxGeometry args={[0.3, 0.03, 0.16]} /><meshStandardMaterial color="#0A0A1A" roughness={0.8} metalness={0.2} flatShading transparent opacity={opacity} /></mesh>
        <VoxelArms opacity={opacity} leftRef={la} rightRef={ra} shirtColor={underLayer} w={0.11} len={0.26} shoulder={0.24} />
      </group>
      <VoxelHead opacity={opacity} headRef={h}>
        <mesh position={[0, 0.14, 0]} castShadow><boxGeometry args={[0.24, 0.08, 0.22]} /><meshStandardMaterial color={HAIR2} roughness={0.9} flatShading transparent opacity={opacity} /></mesh>
        <mesh position={[0, 0.19, 0.04]} castShadow><boxGeometry args={[0.1, 0.04, 0.1]} /><meshStandardMaterial color={HAIR2} roughness={0.9} flatShading transparent opacity={opacity} /></mesh>
        {[-0.08, 0.08].map(x => (
          <mesh key={x} position={[x, 0.04, 0.12]}><boxGeometry args={[0.06, 0.04, 0.01]} /><meshBasicMaterial color={acc} transparent opacity={opacity * 0.6} /></mesh>
        ))}
        <mesh position={[0, 0.04, 0.12]}><boxGeometry args={[0.06, 0.01, 0.01]} /><meshBasicMaterial color={acc} transparent opacity={opacity * 0.6} /></mesh>
      </VoxelHead>
      {isCompleted && <OrbitAura />}
      {proximityLevel === 'waving' && !isCompleted && <EM color={color} />}
      {proximityLevel === 'interacting' && !isCompleted && <EM color={color} urgent />}
    </group>
  );
}

/* =============================================
   MAYA — Female Creative (Brand Copywriter)
   Indigo tech-wrap + holographic accents, side-swept hair
   ============================================= */
function MayaCharacter({ color, opacity, isCompleted, proximityLevel, playerDirection }: CharActorProps) {
  const g = useRef<THREE.Group>(null!);
  const b = useRef<THREE.Group>(null!);
  const h = useRef<THREE.Group>(null!);
  const la = useRef<THREE.Group>(null!);
  const ra = useRef<THREE.Group>(null!);
  const ll = useRef<THREE.Group>(null!);
  const rl = useRef<THREE.Group>(null!);
  useCharacterAnimation(g, b, h, la, ra, ll, rl, proximityLevel, playerDirection);

  const acc = new THREE.Color(color);
  const wrapColor = new THREE.Color('#151A2E');
  const panelColor = acc.clone().multiplyScalar(0.5);

  return (
    <group ref={g} position={[0, 0.89, 0]} scale={1.5}>
      <VoxelLegs opacity={opacity} leftRef={ll} rightRef={rl} color={wrapColor} w={0.11} h={0.2} />
      <group ref={b} position={[0, 0, 0]}>
        <mesh position={[0, 0.08, 0]} castShadow><boxGeometry args={[0.28, 0.12, 0.16]} /><meshStandardMaterial color={wrapColor} roughness={0.5} metalness={0.4} flatShading transparent opacity={opacity} /></mesh>
        <mesh position={[0, 0.22, 0]} castShadow><boxGeometry args={[0.26, 0.18, 0.16]} /><meshStandardMaterial color={wrapColor} roughness={0.5} metalness={0.4} flatShading transparent opacity={opacity} /></mesh>
        <mesh position={[0, 0.15, 0.08]}><boxGeometry args={[0.2, 0.12, 0.02]} /><meshBasicMaterial color={panelColor} transparent opacity={opacity * 0.8} /></mesh>
        <mesh position={[0, 0.34, 0.08]}><boxGeometry args={[0.14, 0.04, 0.02]} /><meshBasicMaterial color={acc} transparent opacity={opacity * 0.7} /></mesh>
        <VoxelArms opacity={opacity} leftRef={la} rightRef={ra} shirtColor={wrapColor} w={0.08} len={0.22} shoulder={0.2} />
      </group>
      <VoxelHead opacity={opacity} headRef={h}>
        <mesh position={[0, 0.13, -0.02]} castShadow><boxGeometry args={[0.26, 0.1, 0.2]} /><meshStandardMaterial color={HAIR3} roughness={0.9} flatShading transparent opacity={opacity} /></mesh>
        <mesh position={[0, 0.18, 0.04]} castShadow><boxGeometry args={[0.22, 0.08, 0.18]} /><meshStandardMaterial color={HAIR3} roughness={0.9} flatShading transparent opacity={opacity} /></mesh>
        <mesh position={[-0.08, 0.14, 0.12]}><boxGeometry args={[0.1, 0.08, 0.04]} /><meshStandardMaterial color={HAIR3} roughness={0.9} flatShading transparent opacity={opacity} /></mesh>
        {[-0.14, 0.14].map(x => (
          <mesh key={x} position={[x, -0.02, 0]}><boxGeometry args={[0.04, 0.16, 0.04]} /><meshStandardMaterial color={HAIR3} roughness={0.9} flatShading transparent opacity={opacity} /></mesh>
        ))}
        {[-0.12, 0.12].map(x => (
          <mesh key={x} position={[x, 0, 0.02]}><torusGeometry args={[0.02, 0.006, 6, 12]} /><meshBasicMaterial color={acc} transparent opacity={opacity * 0.9} /></mesh>
        ))}
        <mesh position={[0.1, 0.16, 0.04]}><boxGeometry args={[0.03, 0.02, 0.02]} /><meshBasicMaterial color={acc} transparent opacity={opacity * 0.8} /></mesh>
      </VoxelHead>
      {isCompleted && <OrbitAura />}
      {proximityLevel === 'waving' && !isCompleted && <EM color={color} />}
      {proximityLevel === 'interacting' && !isCompleted && <EM color={color} urgent />}
    </group>
  );
}

/* =============================================
   ALEX — Male Executive (HR Director / Boss)
   Dark navy commander coat + gold accent panels, slicked-back
   ============================================= */
function AlexCharacter({ color, opacity, isCompleted, proximityLevel, playerDirection }: CharActorProps) {
  const g = useRef<THREE.Group>(null!);
  const b = useRef<THREE.Group>(null!);
  const h = useRef<THREE.Group>(null!);
  const la = useRef<THREE.Group>(null!);
  const ra = useRef<THREE.Group>(null!);
  const ll = useRef<THREE.Group>(null!);
  const rl = useRef<THREE.Group>(null!);
  useCharacterAnimation(g, b, h, la, ra, ll, rl, proximityLevel, playerDirection);

  const acc = new THREE.Color(color);
  const coatColor = new THREE.Color('#0A0F1E');
  const underColor = new THREE.Color('#141B30');

  return (
    <group ref={g} position={[0, 0.89, 0]} scale={1.5}>
      <VoxelLegs opacity={opacity} leftRef={ll} rightRef={rl} color={coatColor} w={0.13} />
      <group ref={b} position={[0, 0, 0]}>
        <mesh position={[0, 0.2, 0]} castShadow><boxGeometry args={[0.32, 0.35, 0.18]} /><meshStandardMaterial color={coatColor} roughness={0.4} metalness={0.6} flatShading transparent opacity={opacity} /></mesh>
        <mesh position={[0, 0.2, 0.04]} castShadow><boxGeometry args={[0.3, 0.26, 0.14]} /><meshStandardMaterial color={coatColor} roughness={0.4} metalness={0.6} flatShading transparent opacity={opacity} /></mesh>
        <mesh position={[0, 0.32, 0.1]}><boxGeometry args={[0.04, 0.06, 0.02]} /><meshBasicMaterial color={underColor} transparent opacity={opacity * 0.8} /></mesh>
        <mesh position={[0, 0.28, 0.11]}><boxGeometry args={[0.06, 0.1, 0.02]} /><meshBasicMaterial color={acc} transparent opacity={opacity * 0.9} /></mesh>
        <mesh position={[0, 0.32, 0.11]}><boxGeometry args={[0.07, 0.02, 0.02]} /><meshBasicMaterial color={acc} transparent opacity={opacity * 0.9} /></mesh>
        {[-0.08, 0.08].map(x => (
          <mesh key={x} position={[x, 0.37, 0.06]}><boxGeometry args={[0.04, 0.04, 0.02]} /><meshStandardMaterial color={underColor} roughness={0.5} metalness={0.4} flatShading transparent opacity={opacity} /></mesh>
        ))}
        <VoxelArms opacity={opacity} leftRef={la} rightRef={ra} shirtColor={underColor} w={0.11} len={0.26} shoulder={0.24} />
      </group>
      <VoxelHead opacity={opacity} headRef={h}>
        <mesh position={[0, 0.14, 0]} castShadow><boxGeometry args={[0.24, 0.08, 0.22]} /><meshStandardMaterial color={HAIR2} roughness={0.9} flatShading transparent opacity={opacity} /></mesh>
        <mesh position={[0, 0.18, 0.04]} castShadow><boxGeometry args={[0.2, 0.04, 0.14]} /><meshStandardMaterial color={HAIR2} roughness={0.9} flatShading transparent opacity={opacity} /></mesh>
        {[-0.04, 0.04].map(x => (
          <mesh key={x} position={[x, 0.08, 0.12]}><boxGeometry args={[0.03, 0.02, 0.02]} /><meshBasicMaterial color={acc} transparent opacity={opacity * 0.6} /></mesh>
        ))}
      </VoxelHead>
      {isCompleted && <OrbitAura />}
      {proximityLevel === 'waving' && !isCompleted && <EM color={color} />}
      {proximityLevel === 'interacting' && !isCompleted && <EM color={color} urgent />}
    </group>
  );
}

/* ── Proximity Ring ─────────────────────────── */
function ProximityRing({ level, color }: { level: ProximityLevel; color: string }) {
  const ref = useRef<THREE.Mesh>(null!);
  const timeRef = useRef(0);
  const targetScale = level === 'waving' ? 1.6 : 2.0;
  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!ref.current) return;
    const pulse = Math.sin(timeRef.current * 3) * 0.15 + 0.85;
    const s = targetScale * pulse;
    ref.current.scale.set(s, s, s);
    if (ref.current.material && !Array.isArray(ref.current.material)) {
      (ref.current.material as THREE.MeshBasicMaterial).opacity = (level === 'interacting' ? 0.3 : 0.15) * pulse;
    }
  });
  return (
    <mesh ref={ref} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.3, 0.5, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.2} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* ── Exclamation Mark ──────────────────────── */
function EM({ color, urgent = false }: { color: string; urgent?: boolean }) {
  const ref = useRef<THREE.Group>(null!);
  const timeRef = useRef(0);
  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!ref.current) return;
    ref.current.position.y = 0.5 + Math.sin(timeRef.current * 3) * 0.08;
    ref.current.scale.setScalar(1 + Math.sin(timeRef.current * 4) * 0.1);
  });
  const c = urgent ? '#ffcc00' : color;
  return (
    <group ref={ref} position={[0, 0.6, 0]}>
      <mesh position={[0, 0.12, 0]}><boxGeometry args={[0.04, 0.16, 0.04]} /><meshBasicMaterial color={c} transparent opacity={0.9} /></mesh>
      <mesh position={[0, -0.04, 0]}><boxGeometry args={[0.04, 0.04, 0.04]} /><meshBasicMaterial color={c} transparent opacity={0.9} /></mesh>
    </group>
  );
}

/* ── Orbit Aura ────────────────────────────── */
function OrbitAura() {
  return (
    <group>
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return <OrbitingDot key={i} angle={angle} radius={0.5} height={0.3 + Math.random() * 0.4} phase={Math.random() * 100} />;
      })}
    </group>
  );
}

function OrbitingDot({ angle, radius, height, phase }: { angle: number; radius: number; height: number; phase: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  const timeRef = useRef(phase);
  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!ref.current) return;
    const t = timeRef.current;
    ref.current.position.x = Math.cos(t * 0.8 + angle) * radius;
    ref.current.position.z = Math.sin(t * 0.8 + angle) * radius;
    ref.current.position.y = height + Math.sin(t * 1.2 + angle) * 0.1;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.02, 6, 6]} />
      <meshBasicMaterial color="#00ff88" transparent opacity={0.6} />
    </mesh>
  );
}

/* ── Color constants ───────────────────────── */
const SKIN = new THREE.Color('#ccaa88');
const WHT  = new THREE.Color('#ffffff');
const BLK  = new THREE.Color('#000000');
const BOT  = new THREE.Color('#080D1A');
const HAIR1 = new THREE.Color('#1a0a0a');
const HAIR2 = new THREE.Color('#2a1a0a');
const HAIR3 = new THREE.Color('#2a0a1a');
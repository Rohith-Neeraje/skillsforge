import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ────────────────────────────────────────────
// Station positions from challenges.ts
// ────────────────────────────────────────────
const STATION_POSITIONS: [number, number, number][] = [
  [-8, 0, -5], // Priya
  [8, 0, -5],  // Raj
  [-8, 0, 5],  // Maya
  [0, 0, 8],   // Alex (boss)
];

/* ============================================
   Simple 2D value-noise (deterministic)
   ========================================== */
function hash(px: number, py: number): number {
  let n = Math.sin(px * 127.1 + py * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function step(t: number): number {
  return t * t * (3 - 2 * t);
}

function noise2(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = step(fx);
  const sy = step(fy);
  const v00 = hash(ix, iy);
  const v10 = hash(ix + 1, iy);
  const v01 = hash(ix, iy + 1);
  const v11 = hash(ix + 1, iy + 1);
  return lerp(lerp(v00, v10, sx), lerp(v01, v11, sx), sy);
}

function fbm(x: number, y: number, oct = 4): number {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) {
    v += a * noise2(x * f, y * f);
    a *= 0.5;
    f *= 2;
  }
  return v;
}

/* ============================================
   Palette — dark sunset desert
   ========================================== */
const C = {
  // Keep the terrain recognisably sandy under the saturated sunset lights.
  // These colours intentionally sit away from the sky's magenta/blue range.
  sandDark:   new THREE.Color('#573117'),
  sandMid:    new THREE.Color('#A9652D'),
  sandLight:  new THREE.Color('#E2A55C'),
  shadowDust: new THREE.Color('#382117'),
  rockDark:   new THREE.Color('#1F1520'),
  rockMid:    new THREE.Color('#3A2540'),
  treeTrunk:  new THREE.Color('#1A1215'),
  treeFoliage:new THREE.Color('#1D3D33'),
  skyHorizon: new THREE.Color('#C85A3A'),
  skyLow:     new THREE.Color('#7A3060'),
  skyMid:     new THREE.Color('#3A3060'),
  skyUpper:   new THREE.Color('#1A2040'),
  skyZenith:  new THREE.Color('#0A0D1A'),
  glowWarm:   new THREE.Color('#E88A5A'),
};

/* ═══════════════════════════════════════════
   ATMOSPHERIC SKY — custom shader dome
   ═══════════════════════════════════════════ */
const skyVertShader = `
  varying vec3 vWorldPos;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const skyFragShader = `
  uniform vec3 uHorizon1;
  uniform vec3 uHorizon2;
  uniform vec3 uMid1;
  uniform vec3 uMid2;
  uniform vec3 uTop1;
  uniform vec3 uTop2;
  uniform vec3 uGlowColor;

  varying vec2 vUv;

  void main() {
    float h = vUv.y;

    vec3 col1 = mix(uHorizon1, uHorizon2, smoothstep(0.0, 0.08, h));
    vec3 col2 = mix(uMid1,     uMid2,     smoothstep(0.15, 0.35, h));
    vec3 col3 = mix(uTop1,     uTop2,     smoothstep(0.55, 0.85, h));

    vec3 color = mix(col1, col2, smoothstep(0.04, 0.2, h));
    color = mix(color, col3, smoothstep(0.35, 0.6, h));

    // Warmer denser glow band just above horizon (dusty sunset)
    float glow = exp(-pow((h - 0.03) * 14.0, 2.0));
    color += uGlowColor * glow * 0.45;

    // Slight noise band for atmospheric haze
    float band = sin(h * 100.0 + 2.3) * 0.5 + 0.5;
    color += uGlowColor * band * 0.012 * smoothstep(0.0, 0.3, h) * smoothstep(0.6, 0.0, h);

    gl_FragColor = vec4(color, 1.0);
  }
`;

function SkyDome() {
  const uniforms = useMemo(() => ({
    uHorizon1:  { value: new THREE.Color('#D06040') },   // horizon warm burnt orange
    uHorizon2:  { value: new THREE.Color('#8A3060') },   // low horizon magenta
    uMid1:      { value: new THREE.Color('#5A3060') },   // lower mid dusty purple
    uMid2:      { value: new THREE.Color('#2A3060') },   // mid deep blue-purple
    uTop1:      { value: new THREE.Color('#263A68') },   // upper mid blue
    uTop2:      { value: new THREE.Color('#3B5C8F') },   // visible zenith: never reads as a void
    uGlowColor: { value: new THREE.Color('#F09050') },   // warm glow
  }), []);

  return (
    <mesh>
      <sphereGeometry args={[160, 64, 48]} />
      <shaderMaterial
        side={THREE.BackSide}
        vertexShader={skyVertShader}
        fragmentShader={skyFragShader}
        uniforms={uniforms}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ═══════════════════════════════════════════
   STAR FIELD — varied brightness, color, fade
   ═══════════════════════════════════════════ */
function StarField() {
  const count = 10000;
  const geo = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.85); // full upper-sky coverage: 0 (horizon) to π/2 (zenith)
      const radius = 155;

      pos[i * 3]     = Math.cos(theta) * Math.sin(phi) * radius;
      pos[i * 3 + 1] = Math.cos(phi) * radius;
      pos[i * 3 + 2] = Math.sin(theta) * Math.sin(phi) * radius;

      const r = Math.random();
      if (r < 0.6) sizes[i] = 0.08 + Math.random() * 0.12;
      else if (r < 0.9) sizes[i] = 0.2 + Math.random() * 0.3;
      else sizes[i] = 0.5 + Math.random() * 0.8;

      const tint = Math.random();
      if (tint < 0.5) {
        colors[i * 3]     = 0.85 + Math.random() * 0.15;
        colors[i * 3 + 1] = 0.80 + Math.random() * 0.15;
        colors[i * 3 + 2] = 0.70 + Math.random() * 0.15;
      } else if (tint < 0.7) {
        colors[i * 3]     = 0.5 + Math.random() * 0.3;
        colors[i * 3 + 1] = 0.6 + Math.random() * 0.3;
        colors[i * 3 + 2] = 1.0;
      } else if (tint < 0.85) {
        colors[i * 3]     = 0.5 + Math.random() * 0.3;
        colors[i * 3 + 1] = 0.2 + Math.random() * 0.2;
        colors[i * 3 + 2] = 0.7 + Math.random() * 0.3;
      } else {
        colors[i * 3]     = 1.0;
        colors[i * 3 + 1] = 0.7 + Math.random() * 0.3;
        colors[i * 3 + 2] = 0.2 + Math.random() * 0.2;
      }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return g;
  }, []);

  const matRef = useRef<THREE.PointsMaterial>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (matRef.current) {
      matRef.current.opacity = 0.75 + Math.sin(timeRef.current * 0.3) * 0.08;
    }
  });

  return (
    <points geometry={geo}>
      <pointsMaterial
        ref={matRef}
        size={0.35}
        vertexColors
        transparent
        opacity={0.75}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ═══════════════════════════════════════════
   CONSTELLATIONS — 4 hand-placed patterns
   ═══════════════════════════════════════════ */
const CONSTELLATIONS = [
  {
    stars: [
      [25, 100, -120],
      [35, 90, -105],
      [55, 85, -90],
      [70, 80, -65],
      [80, 90, -45],
      [95, 105, -30],
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]],
  },
  {
    stars: [
      [-15, 130, 40],
      [5, 125, 50],
      [20, 120, 35],
      [10, 115, 20],
      [-10, 120, 25],
      [-5, 128, 45],
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [0, 5], [1, 5]],
  },
  {
    stars: [
      [-80, 95, 70],
      [-95, 85, 55],
      [-105, 75, 70],
      [-90, 70, 90],
      [-70, 80, 95],
      [-55, 90, 80],
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]],
  },
  {
    stars: [
      [110, 60, 80],
      [125, 55, 65],
      [115, 50, 50],
      [100, 55, 55],
      [105, 65, 70],
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]],
  },
];

function Constellations() {
  return (
    <group>
      {CONSTELLATIONS.map((constellation, ci) => (
        <ConstellationGroup
          key={ci}
          stars={constellation.stars as [number, number, number][]}
          lines={constellation.lines as [number, number][]}
        />
      ))}
    </group>
  );
}

function ConstellationGroup({
  stars,
  lines,
}: {
  stars: [number, number, number][];
  lines: [number, number][];
}) {
  const starGeo = useMemo(() => {
    const pos = new Float32Array(stars.length * 3);
    stars.forEach((s, i) => {
      pos[i * 3] = s[0];
      pos[i * 3 + 1] = s[1];
      pos[i * 3 + 2] = s[2];
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, [stars]);

  const lineGeo = useMemo(() => {
    const verts: number[] = [];
    lines.forEach(([a, b]) => {
      const p = stars[a];
      const q = stars[b];
      if (p && q) {
        verts.push(p[0], p[1], p[2], q[0], q[1], q[2]);
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
    return g;
  }, [stars, lines]);

  return (
    <group>
      <points geometry={starGeo}>
        <pointsMaterial
          size={0.5}
          color="#AADDFF"
          transparent
          opacity={0.7}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      <lineSegments geometry={lineGeo}>
        <lineBasicMaterial
          color="#88BBFF"
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}

/* ═══════════════════════════════════════════
   PLANETS — 3 distant worlds
   ═══════════════════════════════════════════ */
function Planets() {
  return (
    <group>
      {/* Ringed planet — Saturn-like in SW sky */}
      <group position={[-90, 95, -110]}>
        <mesh>
          <sphereGeometry args={[3.5, 32, 24]} />
          <meshStandardMaterial
            color="#7B6B8A"
            roughness={0.6}
            metalness={0.2}
            emissive="#3A2A5A"
            emissiveIntensity={0.08}
          />
        </mesh>
        <mesh rotation={[0.4, 0.2, 0]} position={[0, 0, 0]}>
          <ringGeometry args={[5, 8.5, 48]} />
          <meshStandardMaterial
            color="#6A5A7A"
            roughness={0.8}
            metalness={0.1}
            transparent
            opacity={0.45}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        <mesh rotation={[0.4, 0.2, 0]} position={[0, 0, 0]}>
          <ringGeometry args={[8.8, 10.5, 48]} />
          <meshStandardMaterial
            color="#8A7AAA"
            roughness={0.8}
            metalness={0.1}
            transparent
            opacity={0.15}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[4.2, 24, 18]} />
          <meshBasicMaterial
            color="#A88BFF"
            transparent
            opacity={0.06}
            depthWrite={false}
            side={THREE.BackSide}
          />
        </mesh>
      </group>

      {/* Medium planet — blue-purple, upper east */}
      <group position={[80, 110, 30]}>
        <mesh>
          <sphereGeometry args={[2.2, 24, 18]} />
          <meshStandardMaterial
            color="#4A6A9A"
            roughness={0.5}
            metalness={0.3}
            emissive="#1A3A6A"
            emissiveIntensity={0.06}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[2.6, 16, 12]} />
          <meshBasicMaterial
            color="#73C8FF"
            transparent
            opacity={0.05}
            depthWrite={false}
            side={THREE.BackSide}
          />
        </mesh>
      </group>

      {/* Tiny far planet near zenith */}
      <group position={[-30, 135, 20]}>
        <mesh>
          <sphereGeometry args={[0.8, 12, 8]} />
          <meshStandardMaterial
            color="#8A7A9A"
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>
      </group>
    </group>
  );
}

/* ═══════════════════════════════════════════
   SKY WRAPPER — follows the camera so the sky
   dome, stars, constellations & planets always
   surround the player no matter where they walk
   ═══════════════════════════════════════════ */
function SkyWrapper() {
  const { camera } = useThree();
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (ref.current) {
      ref.current.position.copy(camera.position);
    }
  });

  return (
    <group ref={ref}>
      <SkyDome />
      <StarField />
      <Constellations />
      <Planets />
    </group>
  );
}

/* ═══════════════════════════════════════════════════
   TERRAIN — stylised dark sunset desert with dunes
   Uses noise-based height displacement and vertex
   colours for ground variation
   ═══════════════════════════════════════════════════ */
const TERRAIN_SIZE = 80;
const TERRAIN_SEG = 120;

function getTerrainHeight(x: number, z: number): number {
  const dune  = fbm(x * 0.008, z * 0.008, 3) * 0.6;
  const ridge = fbm(x * 0.025, z * 0.025, 2) * 0.3;
  const fine  = noise2(x * 0.06, z * 0.06) * 0.12;
  // Flatten centre radius ~12 for gameplay around NPC stations
  const dist = Math.sqrt(x * x + z * z);
  const flatten = 1 - Math.max(0, Math.min(1, (dist - 8) / 8));
  return (dune + ridge + fine) * (1 - flatten * 0.6);
}

function getTerrainColor(h: number, n: number): THREE.Color {
  const dark = C.sandDark.clone();
  const mid = C.sandMid.clone();
  const light = C.sandLight.clone();
  const shadow = C.shadowDust.clone();

  let color: THREE.Color;
  if (h < 0.3) {
    color = shadow.clone().lerp(dark, h / 0.3);
  } else if (h < 0.6) {
    color = dark.clone().lerp(mid, (h - 0.3) / 0.3);
  } else {
    color = mid.clone().lerp(light, (h - 0.6) / 0.4);
  }

  const variation = (n - 0.5) * 0.15;
  color.r = Math.max(0, Math.min(1, color.r + variation));
  color.g = Math.max(0, Math.min(1, color.g + variation * 0.7));
  color.b = Math.max(0, Math.min(1, color.b + variation * 0.5));

  if (h < 0.35) color.lerp(C.shadowDust, 0.2);
  return color;
}

function Ground() {
  const { geo } = useMemo(() => {
    const seg = TERRAIN_SEG;
    const half = TERRAIN_SIZE / 2;
    const step = TERRAIN_SIZE / seg;
    const verts: number[] = [];
    const cols: number[] = [];
    const indices: number[] = [];

    for (let iz = 0; iz <= seg; iz++) {
      for (let ix = 0; ix <= seg; ix++) {
        const x = -half + ix * step;
        const z = -half + iz * step;
        const h = getTerrainHeight(x, z);
        verts.push(x, h, z);
        const nv = noise2(x * 0.04, z * 0.04);
        const col = getTerrainColor((h + 0.6) / 1.2, nv);
        cols.push(col.r, col.g, col.b);
      }
    }

    for (let iz = 0; iz < seg; iz++) {
      for (let ix = 0; ix < seg; ix++) {
        const a = iz * (seg + 1) + ix;
        const b = iz * (seg + 1) + ix + 1;
        const c = (iz + 1) * (seg + 1) + ix;
        const d = (iz + 1) * (seg + 1) + ix + 1;
        indices.push(a, b, c, b, d, c);
      }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(cols), 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return { geo: g };
  }, []);

  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial
        color="#7A3E1D"
        vertexColors
        roughness={0.96}
        metalness={0}
      />
    </mesh>
  );
}

/* ═══════════════════════════════════════════
   PATH SYSTEM — subtle worn paths between stations
   ═══════════════════════════════════════════ */
function PathSystem() {
  const { geo } = useMemo(() => {
    const halfW = 4;
    const verts: number[] = [];
    const indices: number[] = [];
    function addPath(x1: number, z1: number, x2: number, z2: number) {
      const dx = x2 - x1, dz = z2 - z1;
      const len = Math.sqrt(dx * dx + dz * dz);
      const nx = -dz / len * halfW, nz = dx / len * halfW;
      const steps = Math.floor(len / 1.2);
      const base = verts.length / 3;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const cx = x1 + dx * t, cz = z1 + dz * t;
        const h = getTerrainHeight(cx, cz) + 0.01;
        verts.push(cx + nx, h, cz + nz, cx - nx, h, cz - nz);
        if (s < steps) {
          const a = base + s * 2, b = base + s * 2 + 1;
          const c = base + (s + 1) * 2, d = base + (s + 1) * 2 + 1;
          indices.push(a, c, b, b, c, d);
        }
      }
    }
    for (let i = 0; i < 4; i++)
      for (let j = i + 1; j < 4; j++)
        addPath(STATION_POSITIONS[i][0], STATION_POSITIONS[i][2],
                STATION_POSITIONS[j][0], STATION_POSITIONS[j][2]);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
    g.setIndex(indices); g.computeVertexNormals();
    return { geo: g };
  }, []);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial color="#5A3A28" roughness={0.9} metalness={0} transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

/* ═══════════════════════════════════════════
   ROCK FORMATIONS — larger sci-fi rocks
   ═══════════════════════════════════════════ */
const ROCK_FORMATIONS = [
  { x: -18, z: -16, s: 1.2, c: '#3A2540' }, { x: 22, z: -18, s: 0.9, c: '#2D1F30' },
  { x: -25, z: 15, s: 1.5, c: '#4A3040' }, { x: 24, z: 22, s: 1.0, c: '#3A2540' },
  { x: -15, z: 22, s: 1.8, c: '#2D1F30' }, { x: 18, z: -24, s: 1.3, c: '#4A3040' },
  { x: -28, z: -5, s: 1.1, c: '#3A2540' }, { x: 30, z: 8, s: 1.4, c: '#2D1F30' },
  { x: -12, z: -26, s: 1.6, c: '#4A3040' }, { x: 26, z: 28, s: 0.8, c: '#3A2540' },
];

const SHARED_DODEC = new THREE.DodecahedronGeometry(0.7, 0);
const SHARED_OCTA = new THREE.OctahedronGeometry(0.35, 0);

function RockFormation({ x, z, scale, color }: { x: number; z: number; scale: number; color: string }) {
  const h = getTerrainHeight(x, z);
  const ry = Math.random() * 6.28;
  return (
    <group position={[x, h, z]} rotation={[0, ry, 0]} scale={scale}>
      <mesh geometry={SHARED_DODEC} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.8} metalness={0.2} flatShading />
      </mesh>
      <mesh position={[0.3, 0.2, 0.2]} geometry={SHARED_DODEC} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.85} metalness={0.15} flatShading />
      </mesh>
      <mesh position={[-0.15, 0.5, -0.1]} rotation={[0.2, 0.5, 0]} geometry={SHARED_OCTA} castShadow>
        <meshStandardMaterial color={color} roughness={0.75} metalness={0.25} flatShading />
      </mesh>
      {[0, 1, 2, 3].map(i => (
        <mesh key={i} position={[0.6 + Math.random() * 0.3, -0.1, 0.3 + Math.random() * 0.3]} castShadow>
          <icosahedronGeometry args={[0.06 + Math.random() * 0.06, 0]} />
          <meshStandardMaterial color={color} roughness={0.9} metalness={0.1} flatShading />
        </mesh>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════
   SCATTERED STONES
   ═══════════════════════════════════════════ */
const STONE_ICO = new THREE.IcosahedronGeometry(1, 0);
const STONE_POSITIONS = (() => {
  const pts: { x: number; z: number; s: number; ry: number; rx: number; rz: number }[] = [];
  for (let i = 0; i < 180; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 7 + Math.random() * 27;
    const x = Math.cos(angle) * dist, z = Math.sin(angle) * dist;
    if (STATION_POSITIONS.some(sp => Math.hypot(x - sp[0], z - sp[2]) < 5)) continue;
    pts.push({ x, z, s: 0.08 + Math.random() * 0.18, ry: Math.random() * 6.28, rx: Math.random() * 0.5, rz: Math.random() * 0.3 });
  }
  return pts;
})();

function SmallStones() {
  return (
    <group>
      {STONE_POSITIONS.map((p, i) => (
        <mesh key={i} position={[p.x, getTerrainHeight(p.x, p.z), p.z]}
          rotation={[p.rx, p.ry, p.rz]} scale={p.s} geometry={STONE_ICO} castShadow>
          <meshStandardMaterial color="#2A1A20" roughness={0.9} metalness={0.05} flatShading />
        </mesh>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════
   DESERT TREE — acacia / alien silhouette
   ═══════════════════════════════════════════ */
interface TreeConfig { x: number; z: number; sc: number; rotY: number; trunkH: number; trunkW: number; folSize: number; }
const TREE_CONFIGS: TreeConfig[] = (() => {
  const trees: TreeConfig[] = [];
  for (let i = 0; i < 28; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 10 + Math.random() * 26;
    const x = Math.cos(angle) * dist, z = Math.sin(angle) * dist;
    if (STATION_POSITIONS.some(sp => Math.hypot(x - sp[0], z - sp[2]) < 7)) continue;
    trees.push({ x, z, sc: 0.7 + Math.random() * 0.7, rotY: Math.random() * 6.28,
      trunkH: 1.5 + Math.random() * 1.8, trunkW: 0.08 + Math.random() * 0.08, folSize: 0.3 + Math.random() * 0.35 });
  }
  return trees;
})();

function DesertTree({ cfg }: { cfg: TreeConfig }) {
  const h = getTerrainHeight(cfg.x, cfg.z);
  const trunkG = useMemo(() => new THREE.CylinderGeometry(cfg.trunkW * 0.7, cfg.trunkW, cfg.trunkH, 5), [cfg.trunkW, cfg.trunkH]);
  const folG = useMemo(() => new THREE.SphereGeometry(cfg.folSize, 6, 5), [cfg.folSize]);
  const branches = useMemo(() => Array.from({ length: 2 + Math.floor(Math.random() * 3) }, () => ({
    a: Math.random() * 6.28, tilt: 0.3 + Math.random() * 0.7, len: 0.3 + Math.random() * 0.5, up: 0.3 + Math.random() * 0.6,
  })), []);
  return (
    <group position={[cfg.x, h, cfg.z]} rotation={[0, cfg.rotY, 0]} scale={cfg.sc}>
      <mesh position={[0, cfg.trunkH / 2, 0]} geometry={trunkG} castShadow>
        <meshStandardMaterial color={C.treeTrunk} roughness={0.9} metalness={0} flatShading />
      </mesh>
      {branches.map((b, i) => {
        const tx = Math.cos(b.a) * b.len, tz = Math.sin(b.a) * b.len, ty = cfg.trunkH - 0.2 + b.up;
        return (
          <group key={i}>
            <mesh position={[tx * 0.5, cfg.trunkH - 0.2 + b.up * 0.5, tz * 0.5]} rotation={[b.tilt * 0.5, b.a, 0]}>
              <cylinderGeometry args={[0.02, 0.05, b.len * 1.2, 4]} />
              <meshStandardMaterial color={C.treeTrunk} roughness={0.9} metalness={0} flatShading />
            </mesh>
            <mesh position={[tx, ty - 0.1, tz]} geometry={folG}>
              <meshStandardMaterial color={C.treeFoliage} roughness={0.8} metalness={0} flatShading />
            </mesh>
            <mesh position={[tx + 0.15, ty + 0.1, tz - 0.1]} geometry={folG}>
              <meshStandardMaterial color={C.treeFoliage} roughness={0.8} metalness={0} flatShading />
            </mesh>
          </group>
        );
      })}
      <mesh position={[0, cfg.trunkH + 0.2, 0]} geometry={folG}>
        <meshStandardMaterial color={C.treeFoliage} roughness={0.8} metalness={0} flatShading />
      </mesh>
    </group>
  );
}
function DesertTrees() {
  return <group>{TREE_CONFIGS.map((tc, i) => <DesertTree key={i} cfg={tc} />)}</group>;
}

/* ═══════════════════════════════════════════
   DESERT SHRUBS
   ═══════════════════════════════════════════ */
const SHRUB_GEO = new THREE.SphereGeometry(1, 5, 4);
const SHRUB_POSITIONS: { x: number; z: number; s: number }[] = (() => {
  const pts: { x: number; z: number; s: number }[] = [];
  for (let i = 0; i < 80; i++) {
    const a = Math.random() * Math.PI * 2, d = 6 + Math.random() * 28;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (STATION_POSITIONS.some(sp => Math.hypot(x - sp[0], z - sp[2]) < 5)) continue;
    pts.push({ x, z, s: 0.15 + Math.random() * 0.3 });
  }
  return pts;
})();
const SHRUB_COLS = ['#2A3A28', '#3A2A20', '#1A2A20'];

function DesertShrubs() {
  return (
    <group>
      {SHRUB_POSITIONS.map((p, i) => {
        const h = getTerrainHeight(p.x, p.z);
        const col = SHRUB_COLS[i % 3];
        return (
          <group key={i} position={[p.x, h, p.z]} scale={p.s}>
            <mesh position={[0, 0.12, 0]} geometry={SHRUB_GEO}>
              <meshStandardMaterial color={col} roughness={0.9} metalness={0} flatShading />
            </mesh>
            <mesh position={[0.12, 0.08, -0.08]} geometry={SHRUB_GEO}>
              <meshStandardMaterial color={col} roughness={0.9} metalness={0} flatShading />
            </mesh>
            <mesh position={[-0.1, 0.06, 0.1]} geometry={SHRUB_GEO}>
              <meshStandardMaterial color={col} roughness={0.9} metalness={0} flatShading />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ═══════════════════════════════════════════
   DESERT GRASS — sparse grass tufts
   ═══════════════════════════════════════════ */
const GRASS_GEO = new THREE.ConeGeometry(1, 2, 4);
const GRASS_POSITIONS: { x: number; z: number; s: number; ry: number; tilt: number }[] = (() => {
  const pts: { x: number; z: number; s: number; ry: number; tilt: number }[] = [];
  for (let i = 0; i < 300; i++) {
    const a = Math.random() * Math.PI * 2, d = 5 + Math.random() * 30;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (STATION_POSITIONS.some(sp => Math.hypot(x - sp[0], z - sp[2]) < 4)) continue;
    pts.push({ x, z, s: 0.04 + Math.random() * 0.08, ry: Math.random() * 6.28, tilt: 0.2 + Math.random() * 0.4 });
  }
  return pts;
})();

function DesertGrass() {
  return (
    <group>
      {GRASS_POSITIONS.map((p, i) => {
        const h = getTerrainHeight(p.x, p.z);
        return (
          <mesh key={i} position={[p.x, h + 0.02, p.z]} rotation={[p.tilt, p.ry, 0]} scale={p.s} geometry={GRASS_GEO}>
            <meshStandardMaterial color="#2A3A28" roughness={0.9} metalness={0} flatShading />
          </mesh>
        );
      })}
    </group>
  );
}

/* ═══════════════════════════════════════════
   GLOWING PATHWAY MARKERS — between stations
   ═══════════════════════════════════════════ */
function PathwayMarkers() {
  const markers = useMemo(() => {
    const result: { x: number; z: number }[] = [];
    for (let i = 0; i < STATION_POSITIONS.length; i++) {
      for (let j = i + 1; j < STATION_POSITIONS.length; j++) {
        const [x1, , z1] = STATION_POSITIONS[i];
        const [x2, , z2] = STATION_POSITIONS[j];
        const steps = Math.floor(Math.hypot(x2 - x1, z2 - z1) / 2.5);
        for (let s = 1; s < steps; s++) {
          const t = s / steps;
          const perturb = 0.3;
          result.push({
            x: x1 + (x2 - x1) * t + (Math.random() - 0.5) * perturb,
            z: z1 + (z2 - z1) * t + (Math.random() - 0.5) * perturb,
          });
        }
      }
    }
    return result;
  }, []);

  return (
    <group>
      {markers.map((m, i) => (
        <GlowDot key={i} x={m.x} z={m.z} color="#38D9FF" size={0.035} opacity={0.3} />
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════
   ENVIRONMENT STRUCTURES — sci-fi elements
   ═══════════════════════════════════════════ */
function EnvironmentStructures() {
  return (
    <group>
      <FuturisticPillar position={[-20, 0, -20]} height={6} color="#1A2A4A" accent="#38D9FF" />
      <FuturisticPillar position={[20, 0, -20]} height={5} color="#1A2A4A" accent="#A855F7" />
      <FuturisticPillar position={[-20, 0, 20]} height={7} color="#1A2A4A" accent="#E657A8" />
      <FuturisticPillar position={[20, 0, 20]} height={4} color="#1A2A4A" accent="#38D9FF" />
      <EnergyTerminal position={[-6, 0, -4]} color="#2589FF" />
      <EnergyTerminal position={[6, 0, -4]} color="#A855F7" />
      <EnergyTerminal position={[-6, 0, 4]} color="#E657A8" />
      <EnergyTerminal position={[0, 0, 7]} color="#38D9FF" />
      <HoloMarker position={[-8, 3.5, -5]} color="#2589FF" />
      <HoloMarker position={[8, 3.5, -5]} color="#A855F7" />
      <HoloMarker position={[-8, 3.5, 5]} color="#E657A8" />
      <HoloMarker position={[0, 4, 8]} color="#38D9FF" />
    </group>
  );
}

/* ═══════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════ */

function GlowDot({ x, z, color, size, opacity }: {
  x: number; z: number; color: string; size: number; opacity: number;
}) {
  return (
    <mesh position={[x, 0.02, z]}>
      <circleGeometry args={[size, 8]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

function FuturisticPillar({
  position, height, color, accent,
}: {
  position: [number, number, number];
  height: number;
  color: THREE.Color | string;
  accent: THREE.Color | string;
}) {
  return (
    <group position={[position[0], 0, position[2]]}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.4, height, 0.4]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.6} />
      </mesh>
      <mesh position={[0.21, height / 2, 0]}>
        <boxGeometry args={[0.04, height * 0.7, 0.04]} />
        <meshBasicMaterial color={accent} transparent opacity={0.5} />
      </mesh>
      <mesh position={[0, height, 0]}>
        <boxGeometry args={[0.6, 0.08, 0.6]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.6} />
      </mesh>
      <mesh position={[0, height + 0.04, 0]}>
        <boxGeometry args={[0.55, 0.02, 0.55]} />
        <meshBasicMaterial color={accent} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function EnergyTerminal({
  position, color,
}: {
  position: [number, number, number];
  color: THREE.Color | string;
}) {
  const glowRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (glowRef.current) {
      const pulse = Math.sin(timeRef.current * 1.5) * 0.3 + 0.7;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = pulse * 0.4;
    }
  });

  return (
    <group position={[position[0], 0, position[2]]}>
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <cylinderGeometry args={[0.3, 0.4, 0.3, 8]} />
        <meshStandardMaterial color="#0A1028" roughness={0.5} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.3, 8]} />
        <meshStandardMaterial color="#1A2A4A" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh ref={glowRef} position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18, 0.35, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

function HoloMarker({
  position, color,
}: {
  position: [number, number, number];
  color: THREE.Color | string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (meshRef.current) {
      meshRef.current.rotation.y = timeRef.current * 0.3;
      meshRef.current.rotation.x = Math.sin(timeRef.current * 0.5) * 0.2;
      meshRef.current.position.y = position[1] + Math.sin(timeRef.current * 0.8) * 0.2;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <octahedronGeometry args={[0.15, 0]} />
      <meshBasicMaterial color={color} transparent opacity={0.5} wireframe />
    </mesh>
  );
}

function StationPedestal({ position }: { position: [number, number, number] }) {
  const glowRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (glowRef.current) {
      const pulse = Math.sin(timeRef.current * 1.2) * 0.3 + 0.7;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = pulse * 0.15;
    }
  });

  return (
    <group position={[position[0], 0, position[2]]}>
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <cylinderGeometry args={[1.2, 1.4, 0.1, 8]} />
        <meshStandardMaterial color="#0A1028" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <torusGeometry args={[1.3, 0.04, 6, 24]} />
        <meshStandardMaterial color="#1A2A4A" roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.5, 0.04, 0.5]} />
        <meshStandardMaterial color="#101A3A" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh ref={glowRef} position={[0, 0.13, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 1.1, 24]} />
        <meshBasicMaterial color="#38D9FF" transparent opacity={0.1} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════
   MAIN FACTORY SCENE
   ═══════════════════════════════════════════ */
export default function FactoryScene() {
  return (
    <group>
      {/* ── Low warm sunset sun (main shadow-caster) ── */}
      <directionalLight
        position={[-35, 4, -25]}
        intensity={2.0}
        color="#D06040"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      {/* Cool ambient fill makes dune crests and warm sand colours legible. */}
      <directionalLight
        position={[10, 30, 5]}
        intensity={0.45}
        color="#6D88B5"
      />
      {/* Purple / dusty fill from opposite side */}
      <directionalLight
        position={[25, 8, 20]}
        intensity={0.35}
        color="#6A3A60"
      />
      {/* Subtle magenta rim from below */}

      <directionalLight
        position={[5, -2, -12]}
        intensity={0.12}
        color="#A04060"
      />
      {/* Cyan cold back-rim */}

      <directionalLight
        position={[20, 10, -25]}
        intensity={0.25}
        color="#3A8090"
      />
      {/* Hemisphere — purple-warm top, blue-atmospheric bottom */}
      <hemisphereLight
        args={['#6076A5', '#3B2417', 0.75]}
      />

      {/* ── Sky wrapper (follows player) ───────── */}
      <SkyWrapper />

      {/* ── Ground ──────────────────────────────── */}
      <Ground />

      {/* ── Worn paths between stations ─────────── */}
      <PathSystem />

      {/* ── Rock formations (outer ring) ────────── */}
      <group>
        {ROCK_FORMATIONS.map((r, i) => (
          <RockFormation key={i} x={r.x} z={r.z} scale={r.s} color={r.c} />
        ))}
      </group>

      {/* ── Small stones ────────────────────────── */}
      <SmallStones />

      {/* ── Desert trees ────────────────────────── */}
      <DesertTrees />

      {/* ── Desert shrubs ───────────────────────── */}
      <DesertShrubs />

      {/* ── Desert grass ────────────────────────── */}
      <DesertGrass />

      {/* ── Pathway glow markers ────────────────── */}
      <PathwayMarkers />

      {/* ── Sci-fi environment structures ──────── */}
      <EnvironmentStructures />

      {/* ── Station pedestals ──────────────────── */}
      {STATION_POSITIONS.map((pos, i) => (
        <StationPedestal key={i} position={pos} />
      ))}

      {/* ── Atmospheric fog ─────────────────────── */}
      <fogExp2 attach="fog" args={['#1A1520', 0.007] as any} />
    </group>
  );
}

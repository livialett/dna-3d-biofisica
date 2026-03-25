import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const BASE_COLORS: Record<string, string> = {
  A: "#e05c5c",
  T: "#5c9ee0",
  G: "#5cc97c",
  C: "#e0bc5c",
};
const BASE_PAIRS = ["AT", "GC", "AT", "CG", "GC", "TA", "CG", "AT", "GC", "AT"];

function DoubleHelix() {
  const groupRef = useRef<THREE.Group>(null!);

  const NUM_PAIRS = 20;
  const RISE = 0.34;
  const RADIUS = 1.0;
  const TWIST_PER_PAIR = (2 * Math.PI) / 10;

  const { strand1, strand2, rungs, spheres } = useMemo(() => {
    const s1Points: THREE.Vector3[] = [];
    const s2Points: THREE.Vector3[] = [];
    const rungData: { p1: THREE.Vector3; p2: THREE.Vector3; pair: string }[] = [];
    const sphereData: { pos: THREE.Vector3; color: string }[] = [];

    for (let i = 0; i < NUM_PAIRS; i++) {
      const y = (i - NUM_PAIRS / 2) * RISE * 2;
      const angle = i * TWIST_PER_PAIR;

      const p1 = new THREE.Vector3(Math.cos(angle) * RADIUS, y, Math.sin(angle) * RADIUS);
      const p2 = new THREE.Vector3(Math.cos(angle + Math.PI) * RADIUS, y, Math.sin(angle + Math.PI) * RADIUS);

      s1Points.push(p1);
      s2Points.push(p2);

      const pairKey = BASE_PAIRS[i % BASE_PAIRS.length];
      const base1 = pairKey[0];
      const base2 = pairKey[1];

      rungData.push({ p1: p1.clone(), p2: p2.clone(), pair: pairKey });

      const mid = p1.clone().lerp(p2, 0.35);
      const mid2 = p1.clone().lerp(p2, 0.65);
      sphereData.push({ pos: mid, color: BASE_COLORS[base1] });
      sphereData.push({ pos: mid2, color: BASE_COLORS[base2] });
    }

    return { strand1: s1Points, strand2: s2Points, rungs: rungData, spheres: sphereData };
  }, []);

  const curve1 = useMemo(() => new THREE.CatmullRomCurve3(strand1), [strand1]);
  const curve2 = useMemo(() => new THREE.CatmullRomCurve3(strand2), [strand2]);

  const tube1Geo = useMemo(() => new THREE.TubeGeometry(curve1, 200, 0.07, 8, false), [curve1]);
  const tube2Geo = useMemo(() => new THREE.TubeGeometry(curve2, 200, 0.07, 8, false), [curve2]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={tube1Geo}>
        <meshStandardMaterial color="#c8a96e" metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh geometry={tube2Geo}>
        <meshStandardMaterial color="#c8a96e" metalness={0.3} roughness={0.4} />
      </mesh>

      {rungs.map((r, i) => {
        const mid = r.p1.clone().lerp(r.p2, 0.5);
        const dir = r.p2.clone().sub(r.p1);
        const len = dir.length();
        const up = new THREE.Vector3(0, 1, 0);
        const axis = new THREE.Vector3().crossVectors(up, dir).normalize();
        const angle = Math.acos(up.dot(dir.normalize()));
        const quat = new THREE.Quaternion().setFromAxisAngle(axis, angle);

        return (
          <mesh key={i} position={mid} quaternion={quat}>
            <cylinderGeometry args={[0.025, 0.025, len * 0.3, 8]} />
            <meshStandardMaterial color="#888" metalness={0.1} roughness={0.6} />
          </mesh>
        );
      })}

      {spheres.map((s, i) => (
        <mesh key={i} position={s.pos}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color={s.color} metalness={0.1} roughness={0.3} emissive={s.color} emissiveIntensity={0.15} />
        </mesh>
      ))}

      {strand1.map((p, i) => (
        <mesh key={`s1-${i}`} position={p}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshStandardMaterial color="#d4aa60" metalness={0.4} roughness={0.3} />
        </mesh>
      ))}
      {strand2.map((p, i) => (
        <mesh key={`s2-${i}`} position={p}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshStandardMaterial color="#d4aa60" metalness={0.4} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

const LEGEND = [
  { label: "Adenina (A)", color: BASE_COLORS.A },
  { label: "Timina (T)", color: BASE_COLORS.T },
  { label: "Guanina (G)", color: BASE_COLORS.G },
  { label: "Citosina (C)", color: BASE_COLORS.C },
];

export default function App() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#0a0a12", position: "relative" }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }} style={{ width: "100%", height: "100%" }} gl={{ antialias: true }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} />
        <directionalLight position={[-5, -5, -5]} intensity={0.4} color="#8090ff" />
        <pointLight position={[0, 5, 2]} intensity={0.6} color="#ffe0a0" />
        <DoubleHelix />
        <OrbitControls enablePan={false} minDistance={3} maxDistance={12} />
      </Canvas>

      <div style={{ position: "absolute", top: 24, left: 32, color: "#e8d8b0", fontFamily: "Georgia, serif" }}>
        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", opacity: 0.6, marginBottom: 4 }}>
          Modelo — 1953
        </div>
        <div style={{ fontSize: 22, fontWeight: "bold", letterSpacing: 1 }}>
          Ácido Desoxirribonucleico
        </div>
        <div style={{ fontSize: 12, opacity: 0.5, marginTop: 4 }}>
          Dupla hélice · B-DNA · ~34 Å por volta
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 28, left: 32, display: "flex", flexDirection: "column", gap: 6 }}>
        {LEGEND.map((l) => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: l.color, flexShrink: 0 }} />
            <span style={{ color: "#c8b89a", fontFamily: "Georgia, serif", fontSize: 12 }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

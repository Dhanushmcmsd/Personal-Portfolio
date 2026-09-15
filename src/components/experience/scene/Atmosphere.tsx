"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollEngine } from "@/lib/scroll/scrollEngine";

export default function Atmosphere() {
  const gridRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const count = 280;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = -Math.random() * 90 - 5;
    }
    return positions;
  }, []);

  useFrame((state) => {
    const p = scrollEngine.progress;
    if (gridRef.current) {
      gridRef.current.position.z = -p * 70 - 2;
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      particlesRef.current.position.z = -p * 65;
    }
  });

  return (
    <group>
      <color attach="background" args={["#06080B"]} />
      <fog attach="fog" args={["#06080B", 8, 55]} />

      <mesh position={[0, -2.5, -35]} rotation={[-Math.PI / 2, 0, 0]} ref={gridRef}>
        <planeGeometry args={[120, 120, 60, 60]} />
        <meshBasicMaterial color="#00E5FF" wireframe transparent opacity={0.12} />
      </mesh>

      <mesh position={[0, -2.4, -35]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[140, 140]} />
        <meshBasicMaterial color="#06080B" />
      </mesh>

      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.04} color="#8B5CFF" transparent opacity={0.35} sizeAttenuation />
      </points>

      {[-20, -35, -50, -65].map((z, i) => (
        <mesh key={z} position={[((i % 2) * 2 - 1) * 8, 2, z]}>
          <boxGeometry args={[0.05, 6, 0.05]} />
          <meshBasicMaterial color={i % 2 === 0 ? "#00E5FF" : "#8B5CFF"} transparent opacity={0.35} />
        </mesh>
      ))}
    </group>
  );
}

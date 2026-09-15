"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollEngine } from "@/lib/scroll/scrollEngine";

export default function Atmosphere() {
  const particlesRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const count = 180;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = Math.random() * 6 + 0.5;
      positions[i * 3 + 2] = -Math.random() * 100 - 5;
    }
    return positions;
  }, []);

  useFrame((state) => {
    const p = scrollEngine.progress;
    if (particlesRef.current) {
      particlesRef.current.position.z = -p * 80;
    }
    void state;
  });

  return (
    <group>
      <color attach="background" args={["#030504"]} />
      <fog attach="fog" args={["#041208", 5, 42]} />

      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.03}
          color="#39ff14"
          transparent
          opacity={0.22}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

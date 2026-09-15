"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { getCityWhiteBlend } from "@/lib/scroll/timeline";

export default function Atmosphere() {
  const particlesRef = useRef<THREE.Points>(null);
  const particleMat = useRef(
    new THREE.PointsMaterial({
      size: 0.03,
      color: "#39ff14",
      transparent: true,
      opacity: 0.22,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );

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

  useFrame(() => {
    const p = scrollEngine.progress;
    const blend = getCityWhiteBlend(p);

    if (particlesRef.current) {
      particlesRef.current.position.z = -p * 80;
    }

    const green = new THREE.Color("#39ff14");
    const white = new THREE.Color("#ffffff");
    particleMat.current.color.copy(green).lerp(white, blend);
    particleMat.current.opacity = 0.22 * (1 - blend) + 0.08 * blend;
  });

  return (
    <group>
      <color attach="background" args={["#030504"]} />
      <fog attach="fog" args={["#041208", 5, 42]} />

      <points ref={particlesRef} material={particleMat.current}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles, 3]} />
        </bufferGeometry>
      </points>
    </group>
  );
}

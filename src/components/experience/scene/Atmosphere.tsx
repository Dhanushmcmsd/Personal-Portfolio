"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { getCityWhiteBlend, getCloudCityBlend } from "@/lib/scroll/timeline";

export default function Atmosphere() {
  const particlesRef = useRef<THREE.Points>(null);
  const skyRef = useRef<THREE.Color>(new THREE.Color("#6eb5e8"));
  const particleMat = useRef(
    new THREE.PointsMaterial({
      size: 0.025,
      color: "#ffffff",
      transparent: true,
      opacity: 0.18,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );

  const particles = useMemo(() => {
    const count = 120;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = Math.random() * 8 + 2;
      positions[i * 3 + 2] = -Math.random() * 80 - 5;
    }
    return positions;
  }, []);

  const { scene } = useThree();

  useFrame(() => {
    const p = scrollEngine.progress;
    const cityBlend = getCloudCityBlend(p);
    const whiteBlend = getCityWhiteBlend(p);

    if (particlesRef.current) {
      particlesRef.current.position.z = -p * 70;
    }

    const skyHero = new THREE.Color("#6eb5e8");
    const skyCity = new THREE.Color("#4a8ab5");
    const skyWhite = new THREE.Color("#dce8f5");

    skyRef.current.copy(skyHero).lerp(skyCity, cityBlend * 0.6).lerp(skyWhite, whiteBlend);

    if (scene.background instanceof THREE.Color) {
      scene.background.copy(skyRef.current);
    }
    if (scene.fog && scene.fog instanceof THREE.Fog) {
      scene.fog.color.copy(skyRef.current);
      scene.fog.near = 6 + cityBlend * 4;
      scene.fog.far = 48 + whiteBlend * 20;
    }

    particleMat.current.opacity = 0.18 * (1 - cityBlend * 0.5) + 0.06;
  });

  return (
    <group>
      <color attach="background" args={["#6eb5e8"]} />
      <fog attach="fog" args={["#6eb5e8", 8, 55]} />

      <points ref={particlesRef} material={particleMat.current}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles, 3]} />
        </bufferGeometry>
      </points>
    </group>
  );
}

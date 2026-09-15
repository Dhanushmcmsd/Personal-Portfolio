"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { getCityBlackPhase, getCloudCityBlend } from "@/lib/scroll/timeline";

const SKY_HERO = new THREE.Color("#6eb5e8");
const SKY_BLACK = new THREE.Color("#06080B");

export default function Atmosphere() {
  const skyRef = useRef(new THREE.Color(SKY_HERO));
  const { scene } = useThree();

  useFrame(() => {
    const p = scrollEngine.progress;
    const blackPhase = getCityBlackPhase(p);
    const heroOnly = 1 - getCloudCityBlend(p);

    skyRef.current.copy(SKY_HERO).lerp(SKY_BLACK, Math.max(blackPhase, 1 - heroOnly));

    if (scene.background instanceof THREE.Color) {
      scene.background.copy(skyRef.current);
    }
    if (scene.fog && scene.fog instanceof THREE.Fog) {
      scene.fog.color.copy(skyRef.current);
      scene.fog.near = 8;
      scene.fog.far = blackPhase > 0.5 ? 120 : 55;
    }
  });

  return (
    <>
      <color attach="background" args={["#6eb5e8"]} />
      <fog attach="fog" args={["#6eb5e8", 8, 55]} />
    </>
  );
}

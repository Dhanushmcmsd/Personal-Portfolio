"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { getHeroCloudOpacity } from "@/lib/scroll/timeline";

const BALLOON_SCALE = 0.0025;

export default function HotAirBalloon() {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF("/models/cute_hot_air_balloon.glb");

  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
      }
    });
    return clone;
  }, [scene]);

  useFrame((state) => {
    if (!groupRef.current) return;

    const p = scrollEngine.progress;
    const heroVis = getHeroCloudOpacity(p);
    const t = state.clock.elapsedTime;

    groupRef.current.visible = heroVis > 0.05;

    const cycle = (t * 0.04) % 1;
    const x = THREE.MathUtils.lerp(-28, 28, cycle);
    const y = 4.5 + Math.sin(t * 0.35) * 0.35;
    const z = -52 + Math.sin(t * 0.2) * 2;

    groupRef.current.position.set(x, y, z);
    groupRef.current.rotation.y = Math.sin(t * 0.15) * 0.08;
    groupRef.current.rotation.z = Math.sin(t * 0.25) * 0.04;
    groupRef.current.scale.setScalar(BALLOON_SCALE * heroVis);
  });

  return (
    <group ref={groupRef} visible={false}>
      <primitive object={model} />
    </group>
  );
}

useGLTF.preload("/models/cute_hot_air_balloon.glb");

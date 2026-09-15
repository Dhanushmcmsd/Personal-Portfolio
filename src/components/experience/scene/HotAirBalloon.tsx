"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { getHeroCloudOpacity } from "@/lib/scroll/timeline";
import { VIRUS_SCALE } from "./VirusMascot";

const BALLOON_SCALE = VIRUS_SCALE * 0.5;

export default function HotAirBalloon() {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const { scene } = useGLTF("/models/cute_hot_air_balloon.glb");

  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        mesh.frustumCulled = false;
      }
    });
    return clone;
  }, [scene]);

  useFrame((state) => {
    if (!groupRef.current) return;

    const p = scrollEngine.progress;
    const heroVis = getHeroCloudOpacity(p);
    const t = state.clock.elapsedTime;

    if (heroVis < 0.04) {
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;

    const cycle = (t * 0.022) % 1;
    const localX = THREE.MathUtils.lerp(-16, 16, cycle);
    const localY = 0.8 + Math.sin(t * 0.45) * 0.3;
    const localZ = -22 - Math.sin(t * 0.18) * 1.5;

    const anchor = new THREE.Vector3(localX, localY, localZ);
    anchor.applyQuaternion(camera.quaternion);
    anchor.add(camera.position);

    groupRef.current.position.copy(anchor);
    groupRef.current.quaternion.copy(camera.quaternion);
    groupRef.current.scale.setScalar(BALLOON_SCALE * heroVis);
  });

  return (
    <group ref={groupRef} visible={false} renderOrder={1}>
      <primitive object={model} />
    </group>
  );
}

useGLTF.preload("/models/cute_hot_air_balloon.glb");

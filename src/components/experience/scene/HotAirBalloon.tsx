"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { getHeroCloudOpacity } from "@/lib/scroll/timeline";

const TARGET_WORLD_SIZE = 0.56;

export default function HotAirBalloon() {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const { scene } = useGLTF("/models/cute_hot_air_balloon.glb");

  const { model, fitScale } = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        mesh.frustumCulled = false;
      }
    });
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 0.001);
    const center = box.getCenter(new THREE.Vector3());
    clone.position.sub(center);
    return { model: clone, fitScale: TARGET_WORLD_SIZE / maxDim };
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

    const cycle = (t * 0.018) % 1;
    const localX = THREE.MathUtils.lerp(-10, 10, cycle);
    const localY = 1.1 + Math.sin(t * 0.42) * 0.22;
    const localZ = -14 - Math.sin(t * 0.16) * 0.8;

    const anchor = new THREE.Vector3(localX, localY, localZ);
    anchor.applyQuaternion(camera.quaternion);
    anchor.add(camera.position);

    groupRef.current.position.copy(anchor);
    groupRef.current.quaternion.copy(camera.quaternion);
    groupRef.current.scale.setScalar(fitScale * heroVis);
  });

  return (
    <group ref={groupRef} visible={false} renderOrder={2}>
      <primitive object={model} />
    </group>
  );
}

useGLTF.preload("/models/cute_hot_air_balloon.glb");

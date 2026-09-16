"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { getCloudCityBlend } from "@/lib/scroll/timeline";

interface FloorReflectionProps {
  worldRef: React.RefObject<THREE.Group | null>;
  travelRef: React.MutableRefObject<number>;
}

export default function FloorReflection({ worldRef, travelRef }: FloorReflectionProps) {
  const groupRef = useRef<THREE.Group>(null);
  const reflectorRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const p = scrollEngine.progress;
    const cityReveal = getCloudCityBlend(p);
    const world = worldRef.current;
    const group = groupRef.current;

    if (!world || !group) return;

    group.visible = cityReveal > 0.05;
    group.position.copy(world.position);
    group.scale.copy(world.scale);
    group.rotation.copy(world.rotation);

    if (reflectorRef.current) {
      const scrollZ = (travelRef.current * 0.02) % 2;
      reflectorRef.current.position.z = -48 - scrollZ;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <mesh
        ref={reflectorRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -2.255, -48]}
      >
        <planeGeometry args={[56, 260]} />
        <MeshReflectorMaterial
          blur={[128, 32]}
          resolution={256}
          mixBlur={0.55}
          mixStrength={0.16}
          roughness={0.92}
          depthScale={0.55}
          minDepthThreshold={0.45}
          maxDepthThreshold={1.35}
          color="#000000"
          metalness={0.35}
          mirror={0.38}
          transparent
          opacity={0.38}
        />
      </mesh>
    </group>
  );
}

"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { getCityBlackPhase } from "@/lib/scroll/timeline";

interface FloorReflectionProps {
  travelRef: React.MutableRefObject<number>;
}

export default function FloorReflection({ travelRef }: FloorReflectionProps) {
  const reflectorRef = useRef<THREE.Mesh>(null);
  const mouseGlowRef = useRef<THREE.Mesh>(null);
  const baseFloorRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const p = scrollEngine.progress;
    const blackPhase = getCityBlackPhase(p);
    const t = state.clock.elapsedTime;
    const scrollZ = (travelRef.current * 0.02) % 2;
    const floorZ = -48 - scrollZ;

    const active = blackPhase > 0.55;

    if (baseFloorRef.current) {
      baseFloorRef.current.visible = active;
      baseFloorRef.current.position.z = floorZ;
    }

    if (reflectorRef.current) {
      reflectorRef.current.visible = active;
      reflectorRef.current.position.z = floorZ;
    }

    if (mouseGlowRef.current) {
      mouseGlowRef.current.visible = false;
    }

    if (!active || !reflectorRef.current || !mouseGlowRef.current) return;

    state.raycaster.setFromCamera(state.pointer, state.camera);
    const hits = state.raycaster.intersectObject(reflectorRef.current, false);

    if (hits[0]) {
      mouseGlowRef.current.visible = true;
      mouseGlowRef.current.position.set(
        hits[0].point.x,
        hits[0].point.y + 0.008,
        hits[0].point.z
      );
      const pulse = 0.88 + Math.sin(t * 2.5) * 0.12;
      mouseGlowRef.current.scale.setScalar(0.42 * pulse);
      const glowMat = mouseGlowRef.current.material as THREE.MeshBasicMaterial;
      glowMat.opacity = 0.06 * blackPhase * pulse;
    }
  });

  return (
    <>
      <mesh
        ref={baseFloorRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -2.262, -48]}
        visible={false}
      >
        <planeGeometry args={[56, 260]} />
        <meshBasicMaterial color="#06080B" transparent opacity={0.98} depthWrite />
      </mesh>

      <mesh
        ref={reflectorRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -2.258, -48]}
        visible={false}
      >
        <planeGeometry args={[56, 260]} />
        <MeshReflectorMaterial
          blur={[256, 64]}
          resolution={512}
          mixBlur={0.65}
          mixStrength={0.22}
          roughness={1}
          depthScale={0.65}
          minDepthThreshold={0.5}
          maxDepthThreshold={1.25}
          color="#050608"
          metalness={0.35}
          mirror={0.32}
          transparent
          opacity={0.72}
        />
      </mesh>

      <mesh ref={mouseGlowRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.12, 0.55, 32]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

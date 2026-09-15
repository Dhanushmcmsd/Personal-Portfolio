"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { getCityBlackPhase } from "@/lib/scroll/timeline";

export default function FloorReflection() {
  const reflectorRef = useRef<THREE.Mesh>(null);
  const mouseGlowRef = useRef<THREE.Mesh>(null);
  const travelRef = useRef(0);

  useFrame((state) => {
    const p = scrollEngine.progress;
    const blackPhase = getCityBlackPhase(p);
    const t = state.clock.elapsedTime;
    travelRef.current = p * 130;

    if (reflectorRef.current) {
      reflectorRef.current.visible = blackPhase > 0.45;
      reflectorRef.current.position.z = -30 - (travelRef.current * 0.02) % 2;
      const mat = reflectorRef.current.material as THREE.Material & {
        opacity?: number;
        mirror?: number;
      };
      if ("opacity" in mat) mat.opacity = 0.55 + blackPhase * 0.4;
      if ("mirror" in mat) mat.mirror = 0.28 + blackPhase * 0.22;
    }

    if (!mouseGlowRef.current || !reflectorRef.current || blackPhase < 0.45) {
      if (mouseGlowRef.current) mouseGlowRef.current.visible = false;
      return;
    }

    state.raycaster.setFromCamera(state.pointer, state.camera);
    const hits = state.raycaster.intersectObject(reflectorRef.current, false);

    if (hits[0]) {
      mouseGlowRef.current.visible = true;
      mouseGlowRef.current.position.set(
        hits[0].point.x,
        hits[0].point.y + 0.01,
        hits[0].point.z
      );
      const pulse = 0.85 + Math.sin(t * 3) * 0.15;
      mouseGlowRef.current.scale.setScalar(0.55 * pulse);
      const glowMat = mouseGlowRef.current.material as THREE.MeshBasicMaterial;
      glowMat.opacity = 0.08 * blackPhase * pulse;
    } else {
      mouseGlowRef.current.visible = false;
    }
  });

  return (
    <>
      <mesh
        ref={reflectorRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -2.252, -30]}
        visible={false}
      >
        <planeGeometry args={[56, 260]} />
        <MeshReflectorMaterial
          blur={[400, 120]}
          resolution={1024}
          mixBlur={1.2}
          mixStrength={0.45}
          roughness={0.92}
          depthScale={1.1}
          minDepthThreshold={0.85}
          maxDepthThreshold={1.05}
          color="#030406"
          metalness={0.55}
          mirror={0.35}
          transparent
          opacity={0.75}
        />
      </mesh>

      <mesh ref={mouseGlowRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.15, 0.75, 32]} />
        <meshBasicMaterial
          color="#39ff14"
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

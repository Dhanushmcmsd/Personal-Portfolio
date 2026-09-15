"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { PORTFOLIO_CONFIG } from "@/config/portfolio";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { rangeProgress } from "@/lib/scroll/timeline";

interface VirusMascotProps {
  targetPosition: THREE.Vector3 | null;
  catchPulse: number;
  positionRef?: React.MutableRefObject<THREE.Vector3>;
}

const VIRUS_SCALE = 0.42;
const BASE_POSITION = new THREE.Vector3(1.2, -0.35, -88);

export default function VirusMascot({
  targetPosition,
  catchPulse,
  positionRef,
}: VirusMascotProps) {
  const groupRef = useRef<THREE.Group>(null);
  const currentPos = useRef(BASE_POSITION.clone());
  const { scene } = useGLTF("/models/dhanush-virus-mascot.glb");

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).castShadow = true;
        (child as THREE.Mesh).receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  useFrame((state) => {
    const p = scrollEngine.progress;
    const finalStart = PORTFOLIO_CONFIG.interaction.finalSceneStart;
    const visible = rangeProgress(p, finalStart - 0.02, finalStart + 0.06);

    if (!groupRef.current) return;
    groupRef.current.visible = visible > 0.05;
    if (visible <= 0.05) return;

    const idle = new THREE.Vector3(
      Math.sin(state.clock.elapsedTime * 1.2) * 0.12,
      Math.sin(state.clock.elapsedTime * 1.5) * 0.08,
      0
    );

    if (targetPosition) {
      currentPos.current.lerp(targetPosition, 0.12);
    } else {
      currentPos.current.lerp(BASE_POSITION.clone().add(idle), 0.06);
    }

    groupRef.current.position.copy(currentPos.current);
    if (positionRef) positionRef.current.copy(currentPos.current);
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.85) * 0.25;
    groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.1) * 0.08;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.6) * 0.05;
    groupRef.current.scale.setScalar((1 + catchPulse * 0.12) * visible);
  });

  return (
    <group ref={groupRef} position={BASE_POSITION.toArray()}>
      <primitive object={clonedScene} scale={VIRUS_SCALE} />
      <pointLight position={[0, 0.6, 0.8]} intensity={0.45} color="#8B5CFF" distance={3} />
    </group>
  );
}

useGLTF.preload("/models/dhanush-virus-mascot.glb");

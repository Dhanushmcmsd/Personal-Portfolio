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

const VIRUS_SCALE = 0.11;

export default function VirusMascot({
  targetPosition,
  catchPulse,
  positionRef,
}: VirusMascotProps) {
  const groupRef = useRef<THREE.Group>(null);
  const currentPos = useRef(new THREE.Vector3(0, 0, 0));
  const { scene } = useGLTF("/models/dhanush-virus-mascot.glb");

  const clonedScene = useMemo(() => {
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
    const t = state.clock.elapsedTime;
    const finalStart = PORTFOLIO_CONFIG.interaction.finalSceneStart;
    const aboutVisible = rangeProgress(p, finalStart - 0.04, finalStart + 0.02);
    const petAlpha = 0.35 + aboutVisible * 0.65;

    const orbitX = Math.sin(t * 0.55) * 1.6 + Math.cos(t * 0.23) * 0.4;
    const orbitY = 0.35 + Math.sin(t * 0.7) * 0.25 + p * 0.15;
    const orbitZ = -8 - p * 70 + Math.cos(t * 0.45) * 0.8;

    const target = new THREE.Vector3(orbitX, orbitY, orbitZ);

    if (targetPosition && aboutVisible > 0.5) {
      currentPos.current.lerp(targetPosition, 0.08);
    } else {
      currentPos.current.lerp(target, 0.04);
    }

    groupRef.current.position.copy(currentPos.current);
    if (positionRef) positionRef.current.copy(currentPos.current);
    groupRef.current.rotation.y = t * 0.8;
    groupRef.current.rotation.z = Math.sin(t * 1.2) * 0.15;
    groupRef.current.scale.setScalar(VIRUS_SCALE * petAlpha * (1 + catchPulse * 0.15));
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} scale={1} />
    </group>
  );
}

useGLTF.preload("/models/dhanush-virus-mascot.glb");

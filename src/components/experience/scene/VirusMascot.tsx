"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { computeVirusCatchBlend, computeVirusPath } from "@/lib/animation/virusPath";
import { PORTFOLIO_CONFIG } from "@/config/portfolio";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { rangeProgress } from "@/lib/scroll/timeline";

interface VirusMascotProps {
  targetPosition: THREE.Vector3 | null;
  catchPulse: number;
  positionRef?: React.MutableRefObject<THREE.Vector3>;
}

const VIRUS_SCALE = 0.022;

export default function VirusMascot({
  targetPosition,
  catchPulse,
  positionRef,
}: VirusMascotProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const currentPos = useRef(new THREE.Vector3());
  const { camera } = useThree();
  const { scene } = useGLTF("/models/dhanush-virus-mascot.glb");

  const { frontModel, backModel } = useMemo(() => {
    const front = scene.clone(true);
    const back = scene.clone(true);
    [front, back].forEach((clone) => {
      clone.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = false;
          mesh.receiveShadow = false;
        }
      });
    });
    return { frontModel: front, backModel: back };
  }, [scene]);

  useFrame((state) => {
    if (!groupRef.current || !bodyRef.current) return;

    const p = scrollEngine.progress;
    const t = state.clock.elapsedTime;
    const finalStart = PORTFOLIO_CONFIG.interaction.finalSceneStart;
    const aboutActive = rangeProgress(p, finalStart - 0.03, finalStart + 0.08);
    const catching = Boolean(targetPosition && aboutActive > 0.45);

    const path = computeVirusPath(t);
    const local = new THREE.Vector3(path.x, path.y, path.z);
    local.applyQuaternion(camera.quaternion);
    local.add(camera.position);

    if (catching && targetPosition) {
      currentPos.current.lerp(targetPosition, 0.1);
    } else {
      currentPos.current.lerp(local, 0.08);
    }

    groupRef.current.position.copy(currentPos.current);
    if (positionRef) positionRef.current.copy(currentPos.current);

    groupRef.current.quaternion.copy(camera.quaternion);
    bodyRef.current.rotation.y = path.rotY + computeVirusCatchBlend(t, catching);
    bodyRef.current.rotation.z = path.rotZ;

    const alpha = 0.55 + aboutActive * 0.45;
    groupRef.current.scale.setScalar(
      VIRUS_SCALE * alpha * (1 + catchPulse * 0.12)
    );
  });

  return (
    <group ref={groupRef}>
      <group ref={bodyRef}>
        <primitive object={frontModel} />
        <group rotation={[0, Math.PI, 0]}>
          <primitive object={backModel} />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload("/models/dhanush-virus-mascot.glb");

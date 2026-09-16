"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { exclusiveOpacity, SECTION } from "@/lib/scroll/timeline";

export interface EatTarget {
  position: THREE.Vector3;
  progress: number;
}

interface VirusMascotProps {
  targetPosition: THREE.Vector3 | null;
  eatTarget: EatTarget | null;
  positionRef?: React.MutableRefObject<THREE.Vector3>;
}

const VIRUS_SCALE = 0.009;
const EAT_DURATION_MS = 2000;

export { VIRUS_SCALE };

export default function VirusMascot({
  targetPosition,
  eatTarget,
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
    const contactVis = exclusiveOpacity(p, SECTION.contact[0], SECTION.contact[1], 0.04);

    if (contactVis < 0.02) {
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;
    const eating = Boolean(eatTarget);
    const eatT = eatTarget?.progress ?? 0;
    const chasing = Boolean(targetPosition && contactVis > 0.5 && !eating);

    const orbitX = Math.sin(t * 0.7) * 1.2;
    const orbitY = 0.15 + Math.sin(t * 0.9) * 0.12;
    const orbitZ = -3.6 + Math.cos(t * 0.5) * 0.25;

    const local = new THREE.Vector3(orbitX, orbitY, orbitZ);
    local.applyQuaternion(camera.quaternion);
    local.add(camera.position);

    if (eating && eatTarget) {
      currentPos.current.lerp(eatTarget.position, 0.18);
      bodyRef.current.rotation.x = Math.sin(eatT * Math.PI * 3) * 0.35;
      bodyRef.current.rotation.z = Math.sin(eatT * Math.PI * 2) * 0.08;
      bodyRef.current.rotation.y = t * 0.4;
      groupRef.current.scale.setScalar(
        VIRUS_SCALE * contactVis * (1 + Math.sin(eatT * Math.PI * 4) * 0.12)
      );
    } else if (chasing && targetPosition) {
      currentPos.current.lerp(targetPosition, 0.12);
      bodyRef.current.rotation.x = Math.sin(t * 2) * 0.06;
      bodyRef.current.rotation.z = Math.sin(t * 1.4) * 0.12;
      bodyRef.current.rotation.y = t * 1.1;
      groupRef.current.scale.setScalar(VIRUS_SCALE * contactVis);
    } else {
      currentPos.current.lerp(local, 0.06);
      bodyRef.current.rotation.y = t * 1.1;
      bodyRef.current.rotation.z = Math.sin(t * 1.4) * 0.12;
      bodyRef.current.rotation.x = 0;
      groupRef.current.scale.setScalar(VIRUS_SCALE * contactVis);
    }

    groupRef.current.position.copy(currentPos.current);
    if (positionRef) positionRef.current.copy(currentPos.current);
    groupRef.current.quaternion.copy(camera.quaternion);
  });

  return (
    <group ref={groupRef} visible={false}>
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

export { EAT_DURATION_MS };

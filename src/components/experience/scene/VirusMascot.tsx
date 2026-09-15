"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { exclusiveOpacity, SECTION } from "@/lib/scroll/timeline";

interface VirusMascotProps {
  targetPosition: THREE.Vector3 | null;
  catchPulse: number;
  positionRef?: React.MutableRefObject<THREE.Vector3>;
}

const VIRUS_SCALE = 0.009;

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
    const contactVis = exclusiveOpacity(p, SECTION.contact[0], SECTION.contact[1], 0.04);

    if (contactVis < 0.02) {
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;
    const catching = Boolean(targetPosition && contactVis > 0.5);

    const orbitX = Math.sin(t * 0.7) * 1.2;
    const orbitY = 0.2 + Math.sin(t * 0.9) * 0.15;
    const orbitZ = -3.8 + Math.cos(t * 0.5) * 0.3;

    const local = new THREE.Vector3(orbitX, orbitY, orbitZ);
    local.applyQuaternion(camera.quaternion);
    local.add(camera.position);

    if (catching && targetPosition) {
      currentPos.current.lerp(targetPosition, 0.1);
    } else {
      currentPos.current.lerp(local, 0.06);
    }

    groupRef.current.position.copy(currentPos.current);
    if (positionRef) positionRef.current.copy(currentPos.current);

    groupRef.current.quaternion.copy(camera.quaternion);
    bodyRef.current.rotation.y = t * 1.1;
    bodyRef.current.rotation.z = Math.sin(t * 1.4) * 0.12;

    groupRef.current.scale.setScalar(
      VIRUS_SCALE * contactVis * (1 + catchPulse * 0.15)
    );
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

"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { CONTACT_PLATFORM } from "./ContactHeadingPlatform";
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

const walkTarget = new THREE.Vector3();
const lookAtTarget = new THREE.Vector3();
const targetQuat = new THREE.Quaternion();
const lookMatrix = new THREE.Matrix4();

function getPlatformWalkTarget(t: number) {
  const cycle = (t * 0.11) % 1;
  const { center, width, topY, depth, frontZ } = CONTACT_PLATFORM;

  if (cycle < 0.22) {
    const p = cycle / 0.22;
    walkTarget.set(
      center.x + Math.sin(p * Math.PI) * 0.08,
      THREE.MathUtils.lerp(center.y - 0.1, center.y + 0.06, p),
      THREE.MathUtils.lerp(frontZ, center.z + depth * 0.38, p)
    );
    lookAtTarget.set(center.x, center.y, center.z);
    return { faceCamera: false, walkPhase: "approach" as const };
  }

  if (cycle < 0.38) {
    const p = (cycle - 0.22) / 0.16;
    walkTarget.set(
      THREE.MathUtils.lerp(center.x - width * 0.36, center.x - width * 0.42, p),
      THREE.MathUtils.lerp(center.y + 0.06, topY, p),
      THREE.MathUtils.lerp(center.z + depth * 0.38, center.z, p)
    );
    lookAtTarget.set(center.x - width * 0.42, topY, center.z);
    return { faceCamera: false, walkPhase: "mount" as const };
  }

  const p = (cycle - 0.38) / 0.62;
  const pingPong = p < 0.5 ? p * 2 : 2 - p * 2;
  const x = THREE.MathUtils.lerp(-width * 0.42, width * 0.42, pingPong);
  const bob = Math.sin(p * Math.PI * 12) * 0.022;
  walkTarget.set(x, topY + bob, center.z);
  lookAtTarget.set(p < 0.5 ? x + 0.35 : x - 0.35, topY, center.z);
  return { faceCamera: false, walkPhase: "walk" as const };
}

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

    if (eating && eatTarget) {
      currentPos.current.lerp(eatTarget.position, 0.18);
      bodyRef.current.rotation.x = Math.sin(eatT * Math.PI * 3) * 0.35;
      bodyRef.current.rotation.z = Math.sin(eatT * Math.PI * 2) * 0.08;
      bodyRef.current.rotation.y = t * 0.4;
      groupRef.current.scale.setScalar(
        VIRUS_SCALE * contactVis * (1 + Math.sin(eatT * Math.PI * 4) * 0.12)
      );
      groupRef.current.quaternion.copy(camera.quaternion);
    } else if (chasing && targetPosition) {
      currentPos.current.lerp(targetPosition, 0.12);
      bodyRef.current.rotation.x = Math.sin(t * 2) * 0.06;
      bodyRef.current.rotation.z = Math.sin(t * 1.4) * 0.12;
      bodyRef.current.rotation.y = t * 1.1;
      groupRef.current.scale.setScalar(VIRUS_SCALE * contactVis);
      groupRef.current.quaternion.copy(camera.quaternion);
    } else {
      getPlatformWalkTarget(t);
      currentPos.current.lerp(walkTarget, 0.14);
      bodyRef.current.rotation.x = Math.sin(t * 8) * 0.04;
      bodyRef.current.rotation.z = Math.sin(t * 6) * 0.06;
      bodyRef.current.rotation.y = Math.sin(t * 8) * 0.08;
      groupRef.current.scale.setScalar(VIRUS_SCALE * contactVis);

      lookMatrix.lookAt(currentPos.current, lookAtTarget, new THREE.Vector3(0, 1, 0));
      targetQuat.setFromRotationMatrix(lookMatrix);
      groupRef.current.quaternion.slerp(targetQuat, 0.12);
    }

    groupRef.current.position.copy(currentPos.current);
    if (positionRef) positionRef.current.copy(currentPos.current);
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

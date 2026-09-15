"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { interpolateCamera } from "@/lib/scroll/timeline";
import { scrollEngine } from "@/lib/scroll/scrollEngine";

export default function CameraRig() {
  const { camera } = useThree();
  const lookAtRef = useRef(new THREE.Vector3(0, 0, -10));
  const shakeRef = useRef(0);

  useFrame(() => {
    const progress = scrollEngine.progress;
    const reduced = scrollEngine.reducedMotion;
    const cam = interpolateCamera(progress);

    if (!reduced) {
      shakeRef.current = Math.sin(progress * 40) * 0.02 * (progress > 0.4 && progress < 0.75 ? 1 : 0.2);
    }

    camera.position.copy(cam.position);
    camera.position.x += shakeRef.current;
    lookAtRef.current.copy(cam.lookAt);
    camera.lookAt(lookAtRef.current);

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = cam.fov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}

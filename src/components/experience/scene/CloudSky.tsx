"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { getCloudCityBlend, getCityWhiteBlend } from "@/lib/scroll/timeline";

function makeCloudTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
  grad.addColorStop(0, "rgba(255,255,255,0.95)");
  grad.addColorStop(0.45, "rgba(255,255,255,0.55)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const CLOUD_LAYOUT = [
  { x: -6, y: 3.5, z: -8, sx: 8, sy: 3.2 },
  { x: 4, y: 4.2, z: -12, sx: 10, sy: 3.8 },
  { x: -2, y: 5.5, z: -18, sx: 12, sy: 4.5 },
  { x: 7, y: 3.8, z: -22, sx: 9, sy: 3.4 },
  { x: -8, y: 4.5, z: -28, sx: 11, sy: 4 },
  { x: 1, y: 6, z: -35, sx: 14, sy: 5 },
  { x: -4, y: 3.2, z: -42, sx: 7, sy: 2.8 },
  { x: 5, y: 5.2, z: -50, sx: 10, sy: 3.6 },
];

export default function CloudSky() {
  const groupRef = useRef<THREE.Group>(null);
  const cloudTex = useMemo(() => makeCloudTexture(), []);
  const { camera } = useThree();
  const cloudMat = useRef(
    new THREE.MeshBasicMaterial({
      map: cloudTex,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );

  useFrame((state) => {
    const p = scrollEngine.progress;
    const cityBlend = getCloudCityBlend(p);
    const whiteBlend = getCityWhiteBlend(p);
    const t = state.clock.elapsedTime;

    if (groupRef.current) {
      groupRef.current.position.z = -p * 45;
      groupRef.current.children.forEach((child, i) => {
        child.position.y =
          CLOUD_LAYOUT[i % CLOUD_LAYOUT.length].y +
          Math.sin(t * 0.15 + i * 0.7) * 0.12;
      });
    }

    const topCloudOpacity = 0.55 + whiteBlend * 0.25;
    const heroCloudOpacity = 0.95 * (1 - cityBlend * 0.35) + topCloudOpacity * cityBlend;
    cloudMat.current.opacity = heroCloudOpacity;

    if (groupRef.current) {
      groupRef.current.children.forEach((child) => {
        child.lookAt(camera.position);
      });
    }
  });

  return (
    <group ref={groupRef}>
      {CLOUD_LAYOUT.map((c, i) => (
        <mesh key={i} position={[c.x, c.y, c.z]} material={cloudMat.current}>
          <planeGeometry args={[c.sx, c.sy]} />
        </mesh>
      ))}
      <mesh position={[0, 8, -30]} material={cloudMat.current}>
        <planeGeometry args={[40, 12]} />
      </mesh>
      <mesh position={[0, 10, -55]} rotation={[0.1, 0, 0]} material={cloudMat.current}>
        <planeGeometry args={[50, 14]} />
      </mesh>
    </group>
  );
}

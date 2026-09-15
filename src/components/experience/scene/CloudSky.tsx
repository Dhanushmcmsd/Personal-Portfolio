"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { getHeroCloudOpacity } from "@/lib/scroll/timeline";

function makeCloudTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
  grad.addColorStop(0, "rgba(255,255,255,0.98)");
  grad.addColorStop(0.45, "rgba(255,255,255,0.6)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const HERO_CLOUDS = [
  { x: -5.5, y: 2.2, sx: 9, sy: 3.5 },
  { x: 4.5, y: 2.8, sx: 11, sy: 4 },
  { x: -1.5, y: 3.8, sx: 13, sy: 4.8 },
  { x: 6, y: 1.8, sx: 8, sy: 3.2 },
  { x: -7, y: 1.5, sx: 10, sy: 3.6 },
  { x: 0.5, y: 4.5, sx: 14, sy: 5 },
];

export default function CloudSky() {
  const groupRef = useRef<THREE.Group>(null);
  const cloudTex = useMemo(() => makeCloudTexture(), []);
  const { camera } = useThree();
  const cloudMat = useRef(
    new THREE.MeshBasicMaterial({
      map: cloudTex,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );

  useFrame((state) => {
    const p = scrollEngine.progress;
    const cloudOpacity = getHeroCloudOpacity(p);
    const t = state.clock.elapsedTime;

    if (!groupRef.current) return;

    groupRef.current.visible = cloudOpacity > 0.01;
    cloudMat.current.opacity = cloudOpacity * 0.95;

    const skyAnchor = new THREE.Vector3(0, 1.2, -6);
    skyAnchor.applyQuaternion(camera.quaternion);
    skyAnchor.add(camera.position);
    groupRef.current.position.copy(skyAnchor);
    groupRef.current.quaternion.copy(camera.quaternion);

    groupRef.current.children.forEach((child, i) => {
      const layout = HERO_CLOUDS[i % HERO_CLOUDS.length];
      child.position.set(
        layout.x + Math.sin(t * 0.12 + i) * 0.08,
        layout.y + Math.sin(t * 0.18 + i * 0.6) * 0.06,
        -1 - (i % 3) * 0.4
      );
    });
  });

  return (
    <group ref={groupRef}>
      {HERO_CLOUDS.map((c, i) => (
        <mesh key={i} position={[c.x, c.y, -1]} material={cloudMat.current}>
          <planeGeometry args={[c.sx, c.sy]} />
        </mesh>
      ))}
      <mesh position={[0, 5.5, -2]} material={cloudMat.current}>
        <planeGeometry args={[38, 10]} />
      </mesh>
    </group>
  );
}

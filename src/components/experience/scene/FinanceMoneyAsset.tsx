"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { sectionLocalProgress } from "@/lib/scroll/timeline";

interface FinanceMoneyAssetProps {
  color: string;
  onSelect?: () => void;
}

function makeMoneyTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 1024, 640);
  grad.addColorStop(0, "#0d1118");
  grad.addColorStop(1, "#141c10");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 640);

  ctx.strokeStyle = "rgba(255, 209, 102, 0.35)";
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 40, 944, 560);

  ctx.fillStyle = "#FFD166";
  ctx.font = "bold 72px system-ui";
  ctx.fillText("FINANCIAL", 72, 130);
  ctx.font = "28px system-ui";
  ctx.fillStyle = "rgba(244,241,234,0.75)";
  ctx.fillText("Analytics Dashboard", 72, 175);

  for (let i = 0; i < 5; i++) {
    const x = 120 + i * 160;
    ctx.beginPath();
    ctx.arc(x, 360, 52, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 === 0 ? "#FFD166" : "#39ff14";
    ctx.fill();
    ctx.fillStyle = "#0d1118";
    ctx.font = "bold 36px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("$", x, 375);
  }

  ctx.textAlign = "left";
  ctx.font = "22px monospace";
  ctx.fillStyle = "rgba(57,255,20,0.8)";
  ctx.fillText("KPI +12.4%", 72, 500);
  ctx.fillText("NPA -3.1%", 72, 540);
  ctx.fillText("BRANCH RANK #2", 72, 580);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export default function FinanceMoneyAsset({ color, onSelect }: FinanceMoneyAssetProps) {
  const groupRef = useRef<THREE.Group>(null);
  const coinsRef = useRef<THREE.Group>(null);
  const screenTex = useMemo(() => makeMoneyTexture(), []);

  useFrame((state) => {
    const p = scrollEngine.progress;
    const local = sectionLocalProgress(p, 0.32, 0.44);
    const spin = local * Math.PI * 0.5;

    if (coinsRef.current) {
      coinsRef.current.rotation.y = spin;
      coinsRef.current.position.y = Math.sin(local * Math.PI) * 0.08;
    }
    if (groupRef.current) {
      groupRef.current.rotation.x = -0.05 + local * 0.08;
    }
    void state;
  });

  return (
    <group ref={groupRef}>
      <mesh
        position={[0, 0, 0.1]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.();
        }}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "default";
        }}
      >
        <planeGeometry args={[5.35, 3.05]} />
        <meshBasicMaterial map={screenTex} transparent opacity={0.95} />
      </mesh>

      <group ref={coinsRef} position={[1.8, -0.55, 0.45]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, i * 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.28, 0.28, 0.06, 32]} />
            <meshStandardMaterial
              color="#FFD166"
              emissive="#FFD166"
              emissiveIntensity={0.35}
              metalness={0.85}
              roughness={0.18}
            />
          </mesh>
        ))}
        <mesh position={[-0.55, 0.12, 0.15]} rotation={[0, 0.4, -0.3]}>
          <boxGeometry args={[0.7, 0.35, 0.02]} />
          <meshStandardMaterial color="#39ff14" emissive="#39ff14" emissiveIntensity={0.2} />
        </mesh>
      </group>

      <pointLight position={[1.5, 0.5, 1.5]} intensity={0.4} color={color} distance={5} />
    </group>
  );
}

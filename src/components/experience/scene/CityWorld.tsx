"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollEngine } from "@/lib/scroll/scrollEngine";

const SEGMENT = 52;
const TRAVEL_MAX = 130;

function makeGlitchWindowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#020804";
  ctx.fillRect(0, 0, 64, 128);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 4; x++) {
      const on = Math.random() > 0.34;
      ctx.fillStyle = on
        ? `rgba(${30 + Math.random() * 40}, ${220 + Math.random() * 35}, ${40 + Math.random() * 30}, 0.95)`
        : "#010603";
      ctx.fillRect(4 + x * 15, 6 + y * 15, 10, 10);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

type BuildingData = {
  x: number;
  y: number;
  z: number;
  sx: number;
  sy: number;
  sz: number;
  ry: number;
};

function generateSegment(offsetZ: number): BuildingData[] {
  const buildings: BuildingData[] = [];
  let i = 0;
  for (let z = 16; z > -SEGMENT + 8; z -= 3.2) {
    for (const side of [-1, 1] as const) {
      const stagger = ((i * 19) % 7) * 0.26;
      const x = side * (7.8 + stagger + (i % 3) * 0.35);
      const h = 3.2 + ((i * 11) % 18) * 0.58;
      buildings.push({
        x,
        y: h / 2 - 2.15,
        z: z + offsetZ + ((i % 4) - 1.5) * 0.3,
        sx: 2.1 + (i % 5) * 0.26,
        sy: h,
        sz: 2.4 + (i % 4) * 0.22,
        ry: side * 0.035,
      });
      i++;
    }
  }
  return buildings;
}

export default function CityWorld() {
  const worldRef = useRef<THREE.Group>(null);
  const buildingsRef = useRef<THREE.InstancedMesh>(null);
  const wireRef = useRef<THREE.InstancedMesh>(null);
  const fogRef = useRef<THREE.Group>(null);
  const gridRef = useRef<THREE.Mesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const { buildings, windowTex, grassMat, smokeMat } = useMemo(() => {
    const segments = 4;
    const all: BuildingData[] = [];
    for (let s = 0; s < segments; s++) {
      all.push(...generateSegment(-s * SEGMENT));
    }
    return {
      buildings: all,
      windowTex: makeGlitchWindowTexture(),
      grassMat: new THREE.MeshStandardMaterial({
        color: "#1a3318",
        roughness: 0.96,
      }),
      smokeMat: new THREE.MeshBasicMaterial({
        color: "#39ff14",
        transparent: true,
        opacity: 0.1,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    };
  }, []);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load("/textures/grass.jpg", (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(40, 160);
      tex.colorSpace = THREE.SRGBColorSpace;
      grassMat.map = tex;
      grassMat.needsUpdate = true;
    });
    loader.load("/textures/smoke.png", (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      smokeMat.map = tex;
      smokeMat.needsUpdate = true;
    });
  }, [grassMat, smokeMat]);

  useEffect(() => {
    if (!buildingsRef.current || !wireRef.current) return;

    buildings.forEach((b, i) => {
      dummy.position.set(b.x, b.y, b.z);
      dummy.scale.set(b.sx, b.sy, b.sz);
      dummy.rotation.set(0, b.ry, 0);
      dummy.updateMatrix();
      buildingsRef.current!.setMatrixAt(i, dummy.matrix);
      wireRef.current!.setMatrixAt(i, dummy.matrix);
    });

    buildingsRef.current.instanceMatrix.needsUpdate = true;
    wireRef.current.instanceMatrix.needsUpdate = true;
  }, [buildings, dummy]);

  useFrame((state) => {
    const p = scrollEngine.progress;
    const t = state.clock.elapsedTime;
    const travel = p * TRAVEL_MAX;
    const loopOffset = travel % SEGMENT;

    if (worldRef.current) {
      worldRef.current.position.z = -travel + loopOffset;
      worldRef.current.position.x = Math.sin(p * Math.PI * 1.5) * 0.28;
    }

    if (gridRef.current) {
      gridRef.current.position.z = -(travel * 0.35) % 8;
    }

    if (fogRef.current) {
      fogRef.current.children.forEach((child, i) => {
        child.position.y = 1 + Math.sin(t * 0.28 + i * 0.6) * 0.35;
        child.position.x = Math.sin(t * 0.07 + i) * 1.4;
      });
    }

    if (buildingsRef.current) {
      const mat = buildingsRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.75 + Math.sin(t * 6 + p * 20) * 0.15;
    }
  });

  const wireMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#39ff14",
        wireframe: true,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  return (
    <group ref={worldRef}>
      <instancedMesh ref={buildingsRef} args={[undefined, undefined, buildings.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#081208"
          emissiveMap={windowTex}
          emissive="#39ff14"
          emissiveIntensity={0.85}
          roughness={0.82}
          metalness={0.15}
        />
      </instancedMesh>

      <instancedMesh ref={wireRef} args={[undefined, undefined, buildings.length]} material={wireMat}>
        <boxGeometry args={[1.02, 1.02, 1.02]} />
      </instancedMesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.28, -60]} receiveShadow material={grassMat}>
        <planeGeometry args={[60, 260]} />
      </mesh>

      <mesh ref={gridRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.24, -30]}>
        <planeGeometry args={[14, 260, 1, 52]} />
        <meshBasicMaterial color="#39ff14" wireframe transparent opacity={0.14} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.22, -30]}>
        <planeGeometry args={[60, 260, 1, 20]} />
        <meshBasicMaterial color="#39ff14" wireframe transparent opacity={0.05} />
      </mesh>

      <group ref={fogRef}>
        {Array.from({ length: 16 }).map((_, i) => (
          <mesh
            key={`fog-${i}`}
            position={[((i % 2) * 2 - 1) * 6, 1.1, 8 - i * 5.5]}
            material={smokeMat}
          >
            <planeGeometry args={[10, 4.5]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

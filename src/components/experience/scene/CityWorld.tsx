"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { getCityWhiteBlend } from "@/lib/scroll/timeline";

const SEGMENT = 52;
const TRAVEL_MAX = 130;

const GREEN = {
  building: new THREE.Color("#081208"),
  emissive: new THREE.Color("#39ff14"),
  wire: new THREE.Color("#39ff14"),
  grid: new THREE.Color("#39ff14"),
  grass: new THREE.Color("#1a3318"),
  fog: new THREE.Color("#39ff14"),
};

const WHITE = {
  building: new THREE.Color("#e8e8e8"),
  emissive: new THREE.Color("#ffffff"),
  wire: new THREE.Color("#cccccc"),
  grid: new THREE.Color("#d0d0d0"),
  grass: new THREE.Color("#f4f4f4"),
  fog: new THREE.Color("#ffffff"),
};

function makeGlitchWindowTexture(whiteBlend: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = whiteBlend > 0.5 ? "#e8e8e8" : "#020804";
  ctx.fillRect(0, 0, 64, 128);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 4; x++) {
      const on = Math.random() > 0.34;
      if (whiteBlend > 0.5) {
        ctx.fillStyle = on ? `rgba(255,255,255,${0.7 + Math.random() * 0.3})` : "#d8d8d8";
      } else {
        ctx.fillStyle = on
          ? `rgba(${30 + Math.random() * 40}, ${220 + Math.random() * 35}, ${40 + Math.random() * 30}, 0.95)`
          : "#010603";
      }
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

function lerpColor(target: THREE.Color, a: THREE.Color, b: THREE.Color, t: number) {
  target.copy(a).lerp(b, t);
  return target;
}

export default function CityWorld() {
  const worldRef = useRef<THREE.Group>(null);
  const buildingsRef = useRef<THREE.InstancedMesh>(null);
  const wireRef = useRef<THREE.InstancedMesh>(null);
  const fogRef = useRef<THREE.Group>(null);
  const gridRef = useRef<THREE.Mesh>(null);
  const gridWideRef = useRef<THREE.Mesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const blendRef = useRef(0);

  const { buildings, windowTex } = useMemo(() => {
    const segments = 4;
    const all: BuildingData[] = [];
    for (let s = 0; s < segments; s++) {
      all.push(...generateSegment(-s * SEGMENT));
    }
    return {
      buildings: all,
      windowTex: makeGlitchWindowTexture(0),
    };
  }, []);

  const buildingMat = useRef(
    new THREE.MeshStandardMaterial({
      color: GREEN.building,
      emissive: GREEN.emissive,
      emissiveIntensity: 0.85,
      roughness: 0.82,
      metalness: 0.15,
    })
  );
  const wireMat = useRef(
    new THREE.MeshBasicMaterial({
      color: GREEN.wire,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  const gridMat = useRef(
    new THREE.MeshBasicMaterial({
      color: GREEN.grid,
      wireframe: true,
      transparent: true,
      opacity: 0.14,
    })
  );
  const gridWideMat = useRef(
    new THREE.MeshBasicMaterial({
      color: GREEN.grid,
      wireframe: true,
      transparent: true,
      opacity: 0.05,
    })
  );
  const grassMat = useRef(
    new THREE.MeshStandardMaterial({
      color: GREEN.grass,
      roughness: 0.96,
    })
  );
  const smokeMat = useRef(
    new THREE.MeshBasicMaterial({
      color: GREEN.fog,
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })
  );

  useEffect(() => {
    buildingMat.current.emissiveMap = windowTex;
    buildingMat.current.needsUpdate = true;
  }, [windowTex]);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load("/textures/grass.jpg", (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(40, 160);
      tex.colorSpace = THREE.SRGBColorSpace;
      grassMat.current.map = tex;
      grassMat.current.needsUpdate = true;
    });
    loader.load("/textures/smoke.png", (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      smokeMat.current.map = tex;
      smokeMat.current.needsUpdate = true;
    });
  }, []);

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

  const { scene } = useThree();

  useFrame((state) => {
    const p = scrollEngine.progress;
    const t = state.clock.elapsedTime;
    const travel = p * TRAVEL_MAX;
    const loopOffset = travel % SEGMENT;
    const blend = getCityWhiteBlend(p);
    blendRef.current = blend;

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

    lerpColor(buildingMat.current.color, GREEN.building, WHITE.building, blend);
    lerpColor(buildingMat.current.emissive, GREEN.emissive, WHITE.emissive, blend);
    buildingMat.current.emissiveIntensity = 0.85 * (1 - blend * 0.5) + blend * 0.15;
    if (blend < 0.85) {
      buildingMat.current.emissiveMap = windowTex;
    } else {
      buildingMat.current.emissiveMap = null;
    }

    lerpColor(wireMat.current.color, GREEN.wire, WHITE.wire, blend);
    wireMat.current.opacity = 0.22 * (1 - blend) + 0.08 * blend;

    lerpColor(gridMat.current.color, GREEN.grid, WHITE.grid, blend);
    gridMat.current.opacity = 0.14 * (1 - blend) + 0.06 * blend;

    lerpColor(gridWideMat.current.color, GREEN.grid, WHITE.grid, blend);
    gridWideMat.current.opacity = 0.05 * (1 - blend) + 0.03 * blend;

    lerpColor(grassMat.current.color, GREEN.grass, WHITE.grass, blend);

    lerpColor(smokeMat.current.color, GREEN.fog, WHITE.fog, blend);
    smokeMat.current.opacity = 0.1 * (1 - blend) + 0.06 * blend;

    if (scene.fog && scene.fog instanceof THREE.Fog) {
      lerpColor(scene.fog.color, new THREE.Color("#041208"), new THREE.Color("#f0f0f0"), blend);
    }
    if (scene.background instanceof THREE.Color) {
      lerpColor(scene.background, new THREE.Color("#030504"), new THREE.Color("#f5f5f5"), blend);
    }

    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("--city-white-blend", String(blend));
    }
  });

  return (
    <group ref={worldRef}>
      <instancedMesh
        ref={buildingsRef}
        args={[undefined, undefined, buildings.length]}
        material={buildingMat.current}
      >
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>

      <instancedMesh ref={wireRef} args={[undefined, undefined, buildings.length]} material={wireMat.current}>
        <boxGeometry args={[1.02, 1.02, 1.02]} />
      </instancedMesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.28, -60]} receiveShadow material={grassMat.current}>
        <planeGeometry args={[60, 260]} />
      </mesh>

      <mesh ref={gridRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.24, -30]} material={gridMat.current}>
        <planeGeometry args={[14, 260, 1, 52]} />
      </mesh>

      <mesh ref={gridWideRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.22, -30]} material={gridWideMat.current}>
        <planeGeometry args={[60, 260, 1, 20]} />
      </mesh>

      <group ref={fogRef}>
        {Array.from({ length: 16 }).map((_, i) => (
          <mesh
            key={`fog-${i}`}
            position={[((i % 2) * 2 - 1) * 6, 1.1, 8 - i * 5.5]}
            material={smokeMat.current}
          >
            <planeGeometry args={[10, 4.5]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

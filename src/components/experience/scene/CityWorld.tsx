"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { getCloudCityBlend, getCityWhiteBlend } from "@/lib/scroll/timeline";

const SEGMENT = 52;
const TRAVEL_MAX = 130;

const CYBER_GREEN = {
  building: new THREE.Color("#0a1208"),
  emissive: new THREE.Color("#39ff14"),
  wire: new THREE.Color("#39ff14"),
  floor: new THREE.Color("#081008"),
  grid: new THREE.Color("#39ff14"),
  fog: new THREE.Color("#39ff14"),
};

const CYBER_WHITE = {
  building: new THREE.Color("#ececec"),
  emissive: new THREE.Color("#ffffff"),
  wire: new THREE.Color("#ffffff"),
  floor: new THREE.Color("#f2f4f8"),
  grid: new THREE.Color("#d8dce6"),
  fog: new THREE.Color("#ffffff"),
};

function makeWindowTexture(isWhite: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = isWhite ? "#e0e0e0" : "#020804";
  ctx.fillRect(0, 0, 64, 128);
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 4; x++) {
      const on = Math.random() > (isWhite ? 0.25 : 0.32);
      if (isWhite) {
        ctx.fillStyle = on ? `rgba(255,255,255,${0.85 + Math.random() * 0.15})` : "#d5d5d5";
      } else {
        ctx.fillStyle = on
          ? `rgba(${30 + Math.random() * 40}, ${220 + Math.random() * 35}, ${40 + Math.random() * 30}, 0.95)`
          : "#010603";
      }
      ctx.fillRect(4 + x * 15, 4 + y * 12, 10, 8);
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
  for (let z = 16; z > -SEGMENT + 8; z -= 3) {
    for (const side of [-1, 1] as const) {
      const stagger = ((i * 17) % 7) * 0.3;
      const x = side * (7.5 + stagger + (i % 4) * 0.4);
      const h = 3.8 + ((i * 13) % 20) * 0.65;
      buildings.push({
        x,
        y: h / 2 - 2.1,
        z: z + offsetZ + ((i % 3) - 1) * 0.35,
        sx: 2.2 + (i % 5) * 0.3,
        sy: h,
        sz: 2.5 + (i % 4) * 0.25,
        ry: side * 0.03,
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
  const floorRef = useRef<THREE.Mesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const { buildings, greenWindowTex, whiteWindowTex } = useMemo(() => {
    const segments = 4;
    const all: BuildingData[] = [];
    for (let s = 0; s < segments; s++) {
      all.push(...generateSegment(-s * SEGMENT));
    }
    return {
      buildings: all,
      greenWindowTex: makeWindowTexture(false),
      whiteWindowTex: makeWindowTexture(true),
    };
  }, []);

  const buildingMat = useRef(
    new THREE.MeshStandardMaterial({
      color: CYBER_GREEN.building,
      emissive: CYBER_GREEN.emissive,
      emissiveIntensity: 0.9,
      roughness: 0.75,
      metalness: 0.2,
    })
  );
  const wireMat = useRef(
    new THREE.MeshBasicMaterial({
      color: CYBER_GREEN.wire,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  const floorMat = useRef(
    new THREE.MeshStandardMaterial({
      color: CYBER_GREEN.floor,
      roughness: 0.35,
      metalness: 0.65,
    })
  );
  const gridMat = useRef(
    new THREE.MeshBasicMaterial({
      color: CYBER_GREEN.grid,
      wireframe: true,
      transparent: true,
      opacity: 0.16,
    })
  );
  const smokeMat = useRef(
    new THREE.MeshBasicMaterial({
      color: CYBER_GREEN.fog,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })
  );

  useEffect(() => {
    buildingMat.current.emissiveMap = greenWindowTex;
    buildingMat.current.needsUpdate = true;
  }, [greenWindowTex]);

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

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load("/textures/smoke.png", (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      smokeMat.current.map = tex;
      smokeMat.current.needsUpdate = true;
    });
  }, []);

  const { scene } = useThree();

  useFrame((state) => {
    const p = scrollEngine.progress;
    const t = state.clock.elapsedTime;
    const travel = p * TRAVEL_MAX;
    const loopOffset = travel % SEGMENT;
    const cityReveal = getCloudCityBlend(p);
    const whiteBlend = getCityWhiteBlend(p);

    if (worldRef.current) {
      worldRef.current.position.z = -travel + loopOffset;
      worldRef.current.position.x = Math.sin(p * Math.PI * 1.5) * 0.25;
      worldRef.current.position.y = -6 + cityReveal * 6;
      worldRef.current.scale.setScalar(0.4 + cityReveal * 0.6);
      worldRef.current.visible = cityReveal > 0.02;
    }

    if (gridRef.current) {
      gridRef.current.position.z = -(travel * 0.35) % 8;
    }

    if (fogRef.current) {
      fogRef.current.children.forEach((child, i) => {
        child.position.y = 0.8 + Math.sin(t * 0.25 + i * 0.6) * 0.3;
      });
    }

    lerpColor(buildingMat.current.color, CYBER_GREEN.building, CYBER_WHITE.building, whiteBlend);
    lerpColor(buildingMat.current.emissive, CYBER_GREEN.emissive, CYBER_WHITE.emissive, whiteBlend);
    buildingMat.current.emissiveIntensity = 0.9 * (1 - whiteBlend * 0.4) + whiteBlend * 0.35;
    buildingMat.current.emissiveMap = whiteBlend > 0.5 ? whiteWindowTex : greenWindowTex;
    buildingMat.current.metalness = 0.2 + whiteBlend * 0.45;
    buildingMat.current.roughness = 0.75 * (1 - whiteBlend * 0.5);

    lerpColor(wireMat.current.color, CYBER_GREEN.wire, CYBER_WHITE.wire, whiteBlend);
    wireMat.current.opacity = 0.2 * (1 - whiteBlend) + 0.12 * whiteBlend;

    lerpColor(floorMat.current.color, CYBER_GREEN.floor, CYBER_WHITE.floor, whiteBlend);
    floorMat.current.metalness = 0.65 + whiteBlend * 0.25;
    floorMat.current.roughness = 0.35 * (1 - whiteBlend * 0.6);

    lerpColor(gridMat.current.color, CYBER_GREEN.grid, CYBER_WHITE.grid, whiteBlend);
    gridMat.current.opacity = 0.16 * (1 - whiteBlend) + 0.1 * whiteBlend;

    lerpColor(smokeMat.current.color, CYBER_GREEN.fog, CYBER_WHITE.fog, whiteBlend);
    smokeMat.current.opacity = 0.08 * (1 - whiteBlend) + 0.04 * whiteBlend;

    if (scene.fog && scene.fog instanceof THREE.Fog) {
      const fogGreen = new THREE.Color("#87b8d8");
      const fogWhite = new THREE.Color("#eef2f8");
      lerpColor(scene.fog.color, fogGreen, fogWhite, whiteBlend);
    }

    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("--city-white-blend", String(whiteBlend));
      document.documentElement.style.setProperty("--city-reveal-blend", String(cityReveal));
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

      <mesh
        ref={floorRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -2.26, -48]}
        receiveShadow
        material={floorMat.current}
      >
        <planeGeometry args={[56, 260]} />
      </mesh>

      <mesh ref={gridRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.24, -30]} material={gridMat.current}>
        <planeGeometry args={[14, 260, 1, 52]} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.23, -30]}>
        <planeGeometry args={[56, 260, 1, 24]} />
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.04} />
      </mesh>

      <group ref={fogRef}>
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh
            key={`fog-${i}`}
            position={[((i % 2) * 2 - 1) * 5.5, 0.9, 6 - i * 5.5]}
            material={smokeMat.current}
          >
            <planeGeometry args={[9, 3.5]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

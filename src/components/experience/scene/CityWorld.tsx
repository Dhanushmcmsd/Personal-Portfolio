"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import {
  getCityBlackPhase,
  getCityWhiteFireMaskY,
  getCityWhiteFireProgress,
  getCloudCityBlend,
} from "@/lib/scroll/timeline";

const SEGMENT = 52;
const TRAVEL_MAX = 130;
const FLOOR_LAYER_COUNT = 3;

const CYBER_GREEN = {
  building: new THREE.Color("#0a1208"),
  emissive: new THREE.Color("#39ff14"),
  wire: new THREE.Color("#39ff14"),
  grid: new THREE.Color("#39ff14"),
  fog: new THREE.Color("#39ff14"),
};

const CYBER_WHITE = {
  building: new THREE.Color("#ececec"),
  emissive: new THREE.Color("#ffffff"),
  wire: new THREE.Color("#ffffff"),
  grid: new THREE.Color("#d8dce6"),
  fog: new THREE.Color("#ffffff"),
};

const BLACK_VOID = new THREE.Color("#06080B");

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

function makeFireBandTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 64, 0, 0);
  grad.addColorStop(0, "rgba(255,255,255,0)");
  grad.addColorStop(0.25, "rgba(255,220,160,0.85)");
  grad.addColorStop(0.5, "rgba(255,140,60,0.75)");
  grad.addColorStop(0.75, "rgba(255,80,20,0.45)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 64);
  const tex = new THREE.CanvasTexture(canvas);
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

function applyClipBelow(mat: THREE.Material, maskY: number) {
  mat.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, 1, 0), -maskY)];
  mat.clipIntersection = false;
  mat.needsUpdate = true;
}

function applyClipAbove(mat: THREE.Material, maskY: number) {
  mat.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, -1, 0), maskY)];
  mat.clipIntersection = false;
  mat.needsUpdate = true;
}

export default function CityWorld() {
  const worldRef = useRef<THREE.Group>(null);
  const greenBuildingsRef = useRef<THREE.InstancedMesh>(null);
  const whiteBuildingsRef = useRef<THREE.InstancedMesh>(null);
  const greenWireRef = useRef<THREE.InstancedMesh>(null);
  const whiteWireRef = useRef<THREE.InstancedMesh>(null);
  const fireBandRef = useRef<THREE.Mesh>(null);
  const fogRef = useRef<THREE.Group>(null);
  const gridRef = useRef<THREE.Mesh>(null);
  const floorLayersRef = useRef<THREE.Mesh[]>([]);
  const floorTexturesRef = useRef<THREE.Texture[]>([]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const fireBandTex = useMemo(() => makeFireBandTexture(), []);

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

  const floorLayerMats = useRef(
    Array.from({ length: FLOOR_LAYER_COUNT }, (_, i) =>
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.92 - i * 0.12,
        depthWrite: i === 0,
        color: new THREE.Color("#ffffff"),
      })
    )
  );

  const greenBuildingMat = useRef(
    new THREE.MeshStandardMaterial({
      color: CYBER_GREEN.building,
      emissive: CYBER_GREEN.emissive,
      emissiveIntensity: 0.9,
      roughness: 0.75,
      metalness: 0.2,
    })
  );
  const whiteBuildingMat = useRef(
    new THREE.MeshStandardMaterial({
      color: CYBER_WHITE.building,
      emissive: CYBER_WHITE.emissive,
      emissiveIntensity: 0.35,
      roughness: 0.35,
      metalness: 0.65,
    })
  );
  const greenWireMat = useRef(
    new THREE.MeshBasicMaterial({
      color: CYBER_GREEN.wire,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  const whiteWireMat = useRef(
    new THREE.MeshBasicMaterial({
      color: CYBER_WHITE.wire,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
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
  const fireBandMat = useRef(
    new THREE.MeshBasicMaterial({
      map: fireBandTex,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })
  );

  useEffect(() => {
    greenBuildingMat.current.emissiveMap = greenWindowTex;
    greenBuildingMat.current.needsUpdate = true;
    whiteBuildingMat.current.emissiveMap = whiteWindowTex;
    whiteBuildingMat.current.needsUpdate = true;
  }, [greenWindowTex, whiteWindowTex]);

  useEffect(() => {
    if (!greenBuildingsRef.current || !whiteBuildingsRef.current) return;
    if (!greenWireRef.current || !whiteWireRef.current) return;
    buildings.forEach((b, i) => {
      dummy.position.set(b.x, b.y, b.z);
      dummy.scale.set(b.sx, b.sy, b.sz);
      dummy.rotation.set(0, b.ry, 0);
      dummy.updateMatrix();
      greenBuildingsRef.current!.setMatrixAt(i, dummy.matrix);
      whiteBuildingsRef.current!.setMatrixAt(i, dummy.matrix);
      greenWireRef.current!.setMatrixAt(i, dummy.matrix);
      whiteWireRef.current!.setMatrixAt(i, dummy.matrix);
    });
    greenBuildingsRef.current.instanceMatrix.needsUpdate = true;
    whiteBuildingsRef.current.instanceMatrix.needsUpdate = true;
    greenWireRef.current.instanceMatrix.needsUpdate = true;
    whiteWireRef.current.instanceMatrix.needsUpdate = true;
  }, [buildings, dummy]);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load("/textures/glitch-floor.jpg", (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 24);
      tex.colorSpace = THREE.SRGBColorSpace;
      floorTexturesRef.current = Array.from({ length: FLOOR_LAYER_COUNT }, () => {
        const clone = tex.clone();
        clone.needsUpdate = true;
        clone.wrapS = clone.wrapT = THREE.RepeatWrapping;
        clone.repeat.set(2 + Math.random() * 0.2, 24);
        return clone;
      });
      floorLayerMats.current.forEach((mat, i) => {
        mat.map = floorTexturesRef.current[i];
        mat.needsUpdate = true;
      });
    });
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
    const blackPhase = getCityBlackPhase(p);
    const fireProgress = getCityWhiteFireProgress(p);
    const maskY = getCityWhiteFireMaskY(p);

    if (worldRef.current) {
      worldRef.current.position.z = -travel + loopOffset;
      worldRef.current.position.x = Math.sin(p * Math.PI * 1.5) * 0.25;
      worldRef.current.position.y = -6 + cityReveal * 6;
      worldRef.current.scale.setScalar(0.4 + cityReveal * 0.6);
      worldRef.current.visible = cityReveal > 0.02;
    }

    applyClipBelow(greenBuildingMat.current, maskY);
    applyClipBelow(greenWireMat.current, maskY);
    applyClipAbove(whiteBuildingMat.current, maskY);
    applyClipAbove(whiteWireMat.current, maskY);

    if (fireBandRef.current) {
      fireBandRef.current.visible = fireProgress > 0.01 && fireProgress < 0.995;
      fireBandRef.current.position.y = maskY;
      fireBandRef.current.position.z = -30 + (travel * 0.02) % 4;
      fireBandMat.current.opacity = 0.55 + Math.sin(t * 8) * 0.15;
      if (fireBandMat.current.map) {
        fireBandMat.current.map.offset.x = t * 0.35;
      }
    }

    const floorScroll = (travel * 0.08) % 1;
    floorTexturesRef.current.forEach((tex, i) => {
      if (!tex) return;
      tex.offset.y = floorScroll + i * 0.08;
    });
    floorLayersRef.current.forEach((mesh, i) => {
      if (mesh) mesh.position.z = -48 - i * 0.35 - (travel * 0.02) % 2;
    });

    floorLayerMats.current.forEach((mat, i) => {
      const baseOpacity = 0.92 - i * 0.12;
      mat.opacity = baseOpacity * (1 - blackPhase * 0.92);
      lerpColor(mat.color, new THREE.Color("#ffffff"), BLACK_VOID, blackPhase);
      if (blackPhase > 0.85) {
        mat.map = null;
      } else if (floorTexturesRef.current[i] && !mat.map) {
        mat.map = floorTexturesRef.current[i];
      }
      mat.needsUpdate = true;
    });

    if (gridRef.current) {
      gridRef.current.position.z = -(travel * 0.35) % 8;
      gridMat.current.opacity = 0.16 * (1 - blackPhase * 0.9) * (1 - fireProgress * 0.4);
      lerpColor(gridMat.current.color, CYBER_GREEN.grid, CYBER_WHITE.grid, fireProgress);
    }

    if (fogRef.current) {
      fogRef.current.children.forEach((child, i) => {
        child.position.y = 0.8 + Math.sin(t * 0.25 + i * 0.6) * 0.3;
      });
    }

    lerpColor(smokeMat.current.color, CYBER_GREEN.fog, CYBER_WHITE.fog, fireProgress);
    smokeMat.current.opacity = 0.08 * (1 - fireProgress * 0.5) * (1 - blackPhase * 0.6);

    if (scene.fog && scene.fog instanceof THREE.Fog) {
      const fogGreen = new THREE.Color("#87b8d8");
      const fogWhite = new THREE.Color("#eef2f8");
      const fogColor = new THREE.Color().lerpColors(fogGreen, fogWhite, fireProgress);
      lerpColor(scene.fog.color, fogColor, BLACK_VOID, blackPhase);
      scene.fog.far = 48 + fireProgress * 20 - blackPhase * 10;
    }

    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("--city-white-blend", String(fireProgress));
      document.documentElement.style.setProperty("--city-reveal-blend", String(cityReveal));
      document.documentElement.style.setProperty("--city-black-phase", String(blackPhase));
    }
  });

  return (
    <group ref={worldRef}>
      <instancedMesh
        ref={greenBuildingsRef}
        args={[undefined, undefined, buildings.length]}
        material={greenBuildingMat.current}
      >
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>

      <instancedMesh
        ref={whiteBuildingsRef}
        args={[undefined, undefined, buildings.length]}
        material={whiteBuildingMat.current}
      >
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>

      <instancedMesh
        ref={greenWireRef}
        args={[undefined, undefined, buildings.length]}
        material={greenWireMat.current}
      >
        <boxGeometry args={[1.02, 1.02, 1.02]} />
      </instancedMesh>

      <instancedMesh
        ref={whiteWireRef}
        args={[undefined, undefined, buildings.length]}
        material={whiteWireMat.current}
      >
        <boxGeometry args={[1.02, 1.02, 1.02]} />
      </instancedMesh>

      <mesh ref={fireBandRef} material={fireBandMat.current} visible={false}>
        <planeGeometry args={[56, 1.8]} />
      </mesh>

      {Array.from({ length: FLOOR_LAYER_COUNT }).map((_, i) => (
        <mesh
          key={`floor-${i}`}
          ref={(el) => {
            if (el) floorLayersRef.current[i] = el;
          }}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -2.26 + i * 0.002, -48 - i * 0.35]}
          material={floorLayerMats.current[i]}
        >
          <planeGeometry args={[56, 260]} />
        </mesh>
      ))}

      <mesh ref={gridRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.24, -30]} material={gridMat.current}>
        <planeGeometry args={[14, 260, 1, 52]} />
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

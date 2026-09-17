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
  SECTION,
} from "@/lib/scroll/timeline";

const SEGMENT = 52;
const TRAVEL_MAX = 130;

const WINDOW_VARIANTS = 3;
const CAP_HEIGHT_THRESHOLD = 7.2;
const SKYLINE_COUNT = 52;

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

/** Deterministic pseudo-random in [0, 1) — stable across renders */
function hash(seed: number): number {
  const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const COLUMN_INNER_X = [7.5, 10.6, 14.4];
const COLUMN_H_BASE = [3.8, 4.9, 6.4];
const COLUMN_H_SPREAD = [13, 17, 22];

function makeWindowTexture(isWhite: boolean, variant: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const densityOff = [0, 0.06, -0.05][variant];
  const litWarmth = variant === 0 ? 0 : variant === 1 ? 8 : -10;

  ctx.fillStyle = isWhite ? "#e0e0e0" : "#020804";
  ctx.fillRect(0, 0, 128, 256);

  const baseDensity = isWhite ? 0.25 + densityOff : 0.32 + densityOff;
  for (let y = 0; y < 20; y++) {
    for (let x = 0; x < 8; x++) {
      const seed = variant * 10000 + y * 137 + x * 971;
      const on = hash(seed) > baseDensity;
      if (isWhite) {
        const a = on ? 0.85 + hash(seed + 1) * 0.15 : 0;
        ctx.fillStyle = on ? `rgba(255,${255 + litWarmth},${255 + litWarmth},${a})` : "#d5d5d5";
      } else {
        ctx.fillStyle = on
          ? `rgba(${30 + hash(seed + 2) * 40}, ${220 + hash(seed + 3) * 35 + litWarmth}, ${40 + hash(seed + 4) * 30}, 0.95)`
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

function makeWindowTextureSet(isWhite: boolean) {
  return [0, 1, 2].map((v) => makeWindowTexture(isWhite, v));
}

function applyFresnelRim(mat: THREE.MeshStandardMaterial, rimColor: THREE.Color) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uRimColor = { value: rimColor };
    shader.fragmentShader =
      `uniform vec3 uRimColor;\n` +
      shader.fragmentShader.replace(
        "#include <opaque_fragment>",
        `
        float rimDot = 1.0 - max( dot( normal, geometryViewDir ), 0.0 );
        outgoingLight += uRimColor * rimDot * 0.28;
        #include <opaque_fragment>
        `
      );
  };
  mat.customProgramCacheKey = () => `fresnel-rim-${rimColor.getHexString()}`;
}

function makeBuildingMaterial(
  buildingColor: THREE.Color,
  emissiveColor: THREE.Color,
  emissiveIntensity: number,
  roughness: number,
  metalness: number
) {
  const mat = new THREE.MeshStandardMaterial({
    color: buildingColor,
    emissive: emissiveColor,
    emissiveIntensity,
    roughness,
    metalness,
  });
  applyFresnelRim(mat, emissiveColor);
  return mat;
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
  variant: number;
  hasCap: boolean;
};

function pushColumnBuilding(
  buildings: BuildingData[],
  index: number,
  z: number,
  offsetZ: number,
  side: -1 | 1,
  col: number,
  zJitter = true
) {
  const seed = index * 131 + z * 17 + col * 53 + side * 19;
  const stagger = hash(seed + 1) * 2.1;
  const x = side * (COLUMN_INNER_X[col] + stagger + hash(seed + 2) * 0.55);
  const h = COLUMN_H_BASE[col] + hash(seed + 3) * COLUMN_H_SPREAD[col] * 0.65;
  const variant = Math.floor(hash(seed + 7) * WINDOW_VARIANTS) % WINDOW_VARIANTS;
  buildings.push({
    x,
    y: h / 2 - 2.1,
    z: z + offsetZ + (zJitter ? (hash(seed + 4) - 0.5) * 0.7 : 0),
    sx: 2.2 + hash(seed + 5) * 1.4,
    sy: h,
    sz: 2.5 + hash(seed + 6) * 0.95,
    ry: side * (0.02 + hash(seed + 8) * 0.02),
    variant,
    hasCap: h > CAP_HEIGHT_THRESHOLD,
  });
}

function generateSegment(offsetZ: number): BuildingData[] {
  const buildings: BuildingData[] = [];
  let i = 0;
  for (let z = 16; z > -SEGMENT + 8; z -= 2.2) {
    for (const side of [-1, 1] as const) {
      for (let col = 0; col < 3; col++) {
        pushColumnBuilding(buildings, i, z, offsetZ, side, col);
        i++;
      }
    }
  }
  return buildings;
}

/** Foreground rows that stay visible as the camera travels deeper into the city */
function generateForwardRows(offsetZ = 0): BuildingData[] {
  const buildings: BuildingData[] = [];
  let i = 0;
  const forwardX = [7.8, 11.0, 14.8];
  const forwardHBase = [3.2, 4.0, 5.2];
  const forwardHSpread = [11, 14, 18];
  for (let z = 20; z <= 78; z += 2.5) {
    for (const side of [-1, 1] as const) {
      for (let col = 0; col < 3; col++) {
        const seed = i * 97 + z * 23 + col * 41 + side * 11;
        const h = forwardHBase[col] + hash(seed) * forwardHSpread[col] * 0.55;
        const variant = Math.floor(hash(seed + 7) * WINDOW_VARIANTS) % WINDOW_VARIANTS;
        buildings.push({
          x: side * (forwardX[col] + hash(seed + 1) * 0.45),
          y: h / 2 - 2.1,
          z: z + offsetZ,
          sx: 2.1 + hash(seed + 2) * 1.0,
          sy: h,
          sz: 2.4 + hash(seed + 3) * 0.75,
          ry: side * (0.02 + hash(seed + 4) * 0.015),
          variant,
          hasCap: h > CAP_HEIGHT_THRESHOLD,
        });
        i++;
      }
    }
  }
  return buildings;
}

function generateDistantSkyline(): BuildingData[] {
  const buildings: BuildingData[] = [];
  const zMin = -SEGMENT * 6 + 12;
  const zMax = 82;
  for (let i = 0; i < SKYLINE_COUNT; i++) {
    const seed = i * 3191 + 17;
    const side = hash(seed) > 0.5 ? 1 : -1;
    const z = zMin + hash(seed + 1) * (zMax - zMin);
    const x = side * (16.5 + hash(seed + 2) * 7.5);
    const footprint = 5 + hash(seed + 3) * 7;
    const h = 1.8 + hash(seed + 4) * 3.5;
    buildings.push({
      x,
      y: h / 2 - 2.1,
      z,
      sx: footprint,
      sy: h,
      sz: footprint * (0.75 + hash(seed + 5) * 0.35),
      ry: side * 0.01,
      variant: 0,
      hasCap: false,
    });
  }
  return buildings;
}

function lerpColor(target: THREE.Color, a: THREE.Color, b: THREE.Color, t: number) {
  target.copy(a).lerp(b, t);
  return target;
}

const clipBelowPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 2.5);
const clipAbovePlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), -2.5);

function applyClipBelow(mat: THREE.Material, maskY: number) {
  clipBelowPlane.constant = -maskY;
  mat.clippingPlanes = [clipBelowPlane];
  mat.clipIntersection = false;
}

function applyClipAbove(mat: THREE.Material, maskY: number) {
  clipAbovePlane.constant = maskY;
  mat.clippingPlanes = [clipAbovePlane];
  mat.clipIntersection = false;
}

function capTransformFromBuilding(b: BuildingData, dummy: THREE.Object3D, capSeed: number) {
  const capSx = b.sx * (0.4 + hash(capSeed) * 0.2);
  const capSy = b.sy * (0.15 + hash(capSeed + 1) * 0.1);
  const capSz = b.sz * (0.4 + hash(capSeed + 2) * 0.2);
  const capY = b.y + b.sy / 2 + capSy / 2;
  dummy.position.set(b.x, capY, b.z);
  dummy.scale.set(capSx, capSy, capSz);
  dummy.rotation.set(0, b.ry, 0);
  dummy.updateMatrix();
}

export default function CityWorld() {
  const worldRef = useRef<THREE.Group>(null);
  const greenBuildingRefs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const whiteBuildingRefs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const greenCapRef = useRef<THREE.InstancedMesh>(null);
  const whiteCapRef = useRef<THREE.InstancedMesh>(null);
  const greenSkylineRef = useRef<THREE.InstancedMesh>(null);
  const whiteSkylineRef = useRef<THREE.InstancedMesh>(null);
  const greenWireRef = useRef<THREE.InstancedMesh>(null);
  const whiteWireRef = useRef<THREE.InstancedMesh>(null);
  const fireBandRef = useRef<THREE.Mesh>(null);
  const fogRef = useRef<THREE.Group>(null);
  const gridRef = useRef<THREE.Mesh>(null);
  const floorRef = useRef<THREE.Mesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const fireBandTex = useMemo(() => makeFireBandTexture(), []);

  const {
    buildings,
    skyline,
    variantCounts,
    capCount,
    greenWindowTex,
    whiteWindowTex,
  } = useMemo(() => {
    const segments = 6;
    const all: BuildingData[] = [];
    for (let s = 0; s < segments; s++) {
      all.push(...generateSegment(-s * SEGMENT));
    }
    all.push(...generateSegment(SEGMENT));
    all.push(...generateForwardRows());
    all.push(...generateForwardRows(SEGMENT));
    for (let z = 78; z > -SEGMENT * segments; z -= 2.5) {
      for (const side of [-1, 1] as const) {
        for (let col = 0; col < 3; col++) {
          const seed = z * 31 + side * 47 + col * 61;
          const h = 4.5 + hash(seed) * 11 * 0.55;
          const variant = Math.floor(hash(seed + 7) * WINDOW_VARIANTS) % WINDOW_VARIANTS;
          all.push({
            x: side * (9.2 + col * 2.8 + hash(seed + 1) * 0.55),
            y: h / 2 - 2.1,
            z,
            sx: 2.2 + hash(seed + 2) * 0.6,
            sy: h,
            sz: 2.6 + hash(seed + 3) * 0.5,
            ry: side * (0.015 + hash(seed + 4) * 0.015),
            variant,
            hasCap: h > CAP_HEIGHT_THRESHOLD,
          });
        }
      }
    }

    const skylineBuildings = generateDistantSkyline();
    const counts = [0, 0, 0];
    all.forEach((b) => {
      counts[b.variant]++;
    });
    let caps = 0;
    all.forEach((b) => {
      if (b.hasCap) caps++;
    });

    const totalInstances =
      all.length * 4 + caps * 2 + skylineBuildings.length * 2;
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[CityWorld] instance count: ${totalInstances} (buildings: ${all.length}, caps: ${caps}, skyline: ${skylineBuildings.length})`
      );
    }

    return {
      buildings: all,
      skyline: skylineBuildings,
      variantCounts: counts,
      capCount: caps,
      greenWindowTex: makeWindowTextureSet(false),
      whiteWindowTex: makeWindowTextureSet(true),
    };
  }, []);

  const floorMat = useRef(
    new THREE.MeshBasicMaterial({
      color: "#000000",
      transparent: false,
      depthWrite: true,
    })
  );

  const greenBuildingMats = useRef(
    [0, 1, 2].map(() =>
      makeBuildingMaterial(CYBER_GREEN.building, CYBER_GREEN.emissive, 0.9, 0.75, 0.2)
    )
  );
  const whiteBuildingMats = useRef(
    [0, 1, 2].map(() =>
      makeBuildingMaterial(CYBER_WHITE.building, CYBER_WHITE.emissive, 0.35, 0.35, 0.65)
    )
  );
  const greenCapMat = useRef(
    makeBuildingMaterial(CYBER_GREEN.building, CYBER_GREEN.emissive, 0.85, 0.75, 0.2)
  );
  const whiteCapMat = useRef(
    makeBuildingMaterial(CYBER_WHITE.building, CYBER_WHITE.emissive, 0.32, 0.35, 0.65)
  );
  const greenSkylineMat = useRef(
    makeBuildingMaterial(CYBER_GREEN.building, CYBER_GREEN.emissive, 0.12, 0.85, 0.15)
  );
  const whiteSkylineMat = useRef(
    makeBuildingMaterial(CYBER_WHITE.building, CYBER_WHITE.emissive, 0.06, 0.4, 0.55)
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
    greenBuildingMats.current.forEach((mat, i) => {
      mat.emissiveMap = greenWindowTex[i];
      mat.needsUpdate = true;
    });
    whiteBuildingMats.current.forEach((mat, i) => {
      mat.emissiveMap = whiteWindowTex[i];
      mat.needsUpdate = true;
    });
  }, [greenWindowTex, whiteWindowTex]);

  useEffect(() => {
    const variantSlot = [0, 0, 0];
    const greenMeshes = greenBuildingRefs.current;
    const whiteMeshes = whiteBuildingRefs.current;
    if (!greenMeshes.every(Boolean) || !whiteMeshes.every(Boolean)) return;
    if (!greenWireRef.current || !whiteWireRef.current) return;

    buildings.forEach((b, i) => {
      dummy.position.set(b.x, b.y, b.z);
      dummy.scale.set(b.sx, b.sy, b.sz);
      dummy.rotation.set(0, b.ry, 0);
      dummy.updateMatrix();
      const v = b.variant;
      const slot = variantSlot[v];
      greenMeshes[v]!.setMatrixAt(slot, dummy.matrix);
      whiteMeshes[v]!.setMatrixAt(slot, dummy.matrix);
      greenWireRef.current!.setMatrixAt(i, dummy.matrix);
      whiteWireRef.current!.setMatrixAt(i, dummy.matrix);
      variantSlot[v]++;
    });

    greenMeshes.forEach((mesh) => {
      if (mesh) mesh.instanceMatrix.needsUpdate = true;
    });
    whiteMeshes.forEach((mesh) => {
      if (mesh) mesh.instanceMatrix.needsUpdate = true;
    });
    greenWireRef.current.instanceMatrix.needsUpdate = true;
    whiteWireRef.current.instanceMatrix.needsUpdate = true;

    if (greenCapRef.current && whiteCapRef.current && capCount > 0) {
      let capSlot = 0;
      buildings.forEach((b, i) => {
        if (!b.hasCap) return;
        capTransformFromBuilding(b, dummy, i * 173 + b.z * 7);
        greenCapRef.current!.setMatrixAt(capSlot, dummy.matrix);
        whiteCapRef.current!.setMatrixAt(capSlot, dummy.matrix);
        capSlot++;
      });
      greenCapRef.current.instanceMatrix.needsUpdate = true;
      whiteCapRef.current.instanceMatrix.needsUpdate = true;
    }

    if (greenSkylineRef.current && whiteSkylineRef.current) {
      skyline.forEach((b, i) => {
        dummy.position.set(b.x, b.y, b.z);
        dummy.scale.set(b.sx, b.sy, b.sz);
        dummy.rotation.set(0, b.ry, 0);
        dummy.updateMatrix();
        greenSkylineRef.current!.setMatrixAt(i, dummy.matrix);
        whiteSkylineRef.current!.setMatrixAt(i, dummy.matrix);
      });
      greenSkylineRef.current.instanceMatrix.needsUpdate = true;
      whiteSkylineRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [buildings, skyline, capCount, dummy]);

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
    const blackPhase = getCityBlackPhase(p);
    const fireProgress = getCityWhiteFireProgress(p);
    const maskY = getCityWhiteFireMaskY(p);
    const dimFactor = 1;

    if (worldRef.current) {
      worldRef.current.position.z = -travel + loopOffset;
      worldRef.current.position.x = Math.sin(p * Math.PI * 1.5) * 0.25;
      worldRef.current.position.y = -6 + cityReveal * 6;
      worldRef.current.scale.setScalar(0.4 + cityReveal * 0.6);
      worldRef.current.visible = cityReveal > 0.02;
    }

    const clipGreenMats = [
      ...greenBuildingMats.current,
      greenCapMat.current,
      greenSkylineMat.current,
    ];
    const clipWhiteMats = [
      ...whiteBuildingMats.current,
      whiteCapMat.current,
      whiteSkylineMat.current,
    ];
    clipGreenMats.forEach((mat) => applyClipBelow(mat, maskY));
    clipWhiteMats.forEach((mat) => applyClipAbove(mat, maskY));
    applyClipBelow(greenWireMat.current, maskY);
    applyClipAbove(whiteWireMat.current, maskY);

    const inExperience = p >= SECTION.experience[0] && p <= SECTION.experience[1];

    if (fireBandRef.current) {
      fireBandRef.current.visible =
        !inExperience && fireProgress > 0.01 && fireProgress < 0.995;
      fireBandRef.current.position.y = maskY;
      fireBandRef.current.position.z = -30 + (travel * 0.02) % 4;
      fireBandMat.current.opacity = (0.55 + Math.sin(t * 8) * 0.15) * dimFactor;
      if (fireBandMat.current.map) {
        fireBandMat.current.map.offset.x = t * 0.35;
      }
    }

    if (floorRef.current) {
      const floorScroll = (travel * 0.02) % 2;
      floorRef.current.visible = cityReveal > 0.05;
      floorRef.current.position.z = -48 - floorScroll;
    }

    if (gridRef.current) {
      gridRef.current.position.z = -30 - (travel * 0.35) % 8;
      gridRef.current.visible = cityReveal > 0.02 && !inExperience;
      gridMat.current.opacity =
        0.08 * (1 - blackPhase * 0.85) * (1 - fireProgress * 0.4) * dimFactor;
      lerpColor(gridMat.current.color, CYBER_GREEN.grid, BLACK_VOID, blackPhase);
    }

    if (fogRef.current) {
      fogRef.current.children.forEach((child, i) => {
        child.position.y = 0.8 + Math.sin(t * 0.25 + i * 0.6) * 0.3;
      });
    }

    lerpColor(smokeMat.current.color, CYBER_GREEN.fog, CYBER_WHITE.fog, fireProgress);
    smokeMat.current.opacity =
      0.08 * (1 - fireProgress * 0.5) * (1 - blackPhase * 0.6) * dimFactor;

    greenBuildingMats.current.forEach((mat) => {
      mat.emissiveIntensity = 0.9 * dimFactor;
    });
    whiteBuildingMats.current.forEach((mat) => {
      mat.emissiveIntensity = 0.35 * dimFactor;
    });
    greenCapMat.current.emissiveIntensity = 0.85 * dimFactor;
    whiteCapMat.current.emissiveIntensity = 0.32 * dimFactor;
    greenSkylineMat.current.emissiveIntensity = 0.12 * dimFactor;
    whiteSkylineMat.current.emissiveIntensity = 0.06 * dimFactor;
    greenWireMat.current.opacity = 0.2 * dimFactor;
    whiteWireMat.current.opacity = 0.12 * dimFactor;

    if (scene.fog && scene.fog instanceof THREE.Fog) {
      lerpColor(scene.fog.color, new THREE.Color("#06080B"), BLACK_VOID, blackPhase);
    }

    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("--city-white-blend", String(fireProgress));
      document.documentElement.style.setProperty("--city-reveal-blend", String(cityReveal));
      document.documentElement.style.setProperty("--city-black-phase", String(blackPhase));
    }
  });

  return (
    <>
      <group ref={worldRef}>
        {[0, 1, 2].map((v) => (
          <instancedMesh
            key={`green-bld-${v}`}
            ref={(el) => {
              greenBuildingRefs.current[v] = el;
            }}
            args={[undefined, undefined, variantCounts[v]]}
            material={greenBuildingMats.current[v]}
          >
            <boxGeometry args={[1, 1, 1]} />
          </instancedMesh>
        ))}

        {[0, 1, 2].map((v) => (
          <instancedMesh
            key={`white-bld-${v}`}
            ref={(el) => {
              whiteBuildingRefs.current[v] = el;
            }}
            args={[undefined, undefined, variantCounts[v]]}
            material={whiteBuildingMats.current[v]}
          >
            <boxGeometry args={[1, 1, 1]} />
          </instancedMesh>
        ))}

        {capCount > 0 && (
          <>
            <instancedMesh
              ref={greenCapRef}
              args={[undefined, undefined, capCount]}
              material={greenCapMat.current}
            >
              <boxGeometry args={[1, 1, 1]} />
            </instancedMesh>
            <instancedMesh
              ref={whiteCapRef}
              args={[undefined, undefined, capCount]}
              material={whiteCapMat.current}
            >
              <boxGeometry args={[1, 1, 1]} />
            </instancedMesh>
          </>
        )}

        <instancedMesh
          ref={greenSkylineRef}
          args={[undefined, undefined, skyline.length]}
          material={greenSkylineMat.current}
        >
          <boxGeometry args={[1, 1, 1]} />
        </instancedMesh>
        <instancedMesh
          ref={whiteSkylineRef}
          args={[undefined, undefined, skyline.length]}
          material={whiteSkylineMat.current}
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

        <mesh
          ref={floorRef}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -2.26, -48]}
          material={floorMat.current}
          visible={false}
        >
          <planeGeometry args={[56, 260]} />
        </mesh>

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
    </>
  );
}

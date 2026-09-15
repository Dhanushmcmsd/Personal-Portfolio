"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollEngine } from "@/lib/scroll/scrollEngine";

function makeWindowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#061018";
  ctx.fillRect(0, 0, 64, 128);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 4; x++) {
      const on = Math.random() > 0.32;
      ctx.fillStyle = on
        ? `rgba(${40 + Math.random() * 60}, ${210 + Math.random() * 45}, 255, 0.95)`
        : "#040a10";
      ctx.fillRect(4 + x * 15, 6 + y * 15, 10, 10);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeNeonLineMaterial(color: string, opacity = 0.55) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

export default function CityWorld() {
  const worldRef = useRef<THREE.Group>(null);
  const buildingsRef = useRef<THREE.InstancedMesh>(null);
  const neonLinesRef = useRef<THREE.InstancedMesh>(null);
  const fogRef = useRef<THREE.Group>(null);
  const sideFogRef = useRef<THREE.Group>(null);
  const grassMat = useRef(
    new THREE.MeshStandardMaterial({
      color: "#2f4a28",
      roughness: 0.95,
      metalness: 0.05,
    })
  );
  const roadMat = useRef(
    new THREE.MeshBasicMaterial({
      color: "#081018",
      transparent: true,
      opacity: 0.85,
    })
  );
  const smokeMat = useRef(
    new THREE.MeshBasicMaterial({
      color: "#7adfff",
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })
  );

  const { buildingMatrices, buildingColors, neonMatrices, windowTex } = useMemo(() => {
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const buildingMatrices: THREE.Matrix4[] = [];
    const buildingColors: THREE.Color[] = [];
    const neonMatrices: THREE.Matrix4[] = [];
    let i = 0;

    for (let z = 18; z > -130; z -= 3.1) {
      for (const side of [-1, 1] as const) {
        const stagger = ((i * 19) % 7) * 0.28;
        const x = side * (8.2 + stagger + (i % 3) * 0.4);
        const h = 3.5 + ((i * 11) % 19) * 0.62;
        dummy.position.set(x, h / 2 - 2.2, z + ((i % 4) - 1.5) * 0.35);
        dummy.scale.set(2.3 + (i % 5) * 0.28, h, 2.6 + (i % 4) * 0.25);
        dummy.rotation.y = side * 0.04;
        dummy.updateMatrix();
        buildingMatrices.push(dummy.matrix.clone());
        color.setHSL(0.52 + (i % 9) * 0.012, 0.42, 0.1 + (i % 6) * 0.018);
        buildingColors.push(color.clone());

        dummy.position.set(x * 1.02, h * 0.5 - 2.2, z);
        dummy.scale.set(0.08, h * 1.02, 2.65 + (i % 4) * 0.25);
        dummy.updateMatrix();
        neonMatrices.push(dummy.matrix.clone());
        i++;
      }
    }

    return {
      buildingMatrices,
      buildingColors,
      neonMatrices,
      windowTex: makeWindowTexture(),
    };
  }, []);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load("/textures/grass.jpg", (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(36, 120);
      tex.colorSpace = THREE.SRGBColorSpace;
      grassMat.current.map = tex;
      grassMat.current.needsUpdate = true;
    });
    loader.load("/textures/brick.jpg", (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      if (buildingsRef.current) {
        const mat = buildingsRef.current.material as THREE.MeshStandardMaterial;
        mat.map = tex;
        mat.needsUpdate = true;
      }
    });
    loader.load("/textures/smoke.png", (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      smokeMat.current.map = tex;
      smokeMat.current.needsUpdate = true;
    });
  }, []);

  useEffect(() => {
    if (!buildingsRef.current) return;
    buildingMatrices.forEach((m, i) => {
      buildingsRef.current!.setMatrixAt(i, m);
      buildingsRef.current!.setColorAt(i, buildingColors[i]);
    });
    buildingsRef.current.instanceMatrix.needsUpdate = true;
    if (buildingsRef.current.instanceColor) {
      buildingsRef.current.instanceColor.needsUpdate = true;
    }

    if (neonLinesRef.current) {
      neonMatrices.forEach((m, i) => {
        neonLinesRef.current!.setMatrixAt(i, m);
      });
      neonLinesRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [buildingMatrices, buildingColors, neonMatrices]);

  useFrame((state) => {
    const p = scrollEngine.progress;
    const t = state.clock.elapsedTime;
    const travel = p * 92;

    if (worldRef.current) {
      worldRef.current.position.z = -travel;
      worldRef.current.position.x = Math.sin(p * Math.PI * 2) * 0.35;
    }

    if (fogRef.current) {
      fogRef.current.children.forEach((child, i) => {
        child.position.y = 1.1 + Math.sin(t * 0.35 + i * 0.7) * 0.45;
        child.rotation.z = Math.sin(t * 0.12 + i) * 0.15;
        child.position.x = Math.sin(t * 0.08 + i) * 1.2;
      });
    }

    if (sideFogRef.current) {
      sideFogRef.current.children.forEach((child, i) => {
        child.position.z = (i % 2 === 0 ? -1 : 1) * 2 + Math.sin(t * 0.2 + i) * 3 - travel * 0.15;
      });
    }
  });

  const cyanNeon = useMemo(() => makeNeonLineMaterial("#00E5FF", 0.65), []);
  const purpleNeon = useMemo(() => makeNeonLineMaterial("#8B5CFF", 0.45), []);

  return (
    <group ref={worldRef}>
      <instancedMesh
        ref={buildingsRef}
        args={[undefined, undefined, buildingMatrices.length]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#14202a"
          emissiveMap={windowTex}
          emissive="#5ecfff"
          emissiveIntensity={0.95}
          roughness={0.78}
          metalness={0.22}
        />
      </instancedMesh>

      <instancedMesh
        ref={neonLinesRef}
        args={[undefined, undefined, neonMatrices.length]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#00E5FF"
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.32, -48]} receiveShadow material={grassMat.current}>
        <planeGeometry args={[56, 200]} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.28, -48]} material={roadMat.current}>
        <planeGeometry args={[10, 200]} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.26, -48]}>
        <planeGeometry args={[56, 200, 1, 40]} />
        <meshBasicMaterial color="#00E5FF" wireframe transparent opacity={0.08} />
      </mesh>

      <group ref={fogRef}>
        {Array.from({ length: 18 }).map((_, i) => (
          <mesh
            key={`fog-${i}`}
            position={[((i % 2) * 2 - 1) * 6.5, 1.3, 10 - i * 6.8]}
            material={smokeMat.current}
          >
            <planeGeometry args={[11, 5.5]} />
          </mesh>
        ))}
      </group>

      <group ref={sideFogRef}>
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh
            key={`side-${i}`}
            position={[i % 2 === 0 ? -14 : 14, 2.5, -20 - i * 12]}
            material={smokeMat.current}
          >
            <planeGeometry args={[6, 16]} />
          </mesh>
        ))}
      </group>

      {[-18, -42, -66, -90].map((z, i) => (
        <group key={`accent-${z}`} position={[0, 0, z]}>
          <mesh position={[-11, 1.5, 0]} material={cyanNeon}>
            <boxGeometry args={[0.04, 8 + (i % 3) * 2, 0.04]} />
          </mesh>
          <mesh position={[11, 1.8, 0]} material={purpleNeon}>
            <boxGeometry args={[0.04, 6 + (i % 4) * 2, 0.04]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

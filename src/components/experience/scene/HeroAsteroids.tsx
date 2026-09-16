"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { getHeroCloudOpacity } from "@/lib/scroll/timeline";

const ASTEROID_COUNT = 22;

type AsteroidState = {
  x: number;
  y: number;
  z: number;
  speed: number;
  rx: number;
  ry: number;
  rz: number;
  spinX: number;
  spinY: number;
  spinZ: number;
  scale: number;
};

function seedAsteroids(): AsteroidState[] {
  return Array.from({ length: ASTEROID_COUNT }, (_, i) => ({
    x: (Math.random() - 0.5) * 28,
    y: 2 + Math.random() * 14,
    z: -1.5 - (i % 6) * 1.1 - Math.random() * 2,
    speed: 1.1 + Math.random() * 1.8,
    rx: Math.random() * Math.PI,
    ry: Math.random() * Math.PI,
    rz: Math.random() * Math.PI,
    spinX: (Math.random() - 0.5) * 0.9,
    spinY: (Math.random() - 0.5) * 0.7,
    spinZ: (Math.random() - 0.5) * 0.5,
    scale: 0.06 + Math.random() * 0.14,
  }));
}

export default function HeroAsteroids() {
  const groupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const states = useMemo(() => seedAsteroids(), []);
  const { camera } = useThree();

  const asteroidMat = useRef(
    new THREE.MeshStandardMaterial({
      color: "#1a1a1a",
      emissive: "#0a0808",
      emissiveIntensity: 0.15,
      roughness: 0.92,
      metalness: 0.08,
      flatShading: true,
      transparent: true,
      opacity: 0.9,
    })
  );

  useFrame((state, delta) => {
    const heroVis = getHeroCloudOpacity(scrollEngine.progress);
    const group = groupRef.current;
    if (!group) return;

    group.visible = heroVis > 0.02;
    asteroidMat.current.opacity = heroVis * 0.88;

    const anchor = new THREE.Vector3(0, 0.4, -5);
    anchor.applyQuaternion(camera.quaternion);
    anchor.add(camera.position);
    group.position.copy(anchor);
    group.quaternion.copy(camera.quaternion);

    states.forEach((a, i) => {
      a.y -= a.speed * delta;
      a.rx += a.spinX * delta;
      a.ry += a.spinY * delta;
      a.rz += a.spinZ * delta;

      if (a.y < -8) {
        a.y = 10 + Math.random() * 6;
        a.x = (Math.random() - 0.5) * 28;
        a.z = -1.5 - Math.random() * 6;
      }

      const mesh = meshRefs.current[i];
      if (!mesh) return;
      mesh.position.set(a.x, a.y, a.z);
      mesh.rotation.set(a.rx, a.ry, a.rz);
      mesh.scale.setScalar(a.scale * (0.85 + heroVis * 0.15));
    });
  });

  return (
    <group ref={groupRef} visible={false}>
      {states.map((a, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
          position={[a.x, a.y, a.z]}
          material={asteroidMat.current}
        >
          <dodecahedronGeometry args={[1, 0]} />
        </mesh>
      ))}
    </group>
  );
}

"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PORTFOLIO_CONFIG } from "@/config/portfolio";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { rangeProgress } from "@/lib/scroll/timeline";
import { subtleHaptic } from "@/lib/haptics";

export interface Fruit {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Euler;
  scale: number;
  lifetime: number;
}

interface FruitSystemProps {
  fruits: Fruit[];
  onCatch: (id: number) => void;
  virusPositionRef: React.MutableRefObject<THREE.Vector3>;
}

const FRUIT_COLORS = ["#a855f7", "#f472b6", "#fbbf24", "#34d399"];

export default function FruitSystem({ fruits, onCatch, virusPositionRef }: FruitSystemProps) {
  const meshRefs = useRef<Map<number, THREE.Mesh>>(new Map());

  const fruitGeo = useMemo(() => new THREE.SphereGeometry(0.12, 12, 12), []);

  useFrame((_, delta) => {
    const p = scrollEngine.progress;
    const finalStart = PORTFOLIO_CONFIG.interaction.finalSceneStart;
    const active = rangeProgress(p, finalStart, finalStart + 0.1) > 0.5;

    for (const fruit of fruits) {
      const mesh = meshRefs.current.get(fruit.id);
      if (!mesh) continue;

      mesh.visible = active;
      if (!active) continue;

      fruit.velocity.y -= 2.5 * delta;
      fruit.position.addScaledVector(fruit.velocity, delta);
      fruit.rotation.x += delta * 2;
      fruit.rotation.z += delta * 1.5;
      fruit.lifetime -= delta;

      mesh.position.copy(fruit.position);
      mesh.rotation.copy(fruit.rotation);
      mesh.scale.setScalar(fruit.scale);

      const dist = fruit.position.distanceTo(virusPositionRef.current);
      if (dist < 0.55) {
        subtleHaptic(6);
        onCatch(fruit.id);
      }

      if (fruit.lifetime <= 0 || fruit.position.y < -3) {
        onCatch(fruit.id);
      }
    }
  });

  return (
    <group>
      {fruits.map((fruit, i) => (
        <mesh
          key={fruit.id}
          ref={(el) => {
            if (el) meshRefs.current.set(fruit.id, el);
            else meshRefs.current.delete(fruit.id);
          }}
          geometry={fruitGeo}
        >
          <meshStandardMaterial
            color={FRUIT_COLORS[i % FRUIT_COLORS.length]}
            emissive={FRUIT_COLORS[i % FRUIT_COLORS.length]}
            emissiveIntensity={0.4}
            roughness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

export function screenToWorld(
  clientX: number,
  clientY: number,
  camera: THREE.Camera,
  width: number,
  height: number,
  depth = -71
): THREE.Vector3 {
  const ndc = new THREE.Vector3(
    (clientX / width) * 2 - 1,
    -(clientY / height) * 2 + 1,
    0.5
  );
  ndc.unproject(camera);
  const dir = ndc.sub(camera.position).normalize();
  const dist = (depth - camera.position.z) / dir.z;
  return camera.position.clone().add(dir.multiplyScalar(dist));
}

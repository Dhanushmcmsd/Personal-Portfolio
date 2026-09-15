"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { PORTFOLIO_CONFIG } from "@/config/portfolio";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { exclusiveOpacity, rangeProgress, SECTION } from "@/lib/scroll/timeline";
import { subtleHaptic } from "@/lib/haptics";

export interface Fruit {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Euler;
  scale: number;
  lifetime: number;
  emoji: string;
  eating: boolean;
}

interface FruitSystemProps {
  fruits: Fruit[];
  onEatStart: (fruit: Fruit) => void;
  onCatch: (id: number) => void;
  virusPositionRef: React.MutableRefObject<THREE.Vector3>;
  eatingFruitId: number | null;
  eatProgress: number;
}

const FRUIT_EMOJIS = ["🍎", "🍊", "🍇", "🍌", "🍓", "🍒", "🥝"];

export function randomFruitEmoji() {
  return FRUIT_EMOJIS[Math.floor(Math.random() * FRUIT_EMOJIS.length)];
}

export default function FruitSystem({
  fruits,
  onEatStart,
  onCatch,
  virusPositionRef,
  eatingFruitId,
  eatProgress,
}: FruitSystemProps) {
  const startedEatingRef = useRef<Set<number>>(new Set());

  useFrame((_, delta) => {
    const p = scrollEngine.progress;
    const contactActive =
      exclusiveOpacity(p, SECTION.contact[0], SECTION.contact[1], 0.04) > 0.35;
    const finalStart = PORTFOLIO_CONFIG.interaction.finalSceneStart;
    const inDropZone = rangeProgress(p, finalStart, finalStart + 0.1) > 0.5;
    const active = contactActive && inDropZone;

    if (!active) {
      startedEatingRef.current.clear();
    }

    for (const fruit of fruits) {
      if (fruit.eating || fruit.id === eatingFruitId) {
        fruit.scale = Math.max(0.05, 1 - eatProgress * 0.95);
        continue;
      }

      if (!active) continue;

      fruit.velocity.y -= 2.5 * delta;
      fruit.position.addScaledVector(fruit.velocity, delta);
      fruit.rotation.x += delta * 2;
      fruit.rotation.z += delta * 1.5;
      fruit.lifetime -= delta;

      const dist = fruit.position.distanceTo(virusPositionRef.current);
      if (dist < 0.38 && !startedEatingRef.current.has(fruit.id) && eatingFruitId === null) {
        startedEatingRef.current.add(fruit.id);
        fruit.velocity.set(0, 0, 0);
        subtleHaptic(6);
        onEatStart(fruit);
      }

      if (fruit.lifetime <= 0 || fruit.position.y < -3) {
        onCatch(fruit.id);
      }
    }
  });

  const visibleFruits = useMemo(
    () => fruits.filter((f) => f.scale > 0.04),
    [fruits, eatProgress, eatingFruitId]
  );

  return (
    <group>
      {visibleFruits.map((fruit) => (
        <group key={fruit.id} position={fruit.position}>
          <Html
            center
            distanceFactor={14}
            style={{
              fontSize: "13px",
              lineHeight: 1,
              pointerEvents: "none",
              userSelect: "none",
              transform: `scale(${fruit.scale})`,
              opacity: fruit.eating ? 1 - eatProgress : 1,
            }}
          >
            {fruit.emoji}
          </Html>
        </group>
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

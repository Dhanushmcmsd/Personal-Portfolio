"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { exclusiveOpacity, SECTION } from "@/lib/scroll/timeline";
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
  static: boolean;
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
  const groupRefs = useRef<Map<number, THREE.Group>>(new Map());
  const startedEatingRef = useRef<Set<number>>(new Set());
  const eatingFruitIdRef = useRef<number | null>(null);

  eatingFruitIdRef.current = eatingFruitId;

  useFrame((_, delta) => {
    const p = scrollEngine.progress;
    const active = exclusiveOpacity(p, SECTION.contact[0], SECTION.contact[1], 0.08) > 0.12;

    if (!active) {
      startedEatingRef.current.clear();
    }

    for (const fruit of fruits) {
      const group = groupRefs.current.get(fruit.id);

      if (fruit.eating || fruit.id === eatingFruitIdRef.current) {
        fruit.scale = Math.max(0.05, 1 - eatProgress * 0.95);
        if (group) {
          group.position.copy(fruit.position);
          group.scale.setScalar(fruit.scale);
        }
        continue;
      }

      if (!active) {
        if (group) group.visible = false;
        continue;
      }

      if (group) group.visible = true;

      if (!fruit.static) {
        fruit.velocity.y -= 1.2 * delta;
        fruit.position.addScaledVector(fruit.velocity, delta);
        fruit.rotation.x += delta * 2;
        fruit.rotation.z += delta * 1.5;
      }
      fruit.lifetime -= delta;

      if (group) {
        group.position.copy(fruit.position);
        group.scale.setScalar(fruit.scale);
      }

      const dist = fruit.position.distanceTo(virusPositionRef.current);
      if (
        dist < 0.65 &&
        !startedEatingRef.current.has(fruit.id) &&
        eatingFruitIdRef.current === null
      ) {
        startedEatingRef.current.add(fruit.id);
        fruit.velocity.set(0, 0, 0);
        subtleHaptic(6);
        onEatStart(fruit);
      }

      if (fruit.lifetime <= 0) {
        onCatch(fruit.id);
      }
    }
  });

  return (
    <group>
      {fruits.map((fruit) => (
        <group
          key={fruit.id}
          ref={(el) => {
            if (el) groupRefs.current.set(fruit.id, el);
            else groupRefs.current.delete(fruit.id);
          }}
        />
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
  distance = 4.2
): THREE.Vector3 {
  const ndc = new THREE.Vector2(
    (clientX / width) * 2 - 1,
    -(clientY / height) * 2 + 1
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(ndc, camera);
  return raycaster.ray.at(distance, new THREE.Vector3());
}

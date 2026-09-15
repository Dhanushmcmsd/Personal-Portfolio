"use client";

import { Suspense, useCallback, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { PORTFOLIO_CONFIG } from "@/config/portfolio";
import { useExperienceStore } from "@/stores/experienceStore";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { exclusiveOpacity, rangeProgress, SECTION } from "@/lib/scroll/timeline";
import Atmosphere from "./Atmosphere";
import CameraRig from "./CameraRig";
import CityWorld from "./CityWorld";
import CloudSky from "./CloudSky";
import ProjectExhibit from "./ProjectExhibit";
import VirusMascot, { EAT_DURATION_MS, type EatTarget } from "./VirusMascot";
import FruitSystem, { randomFruitEmoji, screenToWorld, type Fruit } from "./FruitSystem";

const PROJECT_SLOTS = [
  { z: -14, x: 0, side: 1 as const },
  { z: -28, x: 0.4, side: -1 as const },
  { z: -42, x: -0.25, side: 1 as const },
  { z: -56, x: 0.35, side: -1 as const },
];

export default function ExperienceScene() {
  const openProject = useExperienceStore((s) => s.openProject);
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [fruitTarget, setFruitTarget] = useState<THREE.Vector3 | null>(null);
  const [eatingFruitId, setEatingFruitId] = useState<number | null>(null);
  const [eatProgress, setEatProgress] = useState(0);
  const eatStartRef = useRef(0);
  const eatPositionRef = useRef<THREE.Vector3 | null>(null);
  const virusPositionRef = useRef(new THREE.Vector3(0, 0.5, -8));
  const fruitIdRef = useRef(0);
  const { camera, size } = useThree();

  const spawnFruit = useCallback(
    (clientX: number, clientY: number) => {
      const p = scrollEngine.progress;
      const contactActive =
        exclusiveOpacity(p, SECTION.contact[0], SECTION.contact[1], 0.04) > 0.35;
      const finalStart = PORTFOLIO_CONFIG.interaction.finalSceneStart;
      if (!contactActive || rangeProgress(p, finalStart, finalStart + 0.1) < 0.5) return;
      if (eatingFruitId !== null) return;

      const worldPos = screenToWorld(clientX, clientY, camera, size.width, size.height);
      const id = fruitIdRef.current++;
      const fruit: Fruit = {
        id,
        position: worldPos.clone(),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          0.2 + Math.random() * 0.3,
          (Math.random() - 0.5) * 0.3
        ),
        rotation: new THREE.Euler(),
        scale: 1,
        lifetime: 5,
        emoji: randomFruitEmoji(),
        eating: false,
      };
      setFruits((prev) => [...prev, fruit]);
      setFruitTarget(worldPos.clone());
    },
    [camera, size.width, size.height, eatingFruitId]
  );

  const handleEatStart = useCallback((fruit: Fruit) => {
    eatStartRef.current = performance.now();
    eatPositionRef.current = fruit.position.clone();
    setEatingFruitId(fruit.id);
    setEatProgress(0);
    setFruitTarget(null);
    setFruits((prev) =>
      prev.map((f) => (f.id === fruit.id ? { ...f, eating: true, velocity: new THREE.Vector3() } : f))
    );
  }, []);

  const handleCatch = useCallback((id: number) => {
    setFruits((prev) => prev.filter((f) => f.id !== id));
    if (eatingFruitId === id) {
      setEatingFruitId(null);
      setEatProgress(0);
      eatPositionRef.current = null;
    }
  }, [eatingFruitId]);

  useFrame(() => {
    if (eatingFruitId === null || !eatPositionRef.current) return;
    const progress = Math.min(1, (performance.now() - eatStartRef.current) / EAT_DURATION_MS);
    setEatProgress(progress);
    if (progress >= 1) {
      handleCatch(eatingFruitId);
    }
  });

  const eatTarget: EatTarget | null =
    eatingFruitId !== null && eatPositionRef.current
      ? { position: eatPositionRef.current, progress: eatProgress }
      : null;

  return (
    <>
      <Atmosphere />
      <CameraRig />

      <ambientLight intensity={0.45} />
      <directionalLight position={[5, 12, 6]} intensity={0.85} color="#ffffff" castShadow />
      <directionalLight position={[-4, 4, -8]} intensity={0.3} color="#6eb5e8" />
      <hemisphereLight args={["#87ceeb", "#1a2a20", 0.5]} />

      <Suspense fallback={null}>
        <CloudSky />
        <CityWorld />

        {PORTFOLIO_CONFIG.projects.map((project, i) => (
          <ProjectExhibit
            key={project.id}
            project={project}
            zPosition={PROJECT_SLOTS[i]?.z ?? -14 - i * 14}
            xOffset={PROJECT_SLOTS[i]?.x ?? 0}
            side={PROJECT_SLOTS[i]?.side ?? (i % 2 === 0 ? 1 : -1)}
            onSelect={() => openProject(project)}
          />
        ))}

        <VirusMascot
          targetPosition={fruitTarget}
          eatTarget={eatTarget}
          positionRef={virusPositionRef}
        />
        <FruitSystem
          fruits={fruits}
          onEatStart={handleEatStart}
          onCatch={handleCatch}
          virusPositionRef={virusPositionRef}
          eatingFruitId={eatingFruitId}
          eatProgress={eatProgress}
        />
      </Suspense>

      <mesh
        position={[0, 0, -82]}
        visible={false}
        onPointerDown={(e) => {
          spawnFruit(e.clientX, e.clientY);
        }}
      >
        <planeGeometry args={[30, 20]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </>
  );
}

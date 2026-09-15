"use client";

import { Suspense, useCallback, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { PORTFOLIO_CONFIG } from "@/config/portfolio";
import { useExperienceStore } from "@/stores/experienceStore";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { exclusiveOpacity, SECTION } from "@/lib/scroll/timeline";
import Atmosphere from "./Atmosphere";
import CameraRig from "./CameraRig";
import CityWorld from "./CityWorld";
import CloudSky from "./CloudSky";
import HotAirBalloon from "./HotAirBalloon";
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
  const eatingFruitIdRef = useRef<number | null>(null);
  const { camera, size } = useThree();

  const spawnFruitAt = useCallback(
    (clientX: number, clientY: number) => {
      const p = scrollEngine.progress;
      const contactActive =
        exclusiveOpacity(p, SECTION.contact[0], SECTION.contact[1], 0.04) > 0.25;
      if (!contactActive || eatingFruitIdRef.current !== null) return;

      const worldPos = screenToWorld(clientX, clientY, camera, size.width, size.height);
      const id = fruitIdRef.current++;
      const fruit: Fruit = {
        id,
        position: worldPos.clone(),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.15,
          -0.05 - Math.random() * 0.1,
          (Math.random() - 0.5) * 0.1
        ),
        rotation: new THREE.Euler(),
        scale: 1,
        lifetime: 8,
        emoji: randomFruitEmoji(),
        eating: false,
      };
      setFruits((prev) => [...prev, fruit]);
      setFruitTarget(worldPos.clone());
    },
    [camera, size.width, size.height]
  );

  const handleEatStart = useCallback((fruit: Fruit) => {
    eatStartRef.current = performance.now();
    eatPositionRef.current = fruit.position.clone();
    eatingFruitIdRef.current = fruit.id;
    setEatingFruitId(fruit.id);
    setEatProgress(0);
    setFruitTarget(null);
    setFruits((prev) =>
      prev.map((f) => (f.id === fruit.id ? { ...f, eating: true, velocity: new THREE.Vector3() } : f))
    );
  }, []);

  const handleCatch = useCallback((id: number) => {
    setFruits((prev) => prev.filter((f) => f.id !== id));
    if (eatingFruitIdRef.current === id) {
      eatingFruitIdRef.current = null;
      setEatingFruitId(null);
      setEatProgress(0);
      eatPositionRef.current = null;
    }
  }, []);

  useFrame(() => {
    const drop = useExperienceStore.getState().fruitDropAt;
    if (drop) {
      spawnFruitAt(drop.clientX, drop.clientY);
      useExperienceStore.getState().clearFruitDrop();
    }

    if (eatingFruitIdRef.current === null || !eatPositionRef.current) return;
    const progress = Math.min(1, (performance.now() - eatStartRef.current) / EAT_DURATION_MS);
    setEatProgress(progress);
    if (progress >= 1) {
      handleCatch(eatingFruitIdRef.current);
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
      <hemisphereLight args={["#87ceeb", "#06080B", 0.5]} />

      <Suspense fallback={null}>
        <CloudSky />
        <HotAirBalloon />
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
    </>
  );
}

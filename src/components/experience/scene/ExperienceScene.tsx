"use client";

import { Suspense, useCallback, useRef, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { PORTFOLIO_CONFIG } from "@/config/portfolio";
import { useExperienceStore } from "@/stores/experienceStore";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { rangeProgress } from "@/lib/scroll/timeline";
import Atmosphere from "./Atmosphere";
import CameraRig from "./CameraRig";
import CityWorld from "./CityWorld";
import ProjectExhibit from "./ProjectExhibit";
import VirusMascot from "./VirusMascot";
import FruitSystem, { screenToWorld, type Fruit } from "./FruitSystem";

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
  const [catchPulse, setCatchPulse] = useState(0);
  const virusPositionRef = useRef(new THREE.Vector3(0, 0.5, -8));
  const fruitIdRef = useRef(0);
  const { camera, size } = useThree();

  const spawnFruit = useCallback(
    (clientX: number, clientY: number) => {
      const p = scrollEngine.progress;
      const finalStart = PORTFOLIO_CONFIG.interaction.finalSceneStart;
      if (rangeProgress(p, finalStart, finalStart + 0.12) < 0.5) return;

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
        lifetime: 4,
      };
      setFruits((prev) => [...prev, fruit]);
      setFruitTarget(worldPos.clone());
    },
    [camera, size.width, size.height]
  );

  const handleCatch = useCallback((id: number) => {
    setFruits((prev) => prev.filter((f) => f.id !== id));
    setFruitTarget(null);
    setCatchPulse(1);
    setTimeout(() => setCatchPulse(0), 200);
  }, []);

  return (
    <>
      <Atmosphere />
      <CameraRig />

      <ambientLight intensity={0.28} />
      <directionalLight position={[5, 10, 4]} intensity={0.75} color="#F4F1EA" castShadow />
      <directionalLight position={[-6, 3, -12]} intensity={0.35} color="#00E5FF" />
      <hemisphereLight args={["#1a3040", "#06080B", 0.35]} />

      <Suspense fallback={null}>
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
          catchPulse={catchPulse}
          positionRef={virusPositionRef}
        />
        <FruitSystem
          fruits={fruits}
          onCatch={handleCatch}
          virusPositionRef={virusPositionRef}
        />
      </Suspense>

      <mesh
        position={[0, 0, -82]}
        visible={false}
        onPointerDown={(e) => {
          const p = scrollEngine.progress;
          const finalStart = PORTFOLIO_CONFIG.interaction.finalSceneStart;
          if (rangeProgress(p, finalStart, finalStart + 0.12) > 0.5) {
            spawnFruit(e.clientX, e.clientY);
          }
        }}
      >
        <planeGeometry args={[30, 20]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </>
  );
}

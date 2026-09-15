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
import ProjectExhibit from "./ProjectExhibit";
import VirusMascot from "./VirusMascot";
import FruitSystem, { screenToWorld, type Fruit } from "./FruitSystem";

const PROJECT_POSITIONS = [
  { z: -14, x: 0 },
  { z: -28, x: 0.5 },
  { z: -42, x: -0.3 },
];

export default function ExperienceScene() {
  const openProject = useExperienceStore((s) => s.openProject);
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [fruitTarget, setFruitTarget] = useState<THREE.Vector3 | null>(null);
  const [catchPulse, setCatchPulse] = useState(0);
  const virusPositionRef = useRef(new THREE.Vector3(1.8, -0.4, -71.5));
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

      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} color="#F4F1EA" />
      <directionalLight position={[-4, 2, -10]} intensity={0.3} color="#00E5FF" />

      <Suspense fallback={null}>
        {PORTFOLIO_CONFIG.projects.map((project, i) => (
          <ProjectExhibit
            key={project.id}
            project={project}
            zPosition={PROJECT_POSITIONS[i].z}
            xOffset={PROJECT_POSITIONS[i].x}
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

      {/* Invisible click plane for fruit spawning in final scene */}
      <mesh
        position={[0, 0, -71]}
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

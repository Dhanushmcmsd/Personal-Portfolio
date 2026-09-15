"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { motion } from "framer-motion";
import Image from "next/image";
import Bee3D from "./Bee3D";

interface Food {
  id: number;
  x: number;
  y: number;
}

interface BeeState {
  x: number;
  y: number;
  z: number;
}

interface InteractiveBeeProps {
  onDepthChange?: (z: number, inFront: boolean) => void;
}

function screenToWorld(
  x: number,
  y: number,
  z: number,
  width: number,
  height: number
): [number, number, number] {
  const wx = (x / width) * 7 - 3.5;
  const wy = -(y / height) * 4 + 2;
  return [wx, wy, z];
}

function BeeScene({
  beeState,
  buzzing,
  foods,
  onDepthReport,
}: {
  beeState: BeeState;
  buzzing: boolean;
  foods: Food[];
  onDepthReport: (z: number) => void;
}) {
  const { size } = useThree();
  const beeGroupRef = useRef<import("three").Group>(null);
  const lastDepthRef = useRef(false);

  useFrame(() => {
    const pos = screenToWorld(beeState.x, beeState.y, beeState.z, size.width, size.height);
    if (beeGroupRef.current) {
      beeGroupRef.current.position.set(pos[0], pos[1], pos[2]);
    }

    const inFront = beeState.z > 0;
    if (inFront !== lastDepthRef.current) {
      lastDepthRef.current = inFront;
      onDepthReport(beeState.z);
    }
  });

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
      <directionalLight position={[-3, 2, 4]} intensity={0.4} color="#fff5cc" />
      <pointLight position={[0, 0, 3]} intensity={0.3} color="#F5C518" />

      <group ref={beeGroupRef}>
        <Bee3D position={[0, 0, 0]} buzzing={buzzing} />
      </group>

      {foods.map((food) => {
        const [fx, fy, fz] = screenToWorld(food.x, food.y, 0.5, size.width, size.height);
        return (
          <mesh key={food.id} position={[fx, fy, fz]}>
            <sphereGeometry args={[0.12, 12, 12]} />
            <meshStandardMaterial
              color="#a855f7"
              emissive="#a855f7"
              emissiveIntensity={0.6}
              roughness={0.3}
            />
          </mesh>
        );
      })}
    </>
  );
}

export default function InteractiveBee({ onDepthChange }: InteractiveBeeProps) {
  const [beeState, setBeeState] = useState<BeeState>({ x: 0, y: 0, z: -1 });
  const [foods, setFoods] = useState<Food[]>([]);
  const [target, setTarget] = useState<{ x: number; y: number } | null>(null);
  const [isBuzzing, setIsBuzzing] = useState(false);
  const [beeInFront, setBeeInFront] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const foodIdRef = useRef(0);
  const timeRef = useRef(0);

  const handleDepthReport = useCallback(
    (z: number) => {
      const inFront = z > 0;
      setBeeInFront(inFront);
      onDepthChange?.(z, inFront);
    },
    [onDepthChange]
  );

  useEffect(() => {
    let animationId: number;
    const animate = () => {
      timeRef.current += 0.016;

      if (!target) {
        const t = timeRef.current;
        setBeeState({
          x: Math.sin(t * 0.7) * 120 + Math.cos(t * 1.3) * 60,
          y: Math.sin(t * 0.5) * 80 + Math.sin(t * 0.9) * 40,
          z: Math.sin(t * 0.6) * 2.5,
        });
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [target]);

  useEffect(() => {
    if (!target) return;

    const moveInterval = setInterval(() => {
      setBeeState((prev) => {
        const dx = target.x - prev.x;
        const dy = target.y - prev.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 20) {
          setTarget(null);
          setIsBuzzing(false);
          setFoods((f) => f.filter((food) => food.x !== target.x || food.y !== target.y));
          return prev;
        }

        const progress = 1 - dist / 400;
        const targetZ = Math.sin(progress * Math.PI) * 3;

        return {
          x: prev.x + (dx / dist) * 10,
          y: prev.y + (dy / dist) * 10,
          z: targetZ,
        };
      });
    }, 30);

    return () => clearInterval(moveInterval);
  }, [target]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const id = foodIdRef.current++;
    setFoods((prev) => [...prev, { id, x, y }]);
    setTarget({ x, y });
    setIsBuzzing(true);
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 cursor-pointer"
      onClick={handleClick}
      aria-label="Click to feed the bee"
      style={{ zIndex: beeInFront ? 20 : 5 }}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <BeeScene
            beeState={beeState}
            buzzing={isBuzzing}
            foods={foods}
            onDepthReport={handleDepthReport}
          />
        </Suspense>
      </Canvas>

      <motion.div
        className="pointer-events-none absolute"
        style={{
          left: `calc(50% + ${beeState.x + 80}px)`,
          top: `calc(50% + ${beeState.y - 60}px)`,
          zIndex: beeState.z > 0 ? 25 : 3,
          transform: `scale(${1 + beeState.z * 0.08})`,
          opacity: 0.85,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.85 }}
        transition={{ delay: 1 }}
      >
        <Image
          src="/alien-mascot.png"
          alt="Pixel mascot"
          width={48}
          height={48}
          className="drop-shadow-lg"
          style={{ filter: beeState.z < 0 ? "blur(0.5px)" : "none" }}
        />
      </motion.div>
    </div>
  );
}

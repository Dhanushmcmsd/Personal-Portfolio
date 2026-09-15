"use client";

import { useState, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { projects, personalInfo } from "@/data/resume";

function NeonFrame({
  color,
  position,
  active,
}: {
  color: string;
  position: [number, number, number];
  active: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <group position={position}>
        <mesh ref={meshRef}>
          <boxGeometry args={[3, 2, 0.1]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={active ? 0.8 : 0.3}
            transparent
            opacity={0.15}
          />
        </mesh>
        <mesh>
          <boxGeometry args={[3.1, 2.1, 0.05]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={active ? 0.8 : 0.4} />
        </mesh>
      </group>
    </Float>
  );
}

function GalleryScene({ activeIndex }: { activeIndex: number }) {
  const positions: [number, number, number][] = [
    [-4, 0, 0],
    [0, 0, -2],
    [4, 0, 0],
  ];

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#00f0ff" />
      <pointLight position={[-10, -5, 5]} intensity={0.5} color="#ff6b9d" />

      {projects.map((project, i) => (
        <NeonFrame
          key={project.id}
          color={project.color}
          position={positions[i]}
          active={i === activeIndex}
        />
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[30, 30, 30, 30]} />
        <meshBasicMaterial color="#00f0ff" wireframe transparent opacity={0.15} />
      </mesh>

    </>
  );
}

export default function ProjectGallery() {
  const [activeIndex, setActiveIndex] = useState(0);
  const project = projects[activeIndex];

  const next = () => setActiveIndex((i) => (i + 1) % projects.length);
  const prev = () => setActiveIndex((i) => (i - 1 + projects.length) % projects.length);

  return (
    <section id="work" className="relative min-h-screen bg-dark overflow-hidden">
      <div className="absolute inset-0 grid-floor opacity-30" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(0,240,255,0.08) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-24 md:px-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-neon-cyan/60">
              Motion Gallery
            </span>
            <h2 className="mt-2 font-display text-3xl text-white md:text-5xl">
              SELECTED WORK
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={prev}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-neon-cyan/30 text-neon-cyan transition-all hover:border-neon-cyan hover:bg-neon-cyan/10"
              aria-label="Previous project"
            >
              ←
            </button>
            <button
              onClick={next}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-neon-cyan/30 text-neon-cyan transition-all hover:border-neon-cyan hover:bg-neon-cyan/10"
              aria-label="Next project"
            >
              →
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-8 lg:flex-row lg:items-center">
          <div className="relative h-[300px] flex-1 overflow-hidden rounded-2xl border border-neon-cyan/20 lg:h-[450px]">
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center text-neon-cyan/50">
                  Loading 3D scene...
                </div>
              }
            >
              <Canvas camera={{ position: [0, 2, 8], fov: 50 }}>
                <GalleryScene activeIndex={activeIndex} />
              </Canvas>
            </Suspense>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-dark via-transparent to-transparent" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={project.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
              className="w-full rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md lg:w-[400px]"
            >
              <div className="flex items-center gap-3">
                <span
                  className="rounded-full px-3 py-1 text-[10px] uppercase tracking-widest"
                  style={{
                    backgroundColor: `${project.color}20`,
                    color: project.color,
                    border: `1px solid ${project.color}40`,
                  }}
                >
                  {project.tag}
                </span>
                <span className="text-[10px] text-white/40">PROJECT {project.number}</span>
              </div>

              <h3
                className="mt-6 font-display text-4xl leading-none glow-cyan"
                style={{ color: project.color }}
              >
                {project.title}
              </h3>
              <p className="mt-1 text-lg text-white/60">{project.subtitle}</p>

              <p className="mt-6 text-sm leading-relaxed text-white/70">
                {project.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {project.tech.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-white/5 px-2 py-1 text-[10px] text-white/50"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-white/30">
                    Engine
                  </span>
                  <p className="text-xs text-white/60">{project.engine}</p>
                </div>
                <a
                  href={personalInfo.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full px-5 py-2 text-xs font-medium transition-all"
                  style={{
                    backgroundColor: `${project.color}20`,
                    color: project.color,
                    border: `1px solid ${project.color}50`,
                  }}
                >
                  View code →
                </a>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex justify-center gap-3">
          {projects.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setActiveIndex(i)}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === activeIndex ? "2rem" : "0.5rem",
                backgroundColor: i === activeIndex ? p.color : "rgba(255,255,255,0.2)",
              }}
              aria-label={`Go to project ${p.title}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

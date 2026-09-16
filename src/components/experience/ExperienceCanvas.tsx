"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useExperienceStore } from "@/stores/experienceStore";
import ExperienceScene from "./scene/ExperienceScene";
import WebGLFallback from "./WebGLFallback";

export default function ExperienceCanvas() {
  const setLoaded = useExperienceStore((s) => s.setLoaded);
  const setLoadProgress = useExperienceStore((s) => s.setLoadProgress);
  const [webglFailed, setWebglFailed] = useState(false);
  const [dpr, setDpr] = useState(1);

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const cap = isMobile ? 1.25 : 2;
    setDpr(Math.min(cap, window.devicePixelRatio || 1));

    const durationMs = 7200;
    const start = performance.now();
    let raf = 0;

    const tick = () => {
      const elapsed = performance.now() - start;
      const progress = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setLoadProgress(progress);

      if (progress >= 100) {
        window.setTimeout(() => setLoaded(true), 800);
        return;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [setLoaded, setLoadProgress]);

  if (webglFailed) return <WebGLFallback />;

  return (
    <div className="experience-canvas fixed inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 14], fov: 50, near: 0.1, far: 200 }}
        gl={{
          alpha: false,
          antialias: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, dpr]}
        onCreated={({ gl }) => {
          gl.setClearColor("#6eb5e8", 1);
          gl.localClippingEnabled = true;
        }}
        onError={() => setWebglFailed(true)}
      >
        <Suspense fallback={null}>
          <ExperienceScene />
        </Suspense>
      </Canvas>
    </div>
  );
}

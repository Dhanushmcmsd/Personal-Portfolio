"use client";

import { useEffect, useRef, useState } from "react";
import { useExperienceStore } from "@/stores/experienceStore";

export default function ProjectSheet() {
  const activeProject = useExperienceStore((s) => s.activeProject);
  const sheetOpen = useExperienceStore((s) => s.sheetOpen);
  const closeProject = useExperienceStore((s) => s.closeProject);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(0);
  const dragStartRef = useRef(0);

  useEffect(() => {
    if (!sheetOpen) setDragY(0);
  }, [sheetOpen]);

  if (!activeProject || !sheetOpen) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - dragStartRef.current;
    if (delta > 0) setDragY(delta);
  };

  const handleTouchEnd = () => {
    if (dragY > 100) closeProject();
    setDragY(0);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={closeProject}
    >
      <div
        ref={sheetRef}
        className="pointer-events-auto w-full max-w-lg rounded-t-2xl border border-white/10 bg-[#0D1117]/95 p-6 transition-transform"
        style={{
          transform: `translateY(${dragY}px)`,
          paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
        <span className="text-[10px] tracking-[0.3em] text-white/40">
          PROJECT {activeProject.index}
        </span>
        <h3
          className="mt-2 font-[family-name:var(--font-display)] text-3xl"
          style={{ color: activeProject.color }}
        >
          {activeProject.title}
        </h3>
        <p className="text-sm text-white/60">{activeProject.subtitle}</p>
        <p className="mt-4 text-sm leading-relaxed text-white/70">{activeProject.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {activeProject.technologies.map((t) => (
            <span key={t} className="rounded-md bg-white/5 px-2 py-1 text-[10px] text-white/50">
              {t}
            </span>
          ))}
        </div>
        <div className="mt-6 flex gap-3">
          <a
            href={activeProject.github}
            target="_blank"
            rel="noopener noreferrer"
            className="pressable rounded-full border border-white/20 px-5 py-2 text-xs text-white/80"
          >
            GitHub →
          </a>
          {activeProject.live && (
            <a
              href={activeProject.live}
              target="_blank"
              rel="noopener noreferrer"
              className="pressable rounded-full px-5 py-2 text-xs text-[#06080B]"
              style={{ backgroundColor: activeProject.color }}
            >
              Live →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

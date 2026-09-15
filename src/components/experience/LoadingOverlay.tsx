"use client";

import { useExperienceStore } from "@/stores/experienceStore";

export default function LoadingOverlay() {
  const loaded = useExperienceStore((s) => s.loaded);
  const loadProgress = useExperienceStore((s) => s.loadProgress);

  if (loaded) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#06080B]">
      <p className="text-[10px] uppercase tracking-[0.4em] text-[#F4F1EA]/40">
        Entering world
      </p>
      <div className="mt-8 h-px w-48 overflow-hidden bg-white/10">
        <div
          className="h-full bg-[#00E5FF] transition-all duration-300"
          style={{ width: `${loadProgress}%` }}
        />
      </div>
      <p className="mt-4 font-mono text-xs text-[#F4F1EA]/30">{loadProgress}%</p>
    </div>
  );
}

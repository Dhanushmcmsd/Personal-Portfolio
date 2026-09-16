"use client";

import { useEffect, useRef } from "react";
import { useExperienceStore } from "@/stores/experienceStore";

const SKY_HERO = "#6eb5e8";

function labelForProgress(progress: number) {
  if (progress < 40) return "INITIATING TIME JUMP";
  if (progress < 75) return "WARPING THROUGH SPACE-TIME";
  return "APPROACHING EARTH ATMOSPHERE";
}

function labelColor(progress: number) {
  if (progress < 75) return "rgba(244, 241, 234, 0.72)";
  return "rgba(244, 241, 234, 0.88)";
}

function stageStyles(progress: number) {
  const p = progress / 100;

  const lightScale = 1 + p * 2.1;
  const lightBlur = 2 + p * 14;
  const lightWarp = 1 + Math.sin(p * Math.PI * 3) * 0.04 * p;

  const earthFadeIn = Math.min(1, Math.max(0, (p - 0.34) / 0.22));
  const earthStage = Math.min(1, Math.max(0, (p - 0.38) / 0.52));
  const bottomZoom = 1.08 + earthStage * 1.35;
  const bottomPanY = 8 + earthStage * 42;
  const bottomPanX = Math.sin(earthStage * Math.PI * 1.4) * 2.5;
  const warpAmount = earthStage * 6 + Math.max(0, (p - 0.88) / 0.12) * 14;

  const bloomFade = Math.max(0, 1 - (p - 0.42) / 0.28);

  const skyBlend = Math.min(1, Math.max(0, (p - 0.78) / 0.22));
  const warpPunch = Math.max(0, (p - 0.9) / 0.1);
  const warpScale = 1 + warpPunch * 0.14;
  const warpBlur = warpPunch * 20;

  const overlayOpacity = 1 - Math.min(1, Math.max(0, (p - 0.92) / 0.08));

  return {
    light: {
      opacity: 1 - earthFadeIn * 0.92,
      transform: `scale(${lightScale * lightWarp})`,
      filter: `blur(${lightBlur}px) brightness(${1.1 + p * 0.35})`,
    },
    bloom: {
      opacity: bloomFade * 0.65,
      transform: `scale(${1 + p * 0.8})`,
      filter: `blur(${24 + p * 30}px)`,
    },
    earth: {
      opacity: earthFadeIn,
      transformOrigin: "50% 100%",
      transform: `translate(${bottomPanX}%, ${bottomPanY}%) scale(${bottomZoom * warpScale})`,
      filter: `blur(${warpAmount + warpBlur}px) saturate(${1 - skyBlend * 0.2}) brightness(${1 + earthStage * 0.08})`,
    },
    skyWash: {
      opacity: skyBlend * 0.98,
    },
    root: {
      opacity: overlayOpacity,
      backgroundColor: skyBlend > 0.88 ? SKY_HERO : "#020408",
    },
  };
}

export default function LoadingOverlay() {
  const loaded = useExperienceStore((s) => s.loaded);
  const loadProgress = useExperienceStore((s) => s.loadProgress);
  const rootRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const bloomRef = useRef<HTMLDivElement>(null);
  const earthRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loaded) return;

    const apply = () => {
      const styles = stageStyles(loadProgress);
      if (rootRef.current) Object.assign(rootRef.current.style, styles.root);
      if (lightRef.current) Object.assign(lightRef.current.style, styles.light);
      if (bloomRef.current) Object.assign(bloomRef.current.style, styles.bloom);
      if (earthRef.current) Object.assign(earthRef.current.style, styles.earth);
      if (skyRef.current) Object.assign(skyRef.current.style, styles.skyWash);
    };

    apply();
  }, [loaded, loadProgress]);

  if (loaded) return null;

  const exiting = loadProgress >= 100;
  const styles = stageStyles(loadProgress);

  return (
    <div
      ref={rootRef}
      className="loading-overlay fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{
        ...styles.root,
        transition: exiting ? "opacity 0.55s ease, background-color 0.55s ease" : undefined,
        pointerEvents: exiting ? "none" : "auto",
      }}
    >
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          ref={lightRef}
          className="absolute inset-[-15%] bg-center bg-cover will-change-transform"
          style={{
            backgroundImage: "url(/loading/white-light.png)",
            ...styles.light,
          }}
        />
        <div
          ref={bloomRef}
          className="absolute inset-[-25%] bg-center bg-cover will-change-transform"
          style={{
            backgroundImage: "url(/loading/white-light.png)",
            mixBlendMode: "screen",
            ...styles.bloom,
          }}
        />
        <div
          ref={earthRef}
          className="absolute inset-[-12%] bg-[center_85%] bg-cover will-change-transform"
          style={{
            backgroundImage: "url(/loading/earth.png)",
            ...styles.earth,
          }}
        />
        <div
          ref={skyRef}
          className="absolute inset-0 will-change-[opacity]"
          style={{
            background: `linear-gradient(to bottom, transparent 20%, ${SKY_HERO} 92%)`,
            ...styles.skyWash,
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <p
          className="font-mono text-[10px] uppercase tracking-[0.42em]"
          style={{ color: labelColor(loadProgress) }}
        >
          {labelForProgress(loadProgress)}
        </p>
        <div className="mt-8 h-px w-48 overflow-hidden bg-white/10">
          <div
            className="h-full bg-[#6eb5e8] transition-all duration-200"
            style={{ width: `${loadProgress}%` }}
          />
        </div>
        <p className="mt-4 font-mono text-[10px] tracking-[0.2em] text-[#F4F1EA]/35">
          {loadProgress}%
        </p>
      </div>
    </div>
  );
}

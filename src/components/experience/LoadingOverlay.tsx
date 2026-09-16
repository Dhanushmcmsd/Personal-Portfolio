"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { useExperienceStore } from "@/stores/experienceStore";

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

function range(p: number, start: number, end: number) {
  return clamp01((p - start) / (end - start || 1));
}

function labelForProgress(progress: number) {
  if (progress < 40) return "INITIATING TIME JUMP";
  if (progress < 58) return "WARPING THROUGH SPACE-TIME";
  if (progress < 82) return "APPROACHING EARTH ATMOSPHERE";
  return "ENTERING HOME ORBIT";
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

  const earthFadeIn = range(p, 0.3, 0.48);
  const earthStage = range(p, 0.34, 0.72);
  const bottomZoom = 1.08 + earthStage * 1.05;
  const bottomPanY = 8 + earthStage * 28;
  const bottomPanX = Math.sin(earthStage * Math.PI * 1.4) * 2.5;

  const bloomFade = Math.max(0, 1 - range(p, 0.4, 0.58));

  const videoIn = range(p, 0.48, 0.68);
  const videoOut = 1 - range(p, 0.78, 1);
  const earthMerge = 1 - range(p, 0.5, 0.74);
  const homeMerge = range(p, 0.76, 0.94);
  const videoOpacity = Math.min(1, videoIn * 1.05) * Math.max(0.18, videoOut);
  const hudFade = 1 - range(p, 0.48, 0.6);
  const overlayOpacity = 1 - range(p, 0.88, 1);
  const rootClear = range(p, 0.74, 0.9);
  const mergeBlend: CSSProperties["mixBlendMode"] =
    videoIn < 1 || homeMerge > 0.02 ? "screen" : "normal";

  return {
    light: {
      opacity: (1 - earthFadeIn * 0.92) * (1 - videoIn * 0.85),
      transform: `scale(${lightScale * lightWarp})`,
      filter: `blur(${lightBlur}px) brightness(${1.1 + p * 0.35})`,
    },
    bloom: {
      opacity: bloomFade * 0.65 * (1 - videoIn * 0.7),
      transform: `scale(${1 + p * 0.8})`,
      filter: `blur(${24 + p * 30}px)`,
    },
    earth: {
      opacity: earthFadeIn * earthMerge,
      transformOrigin: "50% 100%",
      transform: `translate(${bottomPanX}%, ${bottomPanY}%) scale(${bottomZoom})`,
      filter: `blur(${earthStage * 3 + videoIn * 8}px) saturate(${1.05 + videoIn * 0.15}) brightness(${1 + earthStage * 0.1 + videoIn * 0.12})`,
    },
    video: {
      opacity: videoOpacity,
      mixBlendMode: mergeBlend,
      filter: `blur(${(1 - videoIn) * 6 + homeMerge * 10}px) saturate(${1.05 + homeMerge * 0.2}) brightness(${1 + homeMerge * 0.12})`,
    },
    skyMerge: {
      opacity: homeMerge * videoOut * 0.72,
    },
    hud: {
      opacity: hudFade,
    },
    root: {
      opacity: overlayOpacity,
      backgroundColor: `rgba(2, 4, 8, ${1 - rootClear})`,
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
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const skyMergeRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const playingRef = useRef(false);

  useEffect(() => {
    if (loaded) return;

    const styles = stageStyles(loadProgress);
    if (rootRef.current) Object.assign(rootRef.current.style, styles.root);
    if (lightRef.current) Object.assign(lightRef.current.style, styles.light);
    if (bloomRef.current) Object.assign(bloomRef.current.style, styles.bloom);
    if (earthRef.current) Object.assign(earthRef.current.style, styles.earth);
    if (videoWrapRef.current) Object.assign(videoWrapRef.current.style, styles.video);
    if (skyMergeRef.current) Object.assign(skyMergeRef.current.style, styles.skyMerge);
    if (hudRef.current) Object.assign(hudRef.current.style, styles.hud);

    const video = videoRef.current;
    if (video) {
      const videoOpacity = Number(styles.video.opacity);
      if (videoOpacity > 0.04 && !playingRef.current) {
        playingRef.current = true;
        video.currentTime = 0;
        const playAttempt = video.play();
        if (playAttempt) playAttempt.catch(() => {});
      }
      if (videoOpacity <= 0.02 && playingRef.current) {
        video.pause();
      }
    }
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
        transition: exiting ? "opacity 0.7s ease" : undefined,
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
            transition: "opacity 0.55s ease, filter 0.55s ease, transform 0.55s ease",
          }}
        />
        <div
          ref={videoWrapRef}
          className="absolute inset-0 will-change-[opacity,filter]"
          style={{
            ...styles.video,
            transition: "opacity 0.7s ease, filter 0.7s ease",
          }}
        >
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            src="/loading/approach-earth.mp4"
            muted
            playsInline
            preload="auto"
          />
        </div>
        <div
          ref={skyMergeRef}
          className="absolute inset-0 will-change-[opacity]"
          style={{
            background:
              "linear-gradient(to bottom, rgba(110,181,232,0.15) 0%, #6eb5e8 78%)",
            mixBlendMode: "screen",
            ...styles.skyMerge,
            transition: "opacity 0.7s ease",
          }}
        />
      </div>

      <div
        ref={hudRef}
        className="relative z-10 flex flex-col items-center px-6 text-center will-change-[opacity]"
        style={styles.hud}
      >
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

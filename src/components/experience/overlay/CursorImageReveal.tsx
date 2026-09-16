"use client";

import { useEffect, useRef } from "react";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { inverseRangeProgress, TIMELINE } from "@/lib/scroll/timeline";
import {
  drawClothTearFrame,
  drawCursorGlow,
  drawFeatheredVideoBlob,
  punchFeatheredHole,
} from "@/lib/cursor/clothTear";

const HERO_VIDEOS = [
  "/videos/hero-scenario-1.mp4",
  "/videos/hero-scenario-2.mp4",
  "/videos/hero-scenario-3.mp4",
];

const SKY_HERO = "#6eb5e8";
const LERP_POSITION = 0.14;
const LERP_RADIUS = 0.16;
const BASE_RADIUS = 68;
const MIN_RADIUS = 52;
const MAX_RADIUS = 96;
const TRAIL_MAX = 32;
const TRAIL_INTERVAL_MS = 24;
const HOLD_MS = 520;
const TEAR_MS = 880;

type TrailPoint = { x: number; y: number; r: number; age: number };

function isTouchEnvironment() {
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(hover: none)").matches ||
    navigator.maxTouchPoints > 0
  );
}

export default function CursorImageReveal() {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoCanvasRef = useRef<HTMLCanvasElement>(null);
  const blueCanvasRef = useRef<HTMLCanvasElement>(null);
  const glowCanvasRef = useRef<HTMLCanvasElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<HTMLVideoElement[]>([]);

  useEffect(() => {
    if (isTouchEnvironment()) return;

    const root = rootRef.current;
    const videoCanvas = videoCanvasRef.current;
    const blueCanvas = blueCanvasRef.current;
    const glowCanvas = glowCanvasRef.current;
    if (!root || !videoCanvas || !blueCanvas || !glowCanvas) return;

    const videoCtx = videoCanvas.getContext("2d", { alpha: true });
    const blueCtx = blueCanvas.getContext("2d", { alpha: true });
    const glowCtx = glowCanvas.getContext("2d", { alpha: true });
    if (!videoCtx || !blueCtx || !glowCtx) return;

    scrollEngine.init();

    const videos = videoRefs.current;
    videos.forEach((video) => {
      video.muted = true;
      video.playsInline = true;
      video.loop = true;
      video.preload = "auto";
      void video.play().catch(() => undefined);
    });

    const tearCanvas = document.createElement("canvas");

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const positionLerp = reducedMotion ? 0.32 : LERP_POSITION;

    let targetX = window.innerWidth * 0.5;
    let targetY = window.innerHeight * 0.5;
    let currentX = targetX;
    let currentY = targetY;
    let targetRadius = BASE_RADIUS;
    let currentRadius = BASE_RADIUS;
    let scrollFade = 1;
    let pointerInside = false;
    let heroActive = true;
    let velocity = 0;
    let time = 0;
    let rafId = 0;

    let currentVideo = 0;
    let trail: TrailPoint[] = [];
    let lastTrailAt = 0;

    let holdStart = 0;
    let holding = false;
    let holdTriggered = false;

    let tearing = false;
    let tearStart = 0;
    let tearX = 0;
    let tearY = 0;
    let tearTo = 0;
    let tearSnapshot: HTMLCanvasElement | null = null;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = window.innerWidth;
      const h = window.innerHeight;
      for (const canvas of [videoCanvas, blueCanvas, glowCanvas]) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }
      videoCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      blueCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      glowCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      tearCanvas.width = w;
      tearCanvas.height = h;
    };

    const captureSnapshot = () => {
      const video = videos[currentVideo];
      if (!video || video.readyState < 2) return null;
      const snap = document.createElement("canvas");
      snap.width = tearCanvas.width;
      snap.height = tearCanvas.height;
      const sctx = snap.getContext("2d")!;
      sctx.drawImage(video, 0, 0, snap.width, snap.height);
      return snap;
    };

    const beginScenarioSwitch = () => {
      if (tearing || !heroActive) return;
      tearTo = (currentVideo + 1) % videos.length;
      tearX = currentX;
      tearY = currentY;
      tearSnapshot = captureSnapshot();
      tearing = true;
      tearStart = performance.now();
      currentVideo = tearTo;
      videos[tearTo].currentTime = 0;
      void videos[tearTo].play().catch(() => undefined);
    };

    const unsub = scrollEngine.subscribe((progress, velocity) => {
      scrollFade = inverseRangeProgress(progress, TIMELINE.hero, TIMELINE.transition);
      heroActive = scrollFade > 0.02;
      if (!heroActive || Math.abs(velocity) > 0.003) {
        if (!heroActive || Math.abs(velocity) > 0.003) trail = [];
        if (!heroActive) {
          pointerInside = false;
          holding = false;
          holdTriggered = false;
        }
      }
    });

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch" || !heroActive) return;
      const dx = event.clientX - targetX;
      const dy = event.clientY - targetY;
      velocity = Math.hypot(dx, dy);
      targetX = event.clientX;
      targetY = event.clientY;
      pointerInside = true;

      const velocityBoost = Math.min(velocity * 0.45, MAX_RADIUS - BASE_RADIUS);
      targetRadius = Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, BASE_RADIUS + velocityBoost));
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "touch" || !heroActive) return;
      holding = true;
      holdTriggered = false;
      holdStart = performance.now();
    };

    const onPointerUp = () => {
      holding = false;
      holdTriggered = false;
    };

    const onPointerEnter = (event: PointerEvent) => {
      if (event.pointerType === "touch" || !heroActive) return;
      pointerInside = true;
    };

    const onPointerLeave = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointerInside = false;
      holding = false;
      holdTriggered = false;
    };

    const drawBlueMask = (w: number, h: number, cx: number, cy: number) => {
      blueCtx.clearRect(0, 0, w, h);
      blueCtx.fillStyle = SKY_HERO;
      blueCtx.fillRect(0, 0, w, h);

      for (const point of trail) {
        const life = 1 - point.age / TRAIL_MAX;
        const radius = point.r * (0.6 + life * 0.45);
        punchFeatheredHole(blueCtx, point.x, point.y, radius, life * life, time + point.age * 0.12);
      }

      if (pointerInside) {
        punchFeatheredHole(blueCtx, cx, cy, currentRadius * 1.02, 1, time);
      }
    };

    const updateHint = (cx: number, cy: number, fade: number) => {
      const hint = hintRef.current;
      if (!hint) return;
      const show = pointerInside && heroActive && fade > 0.08;
      hint.style.opacity = show ? String(Math.min(1, fade * 1.1)) : "0";
      if (!show) return;
      hint.style.left = `${cx + currentRadius * 0.55}px`;
      hint.style.top = `${cy + currentRadius * 0.72}px`;
    };

    const tick = () => {
      time += 0.016;
      const now = performance.now();
      const w = tearCanvas.width;
      const h = tearCanvas.height;

      if (pointerInside && heroActive) {
        currentX += (targetX - currentX) * positionLerp;
        currentY += (targetY - currentY) * positionLerp;
        currentRadius += (targetRadius - currentRadius) * LERP_RADIUS;
      }

      if (holding && heroActive && !holdTriggered && now - holdStart >= HOLD_MS) {
        holdTriggered = true;
        beginScenarioSwitch();
      }

      if (tearing) {
        const tearT = Math.min(1, (now - tearStart) / TEAR_MS);
        if (tearT >= 1) {
          tearing = false;
          tearSnapshot = null;
        }
      }

      const heroVisible = heroActive && scrollFade > 0.02;
      root.style.opacity = heroVisible ? String(scrollFade) : "0";
      root.style.visibility = scrollFade > 0.01 ? "visible" : "hidden";

      if (heroVisible && pointerInside && now - lastTrailAt > TRAIL_INTERVAL_MS) {
        trail.push({ x: currentX, y: currentY, r: currentRadius * 0.94, age: 0 });
        if (trail.length > TRAIL_MAX) trail.shift();
        lastTrailAt = now;
      }

      trail = trail
        .map((p) => ({ ...p, age: p.age + 1 }))
        .filter((p) => p.age < TRAIL_MAX);

      videoCtx.clearRect(0, 0, w, h);
      blueCtx.clearRect(0, 0, w, h);
      glowCtx.clearRect(0, 0, w, h);

      if (heroVisible) {
        const activeVideo = videos[currentVideo];
        const distortX = Math.sin(time * 2.2) * 0.6;
        const distortY = Math.cos(time * 1.8) * 0.6;
        const cx = currentX + distortX;
        const cy = currentY + distortY;

        if (activeVideo && activeVideo.readyState >= 2) {
          if (tearing && tearSnapshot) {
            const tearT = Math.min(1, (now - tearStart) / TEAR_MS);
            videoCtx.drawImage(activeVideo, 0, 0, w, h);
            drawClothTearFrame(videoCtx, tearSnapshot, w, h, tearX, tearY, tearT, scrollFade);
          } else {
            for (const point of trail) {
              const life = 1 - point.age / TRAIL_MAX;
              const radius = point.r * (0.6 + life * 0.45);
              drawFeatheredVideoBlob(
                videoCtx,
                activeVideo,
                w,
                h,
                point.x,
                point.y,
                radius,
                life * life * scrollFade,
                time + point.age * 0.12
              );
            }
            if (pointerInside) {
              drawFeatheredVideoBlob(videoCtx, activeVideo, w, h, cx, cy, currentRadius, scrollFade, time);
            }
          }
        }

        drawBlueMask(w, h, cx, cy);

        if (pointerInside) {
          drawCursorGlow(glowCtx, cx, cy, currentRadius, scrollFade * 0.9, time);
        }

        updateHint(cx, cy, scrollFade);
      }

      rafId = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointerenter", onPointerEnter);
    document.addEventListener("pointerleave", onPointerLeave);
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      unsub();
      window.removeEventListener("resize", resize);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointerenter", onPointerEnter);
      document.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="cursor-image-reveal pointer-events-none fixed inset-0 z-[3] opacity-0"
      aria-hidden="true"
    >
      <div className="sr-only" aria-hidden="true">
        {HERO_VIDEOS.map((src, i) => (
          <video
            key={src}
            ref={(el) => {
              if (el) videoRefs.current[i] = el;
            }}
            src={src}
            muted
            playsInline
            loop
            preload="auto"
          />
        ))}
      </div>
      <canvas ref={videoCanvasRef} className="cursor-image-reveal__video absolute inset-0 h-full w-full" />
      <canvas ref={blueCanvasRef} className="cursor-image-reveal__blue absolute inset-0 h-full w-full" />
      <canvas ref={glowCanvasRef} className="cursor-image-reveal__glow absolute inset-0 h-full w-full" />
      <div ref={hintRef} className="cursor-image-reveal__hint" aria-hidden="true">
        click and hold to change scenery
      </div>
    </div>
  );
}

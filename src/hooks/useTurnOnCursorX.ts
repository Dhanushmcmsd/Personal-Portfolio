"use client";

import { useEffect, type RefObject } from "react";

const DESKTOP_MIN_WIDTH = 1024;
const TARGET_LERP = 0.16;
const GHOST_FADE = 0.12;
const SEEK_GAP = 0.035;

function isDesktopWidth() {
  return typeof window !== "undefined" && window.innerWidth >= DESKTOP_MIN_WIDTH;
}

function ratioToTime(ratio: number, duration: number) {
  const t = Math.max(0, Math.min(1, ratio)) * duration;
  return Math.max(0, Math.min(duration, t));
}

function snapshotVideo(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
  const width = Math.max(1, Math.round(canvas.clientWidth));
  const height = Math.max(1, Math.round(canvas.clientHeight));
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx || video.readyState < 2 || !video.videoWidth) return;

  const scale = Math.max(width / video.videoWidth, height / video.videoHeight);
  const dw = video.videoWidth * scale;
  const dh = video.videoHeight * scale;
  const x = (width - dw) * 0.32;
  const y = (height - dh) * 0.32;

  ctx.clearRect(0, 0, width, height);
  ctx.filter = "blur(14px) brightness(1.1)";
  ctx.drawImage(video, x, y, dw, dh);
}

export function useTurnOnCursorX(
  videoRef: RefObject<HTMLVideoElement | null>,
  ghostRef: RefObject<HTMLCanvasElement | null>,
  active: boolean
) {
  useEffect(() => {
    const video = videoRef.current;
    const ghost = ghostRef.current;
    if (!video || !active) return;

    let desktop = isDesktopWidth();
    let cursorTarget = 0;
    let smoothTarget = 0;
    let pendingClientX: number | null = null;
    let seeking = false;
    let ghostOpacity = 0;
    let frame = 0;
    let running = true;
    let seekToken = 0;
    const timeouts: number[] = [];

    const applyNeutralFrame = () => {
      const duration = video.duration;
      if (!Number.isFinite(duration) || duration <= 0) return;
      const mid = duration * 0.5;
      cursorTarget = mid;
      smoothTarget = mid;
      video.pause();
      if (!seeking) video.currentTime = mid;
    };

    const unlockSeeks = () => {
      const attempt = video.play();
      if (attempt && typeof attempt.then === "function") {
        attempt.then(() => video.pause()).catch(() => video.pause());
      } else {
        video.pause();
      }
    };

    const onLoaded = () => {
      unlockSeeks();
      applyNeutralFrame();
    };

    const onResize = () => {
      desktop = isDesktopWidth();
      if (!desktop) applyNeutralFrame();
    };

    const onMove = (event: MouseEvent) => {
      if (!desktop) return;
      pendingClientX = event.clientX;
    };

    const onSeeked = () => {
      seeking = false;
    };

    const tick = () => {
      if (!running) return;

      if (pendingClientX !== null) {
        const duration = video.duration;
        if (Number.isFinite(duration) && duration > 0) {
          cursorTarget = ratioToTime(
            pendingClientX / Math.max(1, window.innerWidth),
            duration
          );
        }
        pendingClientX = null;
      }

      if (ghost && ghostOpacity > 0) {
        ghostOpacity += (0 - ghostOpacity) * GHOST_FADE;
        if (ghostOpacity < 0.01) ghostOpacity = 0;
        ghost.style.opacity = String(ghostOpacity);
      }

      if (desktop) {
        const duration = video.duration;
        if (Number.isFinite(duration) && duration > 0) {
          if (!video.paused) video.pause();
          smoothTarget += (cursorTarget - smoothTarget) * TARGET_LERP;
          const current = video.currentTime || 0;
          if (!seeking && Math.abs(smoothTarget - current) > SEEK_GAP) {
            if (ghost) {
              snapshotVideo(video, ghost);
              ghostOpacity = 0.85;
              ghost.style.opacity = String(ghostOpacity);
            }
            seeking = true;
            const token = ++seekToken;
            video.currentTime = Math.max(0, Math.min(duration, smoothTarget));
            timeouts.push(
              window.setTimeout(() => {
                if (token === seekToken) seeking = false;
              }, 160)
            );
          }
        }
      }

      frame = window.requestAnimationFrame(tick);
    };

    video.pause();
    if (video.readyState >= 1) {
      unlockSeeks();
      applyNeutralFrame();
    }

    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("seeked", onSeeked);
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMove, { passive: true });
    frame = window.requestAnimationFrame(tick);

    return () => {
      running = false;
      timeouts.forEach((id) => window.clearTimeout(id));
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("seeked", onSeeked);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
      window.cancelAnimationFrame(frame);
      video.pause();
    };
  }, [active, videoRef, ghostRef]);
}

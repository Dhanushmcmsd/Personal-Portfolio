"use client";

import { useEffect, useState, type RefObject } from "react";

const DESKTOP_MIN_WIDTH = 1024;
const TARGET_LERP = 0.16;
const FRAME_COUNT = 120;
const FRAME_BASE = "/sequences/contact-character";
const OBJECT_POS_X = 0.68;
const OBJECT_POS_Y = 0.12;

let cachedFrames: HTMLImageElement[] | null = null;
let loadPromise: Promise<HTMLImageElement[]> | null = null;

function isDesktopWidth() {
  return typeof window !== "undefined" && window.innerWidth >= DESKTOP_MIN_WIDTH;
}

function frameSrc(index: number) {
  return `${FRAME_BASE}/frame-${String(index + 1).padStart(3, "0")}.webp`;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

function preloadFrames() {
  if (cachedFrames) return Promise.resolve(cachedFrames);
  if (!loadPromise) {
    loadPromise = Promise.all(
      Array.from({ length: FRAME_COUNT }, (_, i) => loadImage(frameSrc(i)))
    ).then((frames) => {
      cachedFrames = frames;
      return frames;
    });
  }
  return loadPromise;
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cssW: number,
  cssH: number
) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;

  const scale = Math.max(cssW / iw, cssH / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const x = (cssW - dw) * OBJECT_POS_X;
  const y = (cssH - dh) * OBJECT_POS_Y;

  ctx.clearRect(0, 0, cssW, cssH);
  ctx.drawImage(img, x, y, dw, dh);
}

export function useCursorFollowSequence(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  active: boolean
) {
  const [ready, setReady] = useState(() => cachedFrames !== null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;

    let frames: HTMLImageElement[] = cachedFrames ?? [];
    let cancelled = false;
    let desktop = isDesktopWidth();
    let pendingClientX: number | null = null;
    const mid = FRAME_COUNT / 2;
    let cursorTarget = mid;
    let currentIndexFloat = mid;
    let lastDrawn = -1;
    let running = true;
    let raf = 0;
    let dpr = 1;
    let cssW = 1;
    let cssH = 1;

    const getCtx = () => canvas.getContext("2d", { alpha: true });

    const measure = () => {
      dpr = Math.max(1, window.devicePixelRatio || 1);
      cssW = Math.max(1, Math.round(canvas.clientWidth));
      cssH = Math.max(1, Math.round(canvas.clientHeight));
      const bw = Math.round(cssW * dpr);
      const bh = Math.round(cssH * dpr);
      if (canvas.width !== bw) canvas.width = bw;
      if (canvas.height !== bh) canvas.height = bh;
      const ctx = getCtx();
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastDrawn = -1;
    };

    const snapNeutral = () => {
      cursorTarget = mid;
      currentIndexFloat = mid;
    };

    const drawIndex = (index: number) => {
      const img = frames[index];
      if (!img) return;
      const ctx = getCtx();
      if (!ctx) return;
      drawCover(ctx, img, cssW, cssH);
      lastDrawn = index;
    };

    const onResize = () => {
      desktop = isDesktopWidth();
      measure();
      if (!desktop) {
        snapNeutral();
        if (frames.length) {
          drawIndex(Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(mid))));
        }
      }
    };

    const onMove = (event: MouseEvent) => {
      if (!desktop) return;
      pendingClientX = event.clientX;
    };

    const tick = () => {
      if (!running) return;

      if (pendingClientX !== null) {
        const ratio = 1 - pendingClientX / Math.max(1, window.innerWidth);
        cursorTarget = Math.round(
          Math.max(0, Math.min(1, ratio)) * (FRAME_COUNT - 1)
        );
        pendingClientX = null;
      }

      if (desktop && frames.length) {
        currentIndexFloat += (cursorTarget - currentIndexFloat) * TARGET_LERP;
        const rounded = Math.round(
          Math.max(0, Math.min(FRAME_COUNT - 1, currentIndexFloat))
        );
        if (rounded !== lastDrawn) drawIndex(rounded);
      }

      raf = window.requestAnimationFrame(tick);
    };

    measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMove, { passive: true });
    raf = window.requestAnimationFrame(tick);

    preloadFrames()
      .then((loaded) => {
        if (cancelled) return;
        frames = loaded;
        setReady(true);
        snapNeutral();
        drawIndex(Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(mid))));
      })
      .catch(() => {
        loadPromise = null;
      });

    return () => {
      cancelled = true;
      running = false;
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
      window.cancelAnimationFrame(raf);
    };
  }, [active, canvasRef]);

  return { ready };
}

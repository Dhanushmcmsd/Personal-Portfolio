"use client";

import { useEffect, useRef } from "react";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { smootherstep } from "@/lib/scroll/timeline";

const STRING_COUNT = 12;
const SEGMENTS = 12;
const MIDDLE_CUT = Math.ceil(SEGMENTS / 2) + 1;

interface Point {
  x: number;
  y: number;
  px: number;
  py: number;
  pinned: boolean;
}

interface RopeData {
  points: Point[];
  segmentLength: number;
  cutAt: number | null;
}

interface AboutStringConnectionsProps {
  paperRef: React.RefObject<HTMLDivElement | null>;
  photoRef: React.RefObject<HTMLDivElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  aboutLocalRef: React.MutableRefObject<number>;
  active: boolean;
}

function createRope(ax: number, ay: number, bx: number, by: number): RopeData {
  const points: Point[] = [];
  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;
    const x = ax + (bx - ax) * t;
    const y = ay + (by - ay) * t + Math.sin(t * Math.PI) * 6;
    points.push({ x, y, px: x, py: y, pinned: i === 0 || i === SEGMENTS });
  }
  const dx = bx - ax;
  const dy = by - ay;
  return { points, segmentLength: Math.hypot(dx, dy) / SEGMENTS, cutAt: null };
}

function getPaperBounds(paperEl: HTMLElement) {
  const rect = paperEl.getBoundingClientRect();
  const paperOpen = parseFloat(
    getComputedStyle(paperEl).getPropertyValue("--paper-open").trim() || "0"
  );
  const pad = 8 * (1 - paperOpen);
  return {
    right: rect.right + pad,
    top: rect.top - pad,
    bottom: rect.bottom + pad,
    height: rect.height + pad * 2,
  };
}

function simulatePoints(
  points: Point[],
  segmentLength: number,
  windX: number,
  windY: number,
  pinStart: boolean,
  pinEnd: boolean
) {
  if (pinStart) points[0].pinned = true;
  if (pinEnd) points[points.length - 1].pinned = true;

  for (const p of points) {
    if (p.pinned) continue;
    const vx = (p.x - p.px) * 0.965;
    const vy = (p.y - p.py) * 0.965;
    p.px = p.x;
    p.py = p.y;
    p.x += vx + windX;
    p.y += vy + windY + 0.22;
  }

  for (let pass = 0; pass < 5; pass++) {
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 0.001;
      const diff = (dist - segmentLength) / dist;
      const ox = dx * diff * 0.5;
      const oy = dy * diff * 0.5;
      if (!a.pinned) {
        a.x += ox;
        a.y += oy;
      }
      if (!b.pinned) {
        b.x -= ox;
        b.y -= oy;
      }
    }
  }
}

function drawPoints(ctx: CanvasRenderingContext2D, points: Point[], alpha: number) {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + curr.x) / 2, (prev.y + curr.y) / 2);
  }
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
  ctx.strokeStyle = `rgba(30, 28, 26, ${0.4 * alpha})`;
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.strokeStyle = `rgba(180, 170, 155, ${0.26 * alpha})`;
  ctx.lineWidth = 0.45;
  ctx.stroke();
}

export default function AboutStringConnections({
  paperRef,
  photoRef,
  containerRef,
  aboutLocalRef,
  active,
}: AboutStringConnectionsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ropesRef = useRef<RopeData[]>([]);
  const rafRef = useRef(0);
  const visibleRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const tick = () => {
      const paper = paperRef.current;
      const photo = photoRef.current;
      const container = containerRef.current;
      const opacity = Number(container?.style.opacity ?? 0);
      visibleRef.current += (opacity - visibleRef.current) * 0.12;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      if (!paper || !photo || visibleRef.current < 0.08) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const paperBounds = getPaperBounds(paper);
      const photoRect = photo.getBoundingClientRect();
      if (photoRect.width < 10) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const paperX = paperBounds.right;
      const anchorsPaper: { x: number; y: number }[] = [];
      const anchorsPhoto: { x: number; y: number }[] = [];

      for (let i = 0; i < STRING_COUNT; i++) {
        const t = (i + 0.5) / STRING_COUNT;
        const paperY = paperBounds.top + paperBounds.height * (0.1 + t * 0.8);
        const photoY = photoRect.top + photoRect.height * (0.1 + t * 0.8);
        anchorsPaper.push({ x: paperX, y: paperY });
        anchorsPhoto.push({ x: photoRect.left + 4, y: photoY });
      }

      const aboutLocal = aboutLocalRef.current;
      const shouldCut = smootherstep(0.48, 0.72, aboutLocal) > 0.02;

      if (ropesRef.current.length !== STRING_COUNT) {
        ropesRef.current = anchorsPaper.map((a, i) => {
          const rope = createRope(a.x, a.y, anchorsPhoto[i].x, anchorsPhoto[i].y);
          if (shouldCut) rope.cutAt = MIDDLE_CUT;
          return rope;
        });
      } else {
        ropesRef.current.forEach((rope, i) => {
          if (shouldCut && rope.cutAt === null) {
            rope.cutAt = MIDDLE_CUT;
          }
          rope.points[0].x = anchorsPaper[i].x;
          rope.points[0].y = anchorsPaper[i].y;
          rope.points[0].pinned = true;
          rope.points[rope.points.length - 1].x = anchorsPhoto[i].x;
          rope.points[rope.points.length - 1].y = anchorsPhoto[i].y;
        });
      }

      const scrollWind = scrollEngine.velocity * 140;
      const exitDangle = smootherstep(0.55, 0.95, aboutLocal);
      const windX = scrollWind + Math.sin(performance.now() * 0.0012) * 0.08;
      const windY = exitDangle * 0.55 + scrollEngine.velocity * 20;

      for (const rope of ropesRef.current) {
        if (rope.cutAt === null) {
          simulatePoints(rope.points, rope.segmentLength, windX, windY, true, true);
          drawPoints(ctx, rope.points, visibleRef.current);
        } else {
          const cut = rope.cutAt;
          const upper = rope.points.slice(0, cut);
          const lower = rope.points.slice(cut - 1);
          upper[0].pinned = true;
          if (upper.length > 1) {
            upper[upper.length - 1].pinned = false;
            simulatePoints(upper, rope.segmentLength, windX, windY * 0.5, true, false);
            drawPoints(ctx, upper, visibleRef.current);
          }
          lower[lower.length - 1].pinned = true;
          lower[0].pinned = false;
          simulatePoints(
            lower,
            rope.segmentLength,
            windX * (1 + exitDangle),
            windY + 0.4 + exitDangle * 0.6,
            false,
            true
          );
          drawPoints(ctx, lower, visibleRef.current);
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [paperRef, photoRef, containerRef, aboutLocalRef, active]);

  return (
    <canvas
      ref={canvasRef}
      className="about-string-canvas pointer-events-none fixed inset-0 z-[15]"
      style={{ opacity: active ? 1 : 0 }}
      aria-hidden="true"
    />
  );
}

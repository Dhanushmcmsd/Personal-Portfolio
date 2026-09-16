"use client";

import { useEffect, useRef } from "react";
import { scrollEngine } from "@/lib/scroll/scrollEngine";

const STRING_COUNT = 12;
const SEGMENTS = 12;

interface Point {
  x: number;
  y: number;
  px: number;
  py: number;
  pinned: boolean;
}

interface Rope {
  points: Point[];
  segmentLength: number;
}

interface AboutStringConnectionsProps {
  paperRef: React.RefObject<HTMLDivElement | null>;
  photoRef: React.RefObject<HTMLDivElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  active: boolean;
}

function createRope(ax: number, ay: number, bx: number, by: number): Rope {
  const points: Point[] = [];
  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;
    const x = ax + (bx - ax) * t;
    const y = ay + (by - ay) * t + Math.sin(t * Math.PI) * 8;
    points.push({
      x,
      y,
      px: x,
      py: y,
      pinned: i === 0 || i === SEGMENTS,
    });
  }
  const dx = bx - ax;
  const dy = by - ay;
  const segmentLength = Math.hypot(dx, dy) / SEGMENTS;
  return { points, segmentLength };
}

function simulateRope(rope: Rope, windX: number, windY: number) {
  const { points, segmentLength } = rope;

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

function drawRope(ctx: CanvasRenderingContext2D, rope: Rope, alpha: number) {
  const { points } = rope;
  if (points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cx = (prev.x + curr.x) / 2;
    const cy = (prev.y + curr.y) / 2;
    ctx.quadraticCurveTo(prev.x, prev.y, cx, cy);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);

  ctx.strokeStyle = `rgba(30, 28, 26, ${0.35 * alpha})`;
  ctx.lineWidth = 1.1;
  ctx.stroke();

  ctx.strokeStyle = `rgba(180, 170, 155, ${0.22 * alpha})`;
  ctx.lineWidth = 0.45;
  ctx.stroke();
}

export default function AboutStringConnections({
  paperRef,
  photoRef,
  containerRef,
  active,
}: AboutStringConnectionsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ropesRef = useRef<Rope[]>([]);
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

      const paperRect = paper.getBoundingClientRect();
      const photoRect = photo.getBoundingClientRect();

      if (paperRect.width < 10 || photoRect.width < 10) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const anchorsPaper: { x: number; y: number }[] = [];
      const anchorsPhoto: { x: number; y: number }[] = [];

      for (let i = 0; i < STRING_COUNT; i++) {
        const t = (i + 0.5) / STRING_COUNT;
        const paperY = paperRect.top + paperRect.height * (0.12 + t * 0.76);
        const photoY = photoRect.top + photoRect.height * (0.1 + t * 0.8);
        anchorsPaper.push({ x: paperRect.right - 6, y: paperY });
        anchorsPhoto.push({ x: photoRect.left + 6, y: photoY });
      }

      if (ropesRef.current.length !== STRING_COUNT) {
        ropesRef.current = anchorsPaper.map((a, i) =>
          createRope(a.x, a.y, anchorsPhoto[i].x, anchorsPhoto[i].y)
        );
      } else {
        ropesRef.current.forEach((rope, i) => {
          const start = rope.points[0];
          const end = rope.points[rope.points.length - 1];
          start.x = anchorsPaper[i].x;
          start.y = anchorsPaper[i].y;
          end.x = anchorsPhoto[i].x;
          end.y = anchorsPhoto[i].y;
        });
      }

      const scrollWind = scrollEngine.velocity * 140;
      const progressWind = (scrollEngine.progress - 0.72) * 18;
      const windX = scrollWind + Math.sin(performance.now() * 0.0012) * 0.08;
      const windY = progressWind * 0.04;

      for (const rope of ropesRef.current) {
        simulateRope(rope, windX, windY);
        drawRope(ctx, rope, visibleRef.current);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [paperRef, photoRef, containerRef]);

  return (
    <canvas
      ref={canvasRef}
      className="about-string-canvas pointer-events-none fixed inset-0 z-[15]"
      style={{ opacity: active ? 1 : 0 }}
      aria-hidden="true"
    />
  );
}

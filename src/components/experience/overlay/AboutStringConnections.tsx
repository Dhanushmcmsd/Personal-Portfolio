"use client";

import { useEffect, useRef } from "react";
import { scrollEngine } from "@/lib/scroll/scrollEngine";

const STRING_COUNT = 12;
const SEGMENTS = 12;
const HIT_RADIUS = 28;
const ARROW_SPEED = 9;

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

interface FallingArrow {
  x: number;
  y: number;
  vy: number;
  life: number;
}

interface AboutStringConnectionsProps {
  paperAnchorRef: React.RefObject<HTMLDivElement | null>;
  photoRef: React.RefObject<HTMLDivElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  active: boolean;
}

function createRope(ax: number, ay: number, bx: number, by: number): RopeData {
  const points: Point[] = [];
  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;
    const x = ax + (bx - ax) * t;
    const y = ay + (by - ay) * t + Math.sin(t * Math.PI) * 8;
    points.push({ x, y, px: x, py: y, pinned: i === 0 || i === SEGMENTS });
  }
  const dx = bx - ax;
  const dy = by - ay;
  return { points, segmentLength: Math.hypot(dx, dy) / SEGMENTS, cutAt: null };
}

function simulatePoints(
  points: Point[],
  segmentLength: number,
  windX: number,
  windY: number,
  pinStart: boolean,
  pinEnd: boolean
) {
  if (pinStart) {
    points[0].pinned = true;
  }
  if (pinEnd) {
    points[points.length - 1].pinned = true;
  }

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
    const cx = (prev.x + curr.x) / 2;
    const cy = (prev.y + curr.y) / 2;
    ctx.quadraticCurveTo(prev.x, prev.y, cx, cy);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.strokeStyle = `rgba(30, 28, 26, ${0.38 * alpha})`;
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.strokeStyle = `rgba(180, 170, 155, ${0.24 * alpha})`;
  ctx.lineWidth = 0.45;
  ctx.stroke();
}

function nearestRopeHit(
  ropes: RopeData[],
  x: number,
  y: number
): { ropeIndex: number; segment: number; dist: number } | null {
  let best: { ropeIndex: number; segment: number; dist: number } | null = null;

  ropes.forEach((rope, ropeIndex) => {
    const limit = rope.cutAt ?? rope.points.length;
    for (let i = 0; i < limit - 1; i++) {
      const a = rope.points[i];
      const b = rope.points[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const lenSq = dx * dx + dy * dy || 1;
      let t = ((x - a.x) * dx + (y - a.y) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
      const px = a.x + t * dx;
      const py = a.y + t * dy;
      const dist = Math.hypot(x - px, y - py);
      if (dist < HIT_RADIUS && (!best || dist < best.dist)) {
        best = { ropeIndex, segment: i + 1, dist };
      }
    }
  });

  return best;
}

function drawArrow(ctx: CanvasRenderingContext2D, arrow: FallingArrow, alpha: number) {
  const size = 10;
  ctx.save();
  ctx.translate(arrow.x, arrow.y);
  ctx.shadowColor = "rgba(255, 220, 120, 0.9)";
  ctx.shadowBlur = 12;
  ctx.fillStyle = `rgba(255, 230, 150, ${0.95 * alpha})`;
  ctx.beginPath();
  ctx.moveTo(0, size);
  ctx.lineTo(-size * 0.45, -size * 0.2);
  ctx.lineTo(0, 0);
  ctx.lineTo(size * 0.45, -size * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = `rgba(255, 200, 80, ${0.8 * alpha})`;
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.restore();
}

export default function AboutStringConnections({
  paperAnchorRef,
  photoRef,
  containerRef,
  active,
}: AboutStringConnectionsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ropesRef = useRef<RopeData[]>([]);
  const arrowsRef = useRef<FallingArrow[]>([]);
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

    const onClick = (e: MouseEvent) => {
      if (!active || visibleRef.current < 0.2) return;

      let bestDist = Infinity;
      let spawnX = e.clientX;

      for (const rope of ropesRef.current) {
        if (rope.cutAt !== null) continue;
        for (let i = 0; i < rope.points.length - 1; i++) {
          const a = rope.points[i];
          const b = rope.points[i + 1];
          const minX = Math.min(a.x, b.x) - 24;
          const maxX = Math.max(a.x, b.x) + 24;
          if (e.clientX < minX || e.clientX > maxX) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const lenSq = dx * dx + dy * dy || 1;
          let t = ((e.clientX - a.x) * dx + (e.clientY - a.y) * dy) / lenSq;
          t = Math.max(0, Math.min(1, t));
          const px = a.x + t * dx;
          const dist = Math.abs(e.clientX - px);
          if (dist < HIT_RADIUS && dist < bestDist) {
            bestDist = dist;
            spawnX = px;
          }
        }
      }

      if (bestDist === Infinity) return;

      arrowsRef.current.push({
        x: spawnX,
        y: e.clientY - 52,
        vy: ARROW_SPEED,
        life: 1,
      });
    };

    resize();
    window.addEventListener("resize", resize);
    canvas.addEventListener("click", onClick);

    const tick = () => {
      const anchor = paperAnchorRef.current;
      const photo = photoRef.current;
      const container = containerRef.current;
      const opacity = Number(container?.style.opacity ?? 0);
      visibleRef.current += (opacity - visibleRef.current) * 0.12;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      if (!anchor || !photo || visibleRef.current < 0.08) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const anchorRect = anchor.getBoundingClientRect();
      const photoRect = photo.getBoundingClientRect();

      if (anchorRect.width < 1 || photoRect.width < 10) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const paperX = anchorRect.left + anchorRect.width / 2;
      const anchorsPaper: { x: number; y: number }[] = [];
      const anchorsPhoto: { x: number; y: number }[] = [];

      for (let i = 0; i < STRING_COUNT; i++) {
        const t = (i + 0.5) / STRING_COUNT;
        const paperY = anchorRect.top + anchorRect.height * (0.08 + t * 0.84);
        const photoY = photoRect.top + photoRect.height * (0.1 + t * 0.8);
        anchorsPaper.push({ x: paperX, y: paperY });
        anchorsPhoto.push({ x: photoRect.left + 6, y: photoY });
      }

      if (ropesRef.current.length !== STRING_COUNT) {
        ropesRef.current = anchorsPaper.map((a, i) =>
          createRope(a.x, a.y, anchorsPhoto[i].x, anchorsPhoto[i].y)
        );
      } else {
        ropesRef.current.forEach((rope, i) => {
          if (rope.cutAt === null) {
            rope.points[0].x = anchorsPaper[i].x;
            rope.points[0].y = anchorsPaper[i].y;
            rope.points[rope.points.length - 1].x = anchorsPhoto[i].x;
            rope.points[rope.points.length - 1].y = anchorsPhoto[i].y;
          } else {
            rope.points[0].x = anchorsPaper[i].x;
            rope.points[0].y = anchorsPaper[i].y;
            const cutIdx = rope.cutAt;
            rope.points[rope.points.length - 1].x = anchorsPhoto[i].x;
            rope.points[rope.points.length - 1].y = anchorsPhoto[i].y;
            for (let j = 1; j < cutIdx; j++) {
              rope.points[j].pinned = false;
            }
            rope.points[0].pinned = true;
            for (let j = cutIdx; j < rope.points.length; j++) {
              rope.points[j].pinned = j === rope.points.length - 1;
            }
          }
        });
      }

      const scrollWind = scrollEngine.velocity * 140;
      const windX = scrollWind + Math.sin(performance.now() * 0.0012) * 0.08;
      const windY = (scrollEngine.progress - 0.72) * 0.7;

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
            simulatePoints(upper, rope.segmentLength, windX, windY, true, false);
            drawPoints(ctx, upper, visibleRef.current);
          }
          lower[lower.length - 1].pinned = true;
          lower[0].pinned = false;
          simulatePoints(lower, rope.segmentLength, windX * 1.2, windY + 0.35, false, true);
          drawPoints(ctx, lower, visibleRef.current);
        }
      }

      arrowsRef.current = arrowsRef.current.filter((arrow) => {
        arrow.y += arrow.vy;
        arrow.vy += 0.35;
        arrow.life -= 0.018;
        drawArrow(ctx, arrow, arrow.life * visibleRef.current);

        for (const rope of ropesRef.current) {
          if (rope.cutAt !== null) continue;
          for (let i = 1; i < rope.points.length - 1; i++) {
            const p = rope.points[i];
            if (Math.hypot(arrow.x - p.x, arrow.y - p.y) < 14) {
              rope.cutAt = i + 1;
              rope.points[i].pinned = false;
              break;
            }
          }
        }

        return arrow.life > 0 && arrow.y < window.innerHeight + 40;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("click", onClick);
      cancelAnimationFrame(rafRef.current);
    };
  }, [paperAnchorRef, photoRef, containerRef, active]);

  return (
    <canvas
      ref={canvasRef}
      className="about-string-canvas fixed inset-0 z-[15]"
      style={{
        opacity: active ? 1 : 0,
        pointerEvents: active ? "auto" : "none",
        cursor: active ? "crosshair" : "default",
      }}
      aria-hidden={!active}
    />
  );
}

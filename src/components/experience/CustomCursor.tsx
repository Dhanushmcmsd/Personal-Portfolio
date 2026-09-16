"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CURSOR_DISPLAY_WIDTH,
  hotspotToOffset,
  measureCursorHotspot,
} from "@/lib/cursor/measureHotspot";

type CursorPhase = "default" | "hover" | "click1" | "click2";

type GlitchBurst = { id: number; x: number; y: number };

const CURSORS: Record<CursorPhase, string> = {
  default: "/cursor/arrow.png",
  hover: "/cursor/hover.png",
  click1: "/cursor/click1.png",
  click2: "/cursor/click2.png",
};

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest("a, button, [role='button'], .pressable, input, textarea, select, label")
  );
}

export default function CustomCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [phase, setPhase] = useState<CursorPhase>("default");
  const [bursts, setBursts] = useState<GlitchBurst[]>([]);
  const [hotspots, setHotspots] = useState<Record<CursorPhase, { x: number; y: number }> | null>(
    null
  );
  const burstId = useRef(0);
  const clickTimers = useRef<number[]>([]);
  const interactiveRef = useRef(false);
  const phaseRef = useRef<CursorPhase>("default");

  phaseRef.current = phase;

  const clearClickTimers = useCallback(() => {
    clickTimers.current.forEach((id) => window.clearTimeout(id));
    clickTimers.current = [];
  }, []);

  const resolvePhase = useCallback(() => {
    setPhase(interactiveRef.current ? "hover" : "default");
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.all(
      (Object.entries(CURSORS) as [CursorPhase, string][]).map(async ([key, src]) => {
        const hotspot = await measureCursorHotspot(src);
        return [key, hotspotToOffset(hotspot)] as const;
      })
    )
      .then((entries) => {
        if (cancelled) return;
        setHotspots(Object.fromEntries(entries) as Record<CursorPhase, { x: number; y: number }>);
      })
      .catch(() => {
        if (cancelled) return;
        setHotspots({
          default: { x: 0, y: 0 },
          hover: { x: 0, y: 0 },
          click1: { x: 0, y: 0 },
          click2: { x: 0, y: 0 },
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      interactiveRef.current = isInteractiveTarget(e.target);
      if (phaseRef.current !== "click1" && phaseRef.current !== "click2") {
        setPhase(interactiveRef.current ? "hover" : "default");
      }
    };

    const onDown = (e: MouseEvent) => {
      clearClickTimers();
      const id = burstId.current++;
      setBursts((prev) => [...prev, { id, x: e.clientX, y: e.clientY }]);
      setPhase("click1");

      clickTimers.current.push(
        window.setTimeout(() => setPhase("click2"), 100),
        window.setTimeout(() => resolvePhase(), 220),
        window.setTimeout(() => {
          setBursts((prev) => prev.filter((b) => b.id !== id));
        }, 480)
      );
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      clearClickTimers();
    };
  }, [clearClickTimers, resolvePhase]);

  const offset = hotspots?.[phase] ?? { x: 0, y: 0 };

  return (
    <>
      <div
        className="custom-cursor"
        style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
        aria-hidden="true"
      >
        <img
          src={CURSORS[phase]}
          alt=""
          draggable={false}
          width={CURSOR_DISPLAY_WIDTH}
          style={{
            transform: hotspots
              ? `translate(${-offset.x}px, ${-offset.y}px)`
              : undefined,
          }}
        />
      </div>

      {bursts.map((burst) => (
        <div
          key={burst.id}
          className="cursor-click-glitch"
          style={{ transform: `translate3d(${burst.x}px, ${burst.y}px, 0)` }}
          aria-hidden="true"
        >
          <span className="cursor-click-glitch-bar cursor-click-glitch-bar-a" />
          <span className="cursor-click-glitch-bar cursor-click-glitch-bar-b" />
          <span className="cursor-click-glitch-bar cursor-click-glitch-bar-c" />
          <span className="cursor-click-glitch-core" />
        </div>
      ))}
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

type CursorPhase = "default" | "hover" | "click1" | "click2";

type Burst = { id: number; x: number; y: number };

const CURSORS: Record<CursorPhase, string> = {
  default: "/cursor/arrow.png",
  hover: "/cursor/hover.png",
  click1: "/cursor/click1.png",
  click2: "/cursor/click2.png",
};

export default function CustomCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [phase, setPhase] = useState<CursorPhase>("default");
  const [bursts, setBursts] = useState<Burst[]>([]);
  const burstId = useRef(0);
  const clicking = useRef(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
    };

    const onOver = (e: MouseEvent) => {
      if (clicking.current) return;
      const target = e.target as HTMLElement | null;
      const interactive = Boolean(
        target?.closest("a, button, [role='button'], .pressable, input, textarea, select, label")
      );
      setPhase(interactive ? "hover" : "default");
    };

    const onDown = (e: MouseEvent) => {
      clicking.current = true;
      const id = burstId.current++;
      setBursts((prev) => [...prev, { id, x: e.clientX, y: e.clientY }]);
      setPhase("click1");
      window.setTimeout(() => setPhase("click2"), 90);
      window.setTimeout(() => {
        clicking.current = false;
        setPhase("default");
      }, 190);
      window.setTimeout(() => {
        setBursts((prev) => prev.filter((b) => b.id !== id));
      }, 420);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    window.addEventListener("mousedown", onDown);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mousedown", onDown);
    };
  }, []);

  return (
    <>
      <div
        className="custom-cursor"
        style={{
          transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        }}
        aria-hidden="true"
      >
        <img src={CURSORS[phase]} alt="" draggable={false} />
      </div>

      {bursts.map((burst) => (
        <div
          key={burst.id}
          className="cursor-click-burst"
          style={{
            left: burst.x,
            top: burst.y,
          }}
          aria-hidden="true"
        >
          <img src="/cursor/click-burst.png" alt="" draggable={false} />
        </div>
      ))}
    </>
  );
}

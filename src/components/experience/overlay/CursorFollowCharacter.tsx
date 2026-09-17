"use client";

import { useEffect, useRef, useState } from "react";
import { useCursorFollowSequence } from "@/hooks/useCursorFollowSequence";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { exclusiveOpacity, SCROLL_LOCK_PROGRESS, SECTION } from "@/lib/scroll/timeline";

export default function CursorFollowCharacter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [opacity, setOpacity] = useState(0);
  const active = opacity > 0.04;
  const { ready } = useCursorFollowSequence(canvasRef, active);

  useEffect(() => {
    scrollEngine.init();
    let last = -1;
    const unsub = scrollEngine.subscribe((progress) => {
      const next = exclusiveOpacity(progress, SECTION.contact[0] - 0.03, SCROLL_LOCK_PROGRESS, 0.08);
      if (Math.abs(next - last) < 0.012) return;
      last = next;
      setOpacity(next);
    });
    return () => {
      unsub();
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed top-0 left-0 z-[11] hidden h-full w-[42%] lg:block lg:w-[45%]"
      style={{
        opacity,
        visibility: active ? "visible" : "hidden",
        mixBlendMode: "lighten",
      }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{
          transform: "scaleX(-1)",
          filter: "contrast(1.25) brightness(1.45) saturate(1.25)",
          opacity: ready ? 1 : 0,
          visibility: ready ? "visible" : "hidden",
        }}
      />
    </div>
  );
}

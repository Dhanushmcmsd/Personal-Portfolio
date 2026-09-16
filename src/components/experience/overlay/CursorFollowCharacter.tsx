"use client";

import { useEffect, useRef, useState } from "react";
import { useTurnOnCursorX } from "@/hooks/useTurnOnCursorX";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { exclusiveOpacity, SCROLL_LOCK_PROGRESS, SECTION } from "@/lib/scroll/timeline";

const CHARACTER_VIDEO = "/videos/lv_0_20260917033314.mp4?v=2";

export default function CursorFollowCharacter() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ghostRef = useRef<HTMLCanvasElement>(null);
  const [opacity, setOpacity] = useState(0);
  const active = opacity > 0.04;
  useTurnOnCursorX(videoRef, ghostRef, active);

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
        ref={ghostRef}
        className="absolute inset-0 h-full w-full"
        style={{
          objectPosition: "32% 32%",
          opacity: 0,
          transform: "scaleX(-1)",
          filter: "blur(10px) saturate(1.15) brightness(1.25)",
        }}
      />
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          objectPosition: "32% 32%",
          transform: "scaleX(-1)",
          filter: "contrast(1.25) brightness(1.45) saturate(1.25)",
        }}
        src={CHARACTER_VIDEO}
        muted
        playsInline
        preload="metadata"
      />
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useTurnOnCursorX } from "@/hooks/useTurnOnCursorX";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { exclusiveOpacity, SECTION } from "@/lib/scroll/timeline";

const CHARACTER_VIDEO = "/videos/lv_0_20260917033314.mp4";

export default function CursorFollowCharacter() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ghostRef = useRef<HTMLCanvasElement>(null);
  const [opacity, setOpacity] = useState(0);
  useTurnOnCursorX(videoRef, ghostRef);

  useEffect(() => {
    scrollEngine.init();
    const unsub = scrollEngine.subscribe((progress) => {
      setOpacity(exclusiveOpacity(progress, SECTION.contact[0], SECTION.contact[1], 0.06));
    });
    return () => {
      unsub();
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed top-0 right-0 z-[5] hidden h-full w-[42%] overflow-visible bg-transparent lg:block lg:w-[45%]"
      style={{
        opacity,
        visibility: opacity > 0.02 ? "visible" : "hidden",
        mixBlendMode: "screen",
      }}
      aria-hidden="true"
    >
      <canvas
        ref={ghostRef}
        className="absolute inset-0 h-full w-full"
        style={{
          objectFit: "cover",
          objectPosition: "68% 32%",
          opacity: 0,
          filter: "blur(12px) saturate(1.1)",
        }}
      />
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover object-top"
        style={{
          objectPosition: "68% 32%",
        }}
        src={CHARACTER_VIDEO}
        muted
        playsInline
        preload="auto"
      />
    </div>
  );
}

"use client";

import { SCROLL_HEIGHT_VH } from "@/lib/scroll/timeline";

export default function ScrollDriver() {
  return (
    <div
      className="scroll-driver"
      style={{ height: `${SCROLL_HEIGHT_VH}vh` }}
      aria-hidden="true"
    />
  );
}

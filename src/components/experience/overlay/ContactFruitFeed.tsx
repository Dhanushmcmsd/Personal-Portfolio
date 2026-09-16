"use client";

import { useEffect, useRef, useState } from "react";
import { useExperienceStore } from "@/stores/experienceStore";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { exclusiveOpacity, SECTION } from "@/lib/scroll/timeline";

const FRUIT_EMOJIS = ["🍎", "🍊", "🍇", "🍌", "🍓", "🍒", "🥝"];

type DOMFruit = {
  id: number;
  x: number;
  y: number;
  emoji: string;
  opacity: number;
};

export default function ContactFruitFeed() {
  const [fruits, setFruits] = useState<DOMFruit[]>([]);
  const [visible, setVisible] = useState(false);
  const lastDropTs = useRef(0);

  useEffect(() => {
    scrollEngine.init();
    const unsubScroll = scrollEngine.subscribe((p) => {
      const contactVis = exclusiveOpacity(p, SECTION.contact[0], SECTION.contact[1], 0.06);
      setVisible(contactVis > 0.12);
      if (contactVis <= 0.05) {
        setFruits([]);
      }
    });

    const unsubStore = useExperienceStore.subscribe((state) => {
      const drop = state.fruitDropAt;
      if (drop && drop.ts !== lastDropTs.current) {
        lastDropTs.current = drop.ts;
        setFruits((prev) => [
          ...prev,
          {
            id: drop.id,
            x: drop.clientX,
            y: drop.clientY,
            emoji: FRUIT_EMOJIS[Math.floor(Math.random() * FRUIT_EMOJIS.length)],
            opacity: 1,
          },
        ]);
      }

      if (state.fruitEatenId !== null) {
        const eatenId = state.fruitEatenId;
        setFruits((prev) =>
          prev.map((f) => (f.id === eatenId ? { ...f, opacity: 0 } : f)).filter((f) => f.opacity > 0)
        );
        useExperienceStore.getState().clearFruitEaten();
      }
    });

    return () => {
      unsubScroll();
      unsubStore();
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="contact-fruit-feed pointer-events-none fixed inset-0 z-[12]" aria-hidden="true">
      {fruits.map((f) => (
        <span
          key={f.id}
          className="contact-fruit-feed__item"
          style={{
            left: f.x,
            top: f.y,
            opacity: f.opacity,
          }}
        >
          {f.emoji}
        </span>
      ))}
    </div>
  );
}

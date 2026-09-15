"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface Food {
  id: number;
  x: number;
  y: number;
}

export default function InteractiveBee() {
  const [beePos, setBeePos] = useState({ x: 0, y: 0 });
  const [foods, setFoods] = useState<Food[]>([]);
  const [target, setTarget] = useState<{ x: number; y: number } | null>(null);
  const [isBuzzing, setIsBuzzing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const foodIdRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!target) {
        setBeePos((prev) => ({
          x: prev.x + (Math.random() - 0.5) * 30,
          y: prev.y + (Math.random() - 0.5) * 20,
        }));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [target]);

  useEffect(() => {
    if (!target) return;

    const moveInterval = setInterval(() => {
      setBeePos((prev) => {
        const dx = target.x - prev.x;
        const dy = target.y - prev.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 15) {
          setTarget(null);
          setIsBuzzing(false);
          setFoods((f) => f.filter((food) => food.x !== target.x || food.y !== target.y));
          return prev;
        }

        return {
          x: prev.x + (dx / dist) * 8,
          y: prev.y + (dy / dist) * 8,
        };
      });
    }, 30);

    return () => clearInterval(moveInterval);
  }, [target]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      const id = foodIdRef.current++;
      setFoods((prev) => [...prev, { id, x, y }]);
      setTarget({ x, y });
      setIsBuzzing(true);
    },
    []
  );

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 cursor-pointer"
      onClick={handleClick}
      aria-label="Click to feed the bee"
    >
      <AnimatePresence>
        {foods.map((food) => (
          <motion.div
            key={food.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute"
            style={{
              left: `calc(50% + ${food.x}px)`,
              top: `calc(50% + ${food.y}px)`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="h-4 w-4 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50" />
          </motion.div>
        ))}
      </AnimatePresence>

      <motion.div
        className={`absolute ${isBuzzing ? "animate-buzz" : "animate-float"}`}
        style={{
          left: `calc(50% + ${beePos.x}px)`,
          top: `calc(50% + ${beePos.y}px)`,
          transform: "translate(-50%, -50%)",
        }}
        animate={{ rotate: isBuzzing ? [0, 5, -5, 0] : 0 }}
        transition={{ duration: 0.3, repeat: isBuzzing ? Infinity : 0 }}
      >
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <ellipse cx="24" cy="28" rx="14" ry="10" fill="#F5C518" />
          <rect x="12" y="24" width="24" height="3" fill="#1a1a1a" rx="1" />
          <rect x="12" y="30" width="24" height="3" fill="#1a1a1a" rx="1" />
          <ellipse cx="24" cy="18" rx="8" ry="7" fill="#F5C518" />
          <circle cx="20" cy="16" r="2" fill="#1a1a1a" />
          <circle cx="28" cy="16" r="2" fill="#1a1a1a" />
          <ellipse cx="16" cy="22" rx="10" ry="5" fill="rgba(200,200,255,0.3)" transform="rotate(-30 16 22)" />
          <ellipse cx="32" cy="22" rx="10" ry="5" fill="rgba(200,200,255,0.3)" transform="rotate(30 32 22)" />
        </svg>
      </motion.div>

      <motion.div
        className="absolute"
        style={{
          left: `calc(50% + ${beePos.x + 60}px)`,
          top: `calc(50% + ${beePos.y - 40}px)`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <Image
          src="/alien-mascot.png"
          alt="Pixel mascot"
          width={40}
          height={40}
          className="animate-float opacity-80"
          style={{ animationDelay: "1s" }}
        />
      </motion.div>
    </div>
  );
}

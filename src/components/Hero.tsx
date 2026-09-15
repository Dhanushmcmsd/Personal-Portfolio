"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { personalInfo } from "@/data/resume";
import CursorSpotlight from "./CursorSpotlight";
import InteractiveBee from "./InteractiveBee";

export default function Hero() {
  const [beeInFront, setBeeInFront] = useState(false);

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-cream px-6">
      <CursorSpotlight />

      {/* Bee layer — z-index toggles as bee flies behind/in front of text */}
      <InteractiveBee
        onDepthChange={(_z, inFront) => setBeeInFront(inFront)}
      />

      {/* Hero text — sits between bee depth layers */}
      <div
        className="relative mx-auto max-w-7xl text-center transition-all duration-150"
        style={{
          zIndex: 10,
          transform: beeInFront ? "scale(0.98)" : "scale(1)",
          filter: beeInFront ? "blur(0.3px)" : "none",
        }}
      >
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-4 text-xs uppercase tracking-[0.3em] text-forest/50"
        >
          {personalInfo.location}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-display text-[clamp(2.5rem,8vw,7rem)] leading-[0.9] tracking-tight text-forest"
          style={{ transformStyle: "preserve-3d" }}
        >
          <span className="block" style={{ transform: "translateZ(0px)" }}>CREATIVE</span>
          <span className="block" style={{ transform: "translateZ(20px)" }}>FULL-STACK</span>
          <span
            className="block underline decoration-purple-500 decoration-4 underline-offset-8"
            style={{ transform: "translateZ(40px)" }}
          >
            AI ENGINEER
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8 text-sm text-forest/60"
        >
          {personalInfo.tagline}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-12 text-[11px] text-forest/40"
        >
          (Click to feed the bee — watch it fly in 3D)
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-10 left-1/2 z-30 -translate-x-1/2"
      >
        <a
          href="#work"
          className="flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-forest/40 transition-colors hover:text-forest/70"
        >
          <span>Scroll down</span>
          <motion.span
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-lg"
          >
            ↓
          </motion.span>
        </a>
      </motion.div>
    </section>
  );
}

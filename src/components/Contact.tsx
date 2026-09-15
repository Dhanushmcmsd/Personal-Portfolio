"use client";

import { motion } from "framer-motion";
import { personalInfo } from "@/data/resume";

export default function Contact() {
  return (
    <section id="contact" className="relative overflow-hidden bg-dark px-6 py-32 md:px-10">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(168,85,247,0.3) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">Contact</span>
          <h2 className="mt-4 font-display text-4xl text-white md:text-7xl">
            LET&apos;S BUILD
            <br />
            <span className="text-neon-cyan glow-cyan">SOMETHING</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 flex flex-col items-center gap-6"
        >
          <a
            href={`mailto:${personalInfo.email}`}
            className="group relative overflow-hidden rounded-full border border-neon-cyan/30 px-10 py-4 text-sm uppercase tracking-[0.2em] text-neon-cyan transition-all hover:border-neon-cyan hover:shadow-[0_0_30px_rgba(0,240,255,0.3)]"
          >
            <span className="relative z-10">{personalInfo.email}</span>
            <div className="absolute inset-0 bg-neon-cyan/10 opacity-0 transition-opacity group-hover:opacity-100" />
          </a>

          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-white/50">
            <a
              href={`tel:${personalInfo.phone.replace(/\s/g, "")}`}
              className="transition-colors hover:text-neon-cyan"
            >
              {personalInfo.phone}
            </a>
            <span className="hidden text-white/20 md:inline">|</span>
            <a
              href={personalInfo.github}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-neon-cyan"
            >
              GitHub
            </a>
            <span className="hidden text-white/20 md:inline">|</span>
            <span>{personalInfo.location}</span>
          </div>
        </motion.div>
      </div>

      <footer className="relative z-10 mx-auto mt-32 max-w-7xl border-t border-white/10 pt-8 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/30">
          © {new Date().getFullYear()} {personalInfo.name} — Built with Next.js &amp; Three.js
        </p>
      </footer>
    </section>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { PORTFOLIO_CONFIG } from "@/config/portfolio";
import {
  computeOverlayDepth,
  getAnimationMode,
} from "@/lib/animation/exhibitVariants";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import {
  exclusiveOpacity,
  inverseRangeProgress,
  rangeProgress,
  TIMELINE,
} from "@/lib/scroll/timeline";

function setEl(
  el: HTMLElement | null,
  opacity: number,
  transform = "translateY(0px)",
  pointerEvents: "auto" | "none" = "none",
  filter = "blur(0px)"
) {
  if (!el) return;
  el.style.opacity = String(opacity);
  el.style.transform = transform;
  el.style.pointerEvents = pointerEvents;
  el.style.filter = filter;
}

export default function OverlayUI() {
  const heroRef = useRef<HTMLDivElement>(null);
  const projectCardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const experienceRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    scrollEngine.init();
    const startTime = performance.now();

    const unsub = scrollEngine.subscribe((p) => {
      const elapsed = performance.now() - startTime;
      const mode = getAnimationMode(elapsed);
      const heroOpacity = inverseRangeProgress(p, TIMELINE.hero, TIMELINE.transition);
      setEl(heroRef.current, heroOpacity, `translateY(${p * -24}px) scale(${1 - p * 0.04})`);

      PORTFOLIO_CONFIG.projects.forEach((project, i) => {
        const card = projectCardsRef.current[i];
        const visibility = exclusiveOpacity(
          p,
          project.timelineStart,
          project.timelineEnd,
          0.04
        );
        const depth = computeOverlayDepth(mode, elapsed / 1000, visibility);
        const side = i % 2 === 0 ? -1 : 1;
        const slideX = (1 - visibility) * side * 80;
        setEl(
          card,
          visibility,
          `translate3d(${slideX + depth.translateZ * 0.02}px, ${(1 - visibility) * 30}px, ${depth.translateZ}px) scale(${0.92 + visibility * 0.08 * depth.scale})`,
          visibility > 0.35 ? "auto" : "none",
          visibility > 0.2 ? `blur(${depth.blur}px)` : "blur(8px)"
        );
      });

      const expOpacity =
        rangeProgress(p, TIMELINE.experience - 0.02, TIMELINE.experience + 0.04) *
        inverseRangeProgress(p, TIMELINE.about - 0.02, TIMELINE.about + 0.04);
      setEl(experienceRef.current, expOpacity, `translateY(${(1 - expOpacity) * 36}px)`);

      const aboutOpacity = rangeProgress(p, TIMELINE.about - 0.02, TIMELINE.about + 0.06);
      const aboutDepth = computeOverlayDepth(mode, elapsed / 1000, aboutOpacity);
      setEl(
        aboutRef.current,
        aboutOpacity,
        `translate3d(0, ${(1 - aboutOpacity) * 32}px, ${aboutDepth.translateZ * 0.5}px) scale(${0.96 + aboutOpacity * 0.04})`,
        aboutOpacity > 0.3 ? "auto" : "none"
      );

      const contactOpacity = rangeProgress(p, TIMELINE.contact - 0.03, TIMELINE.contact + 0.04);
      setEl(contactRef.current, contactOpacity, `translateY(${(1 - contactOpacity) * 24}px)`);

      if (hudRef.current) {
        hudRef.current.style.opacity = String(0.35 + p * 0.45);
      }
      if (clockRef.current) {
        clockRef.current.textContent = new Date().toISOString().slice(11, 19);
      }
    });

    return () => {
      unsub();
      scrollEngine.destroy();
    };
  }, []);

  const { person, hero, content, projects, experience, education, skills } = PORTFOLIO_CONFIG;

  return (
    <div className="overlay-ui pointer-events-none fixed inset-0 z-10">
      <div ref={hudRef} className="technical-hud absolute inset-0" aria-hidden="true">
        <div className="hud-corner hud-corner-tl" />
        <div className="hud-corner hud-corner-tr" />
        <div className="hud-corner hud-corner-bl" />
        <div className="hud-corner hud-corner-br" />
        <div className="hud-scanline" />
        <div className="hud-status absolute left-6 top-24 hidden md:block">
          <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-[#00E5FF]/50">
            SYS::PORTFOLIO_3D
          </p>
          <p className="mt-1 font-mono text-[9px] text-[#F4F1EA]/30">
            MODE <span className="text-[#8B5CFF]">IMMERSIVE</span> · DEPTH ON
          </p>
          <p className="mt-1 font-mono text-[9px] text-[#F4F1EA]/25">
            UTC <span ref={clockRef}>00:00:00</span>
          </p>
        </div>
        <div className="hud-status absolute right-6 top-24 hidden text-right md:block">
          <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-[#00E5FF]/50">
            SCROLL_VECTOR
          </p>
          <p className="mt-1 font-mono text-[9px] text-[#F4F1EA]/30">
            CITY_PASS · NEON_BUILDINGS · FOG_LAYER
          </p>
        </div>
      </div>

      <div
        ref={heroRef}
        className="absolute inset-0 flex flex-col justify-center px-6 md:px-16"
        style={{ opacity: 1 }}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#00E5FF]/70">
          {hero.eyebrow}
        </p>
        <h1 className="mt-6 max-w-5xl font-[family-name:var(--font-display)] text-[clamp(2.8rem,9vw,7.5rem)] leading-[0.88] tracking-tight text-[#F4F1EA]">
          {person.displayName.split(" ").map((word) => (
            <span key={word} className="block">
              {word}
            </span>
          ))}
        </h1>
        <p className="mt-8 max-w-xl text-lg text-[#F4F1EA]/70 md:text-xl">{hero.title}</p>
        <p className="mt-4 max-w-lg text-sm text-[#F4F1EA]/50">{hero.subtitle}</p>
        <p className="mt-16 font-mono text-[10px] uppercase tracking-[0.3em] text-[#F4F1EA]/30">
          {hero.scrollLabel} ↓
        </p>
      </div>

      <div className="absolute inset-0">
        {projects.map((project, i) => (
          <div
            key={project.id}
            ref={(el) => {
              projectCardsRef.current[i] = el;
            }}
            className="project-card absolute inset-0 flex items-center px-6 md:px-16"
            style={{ opacity: 0 }}
          >
            <div
              className={`max-w-xl ${i % 2 === 0 ? "mr-auto" : "ml-auto text-right"}`}
              style={{ transformStyle: "preserve-3d" }}
            >
              <span className="font-mono text-[10px] tracking-[0.3em] text-[#F4F1EA]/40">
                PROJECT {project.index} · {project.category}
              </span>
              <h2
                className="font-[family-name:var(--font-display)] text-[clamp(2.2rem,7vw,5.5rem)] leading-none"
                style={{ color: project.color }}
              >
                {project.title}
              </h2>
              <p className="mt-1 text-sm text-[#F4F1EA]/55">{project.subtitle}</p>
              <p className="mt-4 max-w-md text-xs leading-relaxed text-[#F4F1EA]/45">
                {project.description}
              </p>
              <div
                className={`mt-5 flex flex-wrap gap-2 ${i % 2 === 1 ? "justify-end" : ""}`}
              >
                {project.technologies.slice(0, 4).map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[9px] text-[#F4F1EA]/55"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        ref={experienceRef}
        className="absolute inset-0 flex items-center px-6 md:px-16"
        style={{ opacity: 0 }}
      >
        <div className="max-w-3xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#00E5FF]/60">
            Experience
          </p>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-[#F4F1EA] md:text-6xl">
            WHERE I&apos;VE WORKED
          </h2>
          <div className="mt-12 space-y-10">
            {experience.map((job) => (
              <div key={job.company + job.role} className="border-l border-[#00E5FF]/30 pl-6">
                <p className="font-mono text-xs text-[#F4F1EA]/40">{job.period}</p>
                <h3 className="mt-1 text-xl text-[#F4F1EA]">{job.role}</h3>
                <p className="text-sm text-[#00E5FF]">{job.company}</p>
                <ul className="mt-3 space-y-2">
                  {job.highlights.slice(0, 2).map((h) => (
                    <li key={h} className="text-xs leading-relaxed text-[#F4F1EA]/50">
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {education.map((edu) => (
              <div key={edu.degree} className="rounded-lg border border-white/5 bg-white/5 p-4">
                <p className="font-mono text-[10px] text-[#F4F1EA]/40">{edu.period}</p>
                <p className="mt-1 text-sm text-[#F4F1EA]">{edu.degree}</p>
                <p className="text-xs text-[#F4F1EA]/50">{edu.school}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        ref={aboutRef}
        className="absolute inset-0 flex items-center px-6 md:px-16"
        style={{ opacity: 0 }}
      >
        <div className="max-w-4xl">
          <h2 className="font-[family-name:var(--font-display)] text-[clamp(3rem,10vw,8rem)] leading-[0.9] text-[#F4F1EA]">
            {content.aboutTitle}
          </h2>
          <p className="mt-8 max-w-2xl text-lg font-medium leading-relaxed text-[#F4F1EA]/80 md:text-xl">
            {content.aboutLead}
          </p>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-[#F4F1EA]/55 md:text-base">
            {content.aboutText}
          </p>
          <p className="mt-10 font-mono text-[11px] text-[#F4F1EA]/30">
            (Click to feed the virus)
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {skills.programming.slice(0, 6).map((s) => (
              <span key={s} className="font-mono text-[10px] text-[#F4F1EA]/40">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div
        ref={contactRef}
        className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
        style={{ opacity: 0 }}
      >
        <h2 className="font-[family-name:var(--font-display)] text-[clamp(2.5rem,8vw,6rem)] leading-none text-[#F4F1EA]">
          {content.contactHeading}
        </h2>
        <p className="mt-6 max-w-md text-sm text-[#F4F1EA]/50">{content.contactText}</p>
        <div className="pointer-events-auto mt-12 flex flex-col items-center gap-4">
          <a
            href={`mailto:${person.email}`}
            className="pressable rounded-full border border-[#00E5FF]/40 px-8 py-3 font-mono text-xs uppercase tracking-[0.2em] text-[#00E5FF] transition-colors hover:border-[#00E5FF]"
          >
            {person.email}
          </a>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#F4F1EA]/40">
            <a href={`tel:${person.phone.replace(/\s/g, "")}`} className="hover:text-[#00E5FF]">
              {person.phone}
            </a>
            <a
              href={person.github}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#00E5FF]"
            >
              GitHub
            </a>
            <a
              href={person.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#00E5FF]"
            >
              LinkedIn
            </a>
            <span>{person.location}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

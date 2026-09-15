"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { PORTFOLIO_CONFIG } from "@/config/portfolio";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import {
  computeScrollOverlayTransform,
  exclusiveOpacity,
  inverseRangeProgress,
  rangeProgress,
  sectionLocalProgress,
  SECTION,
  TIMELINE,
} from "@/lib/scroll/timeline";

function setEl(
  el: HTMLElement | null,
  opacity: number,
  transform = "translateY(0px)",
  pointerEvents: "auto" | "none" = "none"
) {
  if (!el) return;
  el.style.opacity = String(opacity);
  el.style.transform = transform;
  el.style.pointerEvents = pointerEvents;
}

export default function OverlayUI() {
  const heroRef = useRef<HTMLDivElement>(null);
  const projectCardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const experienceRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const aboutPaperRef = useRef<HTMLDivElement>(null);
  const aboutPhotoRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    scrollEngine.init();

    const unsub = scrollEngine.subscribe((p) => {
      const heroOpacity = inverseRangeProgress(p, TIMELINE.hero, TIMELINE.transition);
      setEl(heroRef.current, heroOpacity, `translateY(${p * -20}px) scale(${1 - p * 0.03})`);

      PORTFOLIO_CONFIG.projects.forEach((project, i) => {
        const card = projectCardsRef.current[i];
        const visibility = exclusiveOpacity(
          p,
          project.timelineStart,
          project.timelineEnd,
          0.02
        );
        const local = sectionLocalProgress(p, project.timelineStart, project.timelineEnd);
        const side = i % 2 === 0 ? (-1 as const) : (1 as const);
        const anim = computeScrollOverlayTransform(local, side, visibility);
        const boxFadeIn = local < 0.14 ? local / 0.14 : 1;
        const boxFadeOut = local > 0.86 ? (1 - local) / 0.14 : 1;
        const boxOpacity = visibility * boxFadeIn * boxFadeOut;

        setEl(
          card,
          anim.opacity,
          `translate3d(${anim.x}px, ${anim.y}px, ${anim.z}px) scale(${anim.scale})`,
          anim.opacity > 0.4 ? "auto" : "none"
        );

        const backbox = card?.querySelector(".project-backbox") as HTMLElement | null;
        if (backbox) {
          backbox.style.setProperty("--box-opacity", String(Math.min(1, boxOpacity)));
        }
      });

      const expOpacity =
        rangeProgress(p, SECTION.experience[0], SECTION.experience[0] + 0.03) *
        inverseRangeProgress(p, SECTION.experience[1] - 0.02, SECTION.experience[1] + 0.02);
      setEl(experienceRef.current, expOpacity, `translateY(${(1 - expOpacity) * 28}px)`);

      const aboutOpacity = exclusiveOpacity(
        p,
        SECTION.about[0],
        SECTION.about[1],
        0.025
      );
      const aboutLocal = sectionLocalProgress(p, SECTION.about[0], SECTION.about[1]);
      setEl(
        aboutRef.current,
        aboutOpacity,
        `translate3d(0, ${(1 - aboutOpacity) * 24}px, 0) scale(${0.97 + aboutOpacity * 0.03})`,
        aboutOpacity > 0.35 ? "auto" : "none"
      );
      if (aboutPaperRef.current) {
        aboutPaperRef.current.style.setProperty("--paper-open", String(aboutLocal));
      }
      if (aboutPhotoRef.current) {
        aboutPhotoRef.current.style.setProperty("--photo-reveal", String(aboutLocal));
        aboutPhotoRef.current.style.setProperty(
          "--photo-glitch",
          String(aboutLocal * (0.4 + Math.sin(p * 40) * 0.15))
        );
      }

      const contactOpacity = exclusiveOpacity(
        p,
        SECTION.contact[0],
        SECTION.contact[1],
        0.03
      );
      setEl(
        contactRef.current,
        contactOpacity,
        `translate3d(0, ${(1 - contactOpacity) * 20}px, 0) scale(${0.96 + contactOpacity * 0.04})`,
        contactOpacity > 0.35 ? "auto" : "none"
      );

      if (hudRef.current) {
        hudRef.current.style.opacity = String(0.3 + p * 0.5);
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
          <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-[#39ff14]/50">
            SYS::GLITCH_CITY
          </p>
          <p className="mt-1 font-mono text-[9px] text-[#F4F1EA]/30">
            MODE <span className="text-[#39ff14]">INFINITE_SCROLL</span>
          </p>
          <p className="mt-1 font-mono text-[9px] text-[#F4F1EA]/25">
            UTC <span ref={clockRef}>00:00:00</span>
          </p>
        </div>
      </div>

      <div
        ref={heroRef}
        className="absolute inset-0 flex flex-col justify-center px-6 md:px-16"
        style={{ opacity: 1 }}
      >
        <p className="hero-glitch-text font-mono text-[10px] uppercase tracking-[0.35em] opacity-80">
          {hero.eyebrow}
        </p>
        <h1 className="hero-glitch-text mt-6 max-w-5xl text-[clamp(2.2rem,7vw,5.8rem)] leading-[0.92] tracking-tight">
          {person.displayName.split(" ").map((word) => (
            <span key={word} className="block">
              {word}
            </span>
          ))}
        </h1>
        <p className="hero-glitch-text mt-8 max-w-xl text-lg md:text-xl">{hero.title}</p>
        <p className="hero-glitch-text mt-4 max-w-lg text-sm opacity-90">{hero.subtitle}</p>
        <p className="hero-glitch-text mt-16 font-mono text-[10px] uppercase tracking-[0.3em] opacity-60">
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
              className={`project-backbox max-w-xl ${i % 2 === 0 ? "mr-auto" : "ml-auto text-right"}`}
              style={{ transformStyle: "preserve-3d", "--box-opacity": 0 } as CSSProperties}
            >
              <span className="font-mono text-[10px] tracking-[0.3em] text-[#39ff14]/45">
                PROJECT {project.index} · {project.category}
              </span>
              <h2
                className="glitch-outline font-[family-name:var(--font-display)] text-[clamp(2.2rem,7vw,5.5rem)] leading-none"
                style={{ color: project.color }}
              >
                {project.title}
              </h2>
              <p className="glitch-outline mt-1 text-sm text-[#F4F1EA]/60">{project.subtitle}</p>
              <p className="project-desc-gold mt-4 max-w-md text-xs leading-relaxed">
                {project.description}
              </p>
              <div
                className={`mt-5 flex flex-wrap gap-2 ${i % 2 === 1 ? "justify-end" : ""}`}
              >
                {project.technologies.slice(0, 4).map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-[#39ff14]/15 bg-[#39ff14]/[0.04] px-2 py-0.5 font-mono text-[9px] text-[#F4F1EA]/55"
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
        className="section-dark-text absolute inset-0 flex items-center px-6 md:px-16"
        style={{ opacity: 0 }}
      >
        <div className="max-w-3xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] opacity-70">
            Experience
          </p>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl md:text-6xl">
            WHERE I&apos;VE WORKED
          </h2>
          <div className="mt-12 space-y-10">
            {experience.map((job) => (
              <div key={job.company + job.role} className="border-l border-[#722F37]/40 pl-6">
                <p className="font-mono text-xs opacity-70">{job.period}</p>
                <h3 className="mt-1 text-xl">{job.role}</h3>
                <p className="text-sm opacity-85">{job.company}</p>
                <ul className="mt-3 space-y-2">
                  {job.highlights.slice(0, 2).map((h) => (
                    <li key={h} className="text-xs leading-relaxed opacity-75">
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {education.map((edu) => (
              <div key={edu.degree} className="rounded-lg border border-[#722F37]/20 bg-white/40 p-4">
                <p className="font-mono text-[10px] opacity-70">{edu.period}</p>
                <p className="mt-1 text-sm">{edu.degree}</p>
                <p className="text-xs opacity-75">{edu.school}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        ref={aboutRef}
        className="section-about-text absolute inset-0 flex items-center px-6 md:px-16"
        style={{ opacity: 0 }}
      >
        <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-10 md:grid-cols-2">
          <div ref={aboutPaperRef} className="about-paper-panel" style={{ "--paper-open": 0 } as CSSProperties}>
            <h2 className="font-[family-name:var(--font-display)] text-[clamp(2.4rem,8vw,5.5rem)] leading-[0.9]">
              {content.aboutTitle}
            </h2>
            <p className="mt-8 max-w-xl text-lg font-medium leading-relaxed md:text-xl">
              {content.aboutLead}
            </p>
            <p className="mt-6 max-w-xl text-sm leading-relaxed md:text-base opacity-80">
              {content.aboutText}
            </p>
            <p className="mt-10 font-mono text-[11px] opacity-50">
              Scroll to explore the city below.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {skills.programming.slice(0, 6).map((s) => (
                <span key={s} className="font-mono text-[10px] opacity-60">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div
            ref={aboutPhotoRef}
            className="about-photo-wrap hidden md:block"
            style={{ "--photo-reveal": 0, "--photo-glitch": 0 } as CSSProperties}
          >
            <div className="about-photo-frame">
              <img src={person.photo} alt={person.displayName} />
            </div>
          </div>
        </div>
      </div>

      <div
        ref={contactRef}
        className="section-dark-text absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
        style={{ opacity: 0 }}
      >
        <h2 className="font-[family-name:var(--font-display)] text-[clamp(2.5rem,8vw,6rem)] leading-none">
          {content.contactHeading}
        </h2>
        <p className="mt-6 max-w-md text-sm opacity-75">{content.contactText}</p>
        <p className="mt-4 font-mono text-[10px] opacity-60">(Click to feed the virus)</p>
        <div className="pointer-events-auto mt-12 flex flex-col items-center gap-4">
          <a
            href={`mailto:${person.email}`}
            className="pressable rounded-full border border-[#722F37]/50 bg-white/50 px-8 py-3 font-mono text-xs uppercase tracking-[0.2em] transition-colors hover:border-[#722F37]"
          >
            {person.email}
          </a>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs opacity-75">
            <a href={`tel:${person.phone.replace(/\s/g, "")}`} className="hover:opacity-100">
              {person.phone}
            </a>
            <a
              href={person.github}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-100"
            >
              GitHub
            </a>
            <a
              href={person.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-100"
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

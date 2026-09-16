"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PORTFOLIO_CONFIG } from "@/config/portfolio";
import { useExperienceStore } from "@/stores/experienceStore";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import AboutStringConnections from "./AboutStringConnections";
import ExperienceCarousel from "./ExperienceCarousel";
import {
  computeScrollOverlayTransform,
  exclusiveOpacity,
  inverseRangeProgress,
  rangeProgress,
  sectionLocalProgress,
  smootherstep,
  SECTION,
  TIMELINE,
} from "@/lib/scroll/timeline";

function photoRevealProgress(local: number) {
  return smootherstep(0.06, 0.92, local);
}

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
  const experienceBgRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const aboutPaperRef = useRef<HTMLDivElement>(null);
  const aboutPhotoRef = useRef<HTMLDivElement>(null);
  const aboutLocalRef = useRef(0);
  const contactRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const [aboutStringsActive, setAboutStringsActive] = useState(false);

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
      const expLocal = sectionLocalProgress(p, SECTION.experience[0], SECTION.experience[1]);
      const expBgReveal =
        smootherstep(0, 0.45, expLocal) * (1 - smootherstep(0.72, 1, expLocal));
      const expScrollAway = smootherstep(0.5, 0.96, expLocal);
      const expExitFade = 1 - expScrollAway;
      const rowEnter = smootherstep(0.04, 0.55, expLocal) * expExitFade;
      const rowLift = (1 - rowEnter) * 36;
      const rowScale = 0.94 + rowEnter * 0.06;

      setEl(
        experienceRef.current,
        expOpacity,
        `translateY(${(1 - expOpacity) * 28 + rowLift}px) scale(${rowScale})`,
        expOpacity > 0.2 ? "auto" : "none"
      );

      if (experienceBgRef.current) {
        experienceBgRef.current.style.setProperty("--exp-reveal", String(expBgReveal));
        experienceBgRef.current.style.setProperty("--exp-scroll-away", String(expScrollAway));
        experienceBgRef.current.style.opacity = String(expOpacity * expBgReveal * expExitFade);
      }

      const aboutOpacity = exclusiveOpacity(
        p,
        SECTION.about[0],
        SECTION.about[1],
        0.025
      );
      const aboutLocal = sectionLocalProgress(p, SECTION.about[0], SECTION.about[1]);
      aboutLocalRef.current = aboutLocal;
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
        const photoReveal = photoRevealProgress(aboutLocal);
        aboutPhotoRef.current.style.setProperty("--photo-reveal", String(photoReveal));
        aboutPhotoRef.current.style.setProperty(
          "--photo-glitch",
          String(photoReveal * (0.15 + Math.sin(p * 24) * 0.08))
        );
      }
      setAboutStringsActive(aboutOpacity > 0.35);

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
    };
  }, []);

  const { person, hero, content, projects, skills } = PORTFOLIO_CONFIG;

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
        className="hero-section absolute inset-0 flex flex-col items-center justify-center px-4 md:px-10"
        style={{ opacity: 1 }}
      >
        <div className="hero-content w-full max-w-[min(100%,920px)] px-2 text-center">
          <p className="hero-eyebrow-text mx-auto text-[15px] md:text-[18px] opacity-80">
            {hero.eyebrow}
          </p>
          <h1 className="hero-name-text mx-auto mt-6 w-full text-[clamp(1.05rem,3.6vw,3.5rem)] leading-none">
            {person.displayName}
          </h1>
          <p className="hero-body-text mx-auto mt-8 w-full max-w-4xl text-2xl md:text-4xl">{hero.title}</p>
          <p className="hero-body-text mx-auto mt-4 w-full max-w-3xl text-base md:text-xl opacity-90">
            {hero.subtitle}
          </p>
          <p className="hero-body-text mx-auto mt-16 text-[14px] md:text-[17px] opacity-70">
            {hero.scrollLabel} ↓
          </p>
        </div>
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
        className="section-experience absolute inset-0 flex items-center justify-center px-4 py-8 md:px-10"
        style={{ opacity: 0 }}
      >
        <div
          ref={experienceBgRef}
          className="experience-glow-panel"
          style={{ "--exp-reveal": 0, "--exp-scroll-away": 0 } as CSSProperties}
          aria-hidden="true"
        />
        <div className="pointer-events-auto relative z-10 w-full max-w-6xl">
          <ExperienceCarousel />
        </div>
      </div>

      <AboutStringConnections
        paperRef={aboutPaperRef}
        photoRef={aboutPhotoRef}
        containerRef={aboutRef}
        aboutLocalRef={aboutLocalRef}
        active={aboutStringsActive}
      />

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
        className="section-contact absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
        style={{ opacity: 0 }}
        onClick={(e) => {
          const opacity = Number(contactRef.current?.style.opacity ?? 0);
          if (opacity > 0.35 && !(e.target as HTMLElement).closest("a")) {
            useExperienceStore.getState().queueFruitDrop(e.clientX, e.clientY);
          }
        }}
      >
        <h2 className="font-[family-name:var(--font-display)] text-[clamp(2.5rem,8vw,6rem)] leading-none">
          {content.contactHeading}
        </h2>
        <p className="mt-6 max-w-md text-sm opacity-75">{content.contactText}</p>
        <p className="mt-4 font-mono text-[10px] opacity-60">(Click to feed the virus)</p>
        <div className="pointer-events-auto mt-12 flex flex-col items-center gap-4">
          <a
            href={`mailto:${person.email}`}
            className="contact-email-btn pressable rounded-full border px-8 py-3 font-mono text-xs uppercase tracking-[0.2em] transition-colors"
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

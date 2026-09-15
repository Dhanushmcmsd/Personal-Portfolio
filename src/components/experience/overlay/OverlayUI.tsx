"use client";

import { useEffect, useRef } from "react";
import { PORTFOLIO_CONFIG } from "@/config/portfolio";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { rangeProgress, inverseRangeProgress, TIMELINE } from "@/lib/scroll/timeline";

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
  const projectsRef = useRef<HTMLDivElement>(null);
  const experienceRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollEngine.init();
    const unsub = scrollEngine.subscribe((p) => {
      const heroOpacity = inverseRangeProgress(p, TIMELINE.hero, TIMELINE.transition);
      setEl(heroRef.current, heroOpacity, `translateY(${p * -30}px)`);

      const projectOpacity = Math.max(
        rangeProgress(p, TIMELINE.vigilance - 0.04, TIMELINE.vigilance + 0.02),
        rangeProgress(p, TIMELINE.hsn - 0.04, TIMELINE.hsn + 0.02),
        rangeProgress(p, TIMELINE.finance - 0.04, TIMELINE.finance + 0.02)
      ) * inverseRangeProgress(p, TIMELINE.finance + 0.08, TIMELINE.experience);

      setEl(projectsRef.current, Math.min(1, projectOpacity * 0.9));

      const expOpacity =
        rangeProgress(p, TIMELINE.experience - 0.02, TIMELINE.experience + 0.04) *
        inverseRangeProgress(p, TIMELINE.about - 0.02, TIMELINE.about + 0.04);
      setEl(experienceRef.current, expOpacity);

      const aboutOpacity = rangeProgress(p, TIMELINE.about - 0.02, TIMELINE.about + 0.06);
      setEl(
        aboutRef.current,
        aboutOpacity,
        `translateY(${(1 - aboutOpacity) * 40}px)`,
        aboutOpacity > 0.3 ? "auto" : "none"
      );

      const contactOpacity = rangeProgress(p, TIMELINE.contact - 0.03, TIMELINE.contact + 0.04);
      setEl(contactRef.current, contactOpacity);
    });

    return () => {
      unsub();
      scrollEngine.destroy();
    };
  }, []);

  const { person, hero, content, projects, experience, education, skills } = PORTFOLIO_CONFIG;

  return (
    <div className="overlay-ui pointer-events-none fixed inset-0 z-10">
      {/* Hero */}
      <div
        ref={heroRef}
        className="absolute inset-0 flex flex-col justify-center px-6 md:px-16"
        style={{ opacity: 1 }}
      >
        <p className="text-[10px] uppercase tracking-[0.35em] text-[#00E5FF]/70">
          {hero.eyebrow}
        </p>
        <h1 className="mt-6 max-w-5xl font-[family-name:var(--font-display)] text-[clamp(2.8rem,9vw,7.5rem)] leading-[0.88] tracking-tight text-[#F4F1EA]">
          {person.displayName.split(" ").map((word) => (
            <span key={word} className="block">{word}</span>
          ))}
        </h1>
        <p className="mt-8 max-w-xl text-lg text-[#F4F1EA]/70 md:text-xl">{hero.title}</p>
        <p className="mt-4 max-w-lg text-sm text-[#F4F1EA]/50">{hero.subtitle}</p>
        <p className="mt-16 text-[10px] uppercase tracking-[0.3em] text-[#F4F1EA]/30">
          {hero.scrollLabel} ↓
        </p>
      </div>

      {/* Project labels — floating in space */}
      <div ref={projectsRef} className="absolute inset-0" style={{ opacity: 0 }}>
        {projects.map((project, i) => (
          <div
            key={project.id}
            className="absolute"
            style={{
              left: i % 2 === 0 ? "6%" : "auto",
              right: i % 2 === 1 ? "6%" : "auto",
              top: `${28 + i * 18}%`,
            }}
          >
            <span className="text-[10px] tracking-[0.3em] text-[#F4F1EA]/40">
              PROJECT {project.index}
            </span>
            <h2
              className="font-[family-name:var(--font-display)] text-[clamp(2rem,6vw,5rem)] leading-none"
              style={{ color: project.color }}
            >
              {project.title}
            </h2>
            <p className="mt-1 text-sm text-[#F4F1EA]/50">{project.subtitle}</p>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-[#F4F1EA]/40">
              {project.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {project.technologies.slice(0, 4).map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] text-[#F4F1EA]/50"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Experience */}
      <div
        ref={experienceRef}
        className="absolute inset-0 flex items-center px-6 md:px-16"
        style={{ opacity: 0 }}
      >
        <div className="max-w-3xl">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#00E5FF]/60">Experience</p>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-[#F4F1EA] md:text-6xl">
            WHERE I&apos;VE WORKED
          </h2>
          <div className="mt-12 space-y-10">
            {experience.map((job) => (
              <div key={job.company + job.role} className="border-l border-[#00E5FF]/30 pl-6">
                <p className="text-xs text-[#F4F1EA]/40">{job.period}</p>
                <h3 className="mt-1 text-xl text-[#F4F1EA]">{job.role}</h3>
                <p className="text-sm text-[#00E5FF]">{job.company}</p>
                <ul className="mt-3 space-y-2">
                  {job.highlights.slice(0, 2).map((h) => (
                    <li key={h} className="text-xs leading-relaxed text-[#F4F1EA]/50">{h}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {education.map((edu) => (
              <div key={edu.degree} className="rounded-lg border border-white/5 bg-white/5 p-4">
                <p className="text-[10px] text-[#F4F1EA]/40">{edu.period}</p>
                <p className="mt-1 text-sm text-[#F4F1EA]">{edu.degree}</p>
                <p className="text-xs text-[#F4F1EA]/50">{edu.school}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WHO I AM */}
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
          <p className="mt-10 text-[11px] text-[#F4F1EA]/30">
            (Click to feed the virus)
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {skills.programming.slice(0, 6).map((s) => (
              <span key={s} className="text-[10px] text-[#F4F1EA]/40">{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Contact */}
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
            className="pressable rounded-full border border-[#00E5FF]/40 px-8 py-3 text-xs uppercase tracking-[0.2em] text-[#00E5FF] transition-colors hover:border-[#00E5FF]"
          >
            {person.email}
          </a>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#F4F1EA]/40">
            <a href={`tel:${person.phone.replace(/\s/g, "")}`} className="hover:text-[#00E5FF]">
              {person.phone}
            </a>
            <a href={person.github} target="_blank" rel="noopener noreferrer" className="hover:text-[#00E5FF]">
              GitHub
            </a>
            <a href={person.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-[#00E5FF]">
              LinkedIn
            </a>
            <span>{person.location}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

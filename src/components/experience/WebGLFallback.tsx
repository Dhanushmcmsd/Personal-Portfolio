"use client";

import { PORTFOLIO_CONFIG } from "@/config/portfolio";

export default function WebGLFallback() {
  const { person, content, projects } = PORTFOLIO_CONFIG;

  return (
    <div className="min-h-screen bg-[#06080B] px-6 py-24 text-[#F4F1EA]">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">{person.displayName}</h1>
      <p className="mt-4 text-[#F4F1EA]/60">{person.role}</p>
      <p className="mt-8 max-w-2xl text-sm leading-relaxed text-[#F4F1EA]/70">{content.aboutText}</p>
      <div className="mt-16 space-y-12">
        {projects.map((p) => (
          <div key={p.id}>
            <h2 className="text-2xl" style={{ color: p.color }}>{p.title}</h2>
            <p className="mt-2 text-sm text-[#F4F1EA]/60">{p.description}</p>
          </div>
        ))}
      </div>
      <a href={`mailto:${person.email}`} className="mt-16 inline-block text-[#00E5FF]">{person.email}</a>
    </div>
  );
}

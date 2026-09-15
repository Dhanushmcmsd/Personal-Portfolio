"use client";

import { PORTFOLIO_CONFIG } from "@/config/portfolio";
import { NAV_TARGETS } from "@/lib/scroll/timeline";
import { scrollEngine } from "@/lib/scroll/scrollEngine";

const links = [
  { label: "Work", key: "work" },
  { label: "About", key: "about" },
  { label: "Experience", key: "experience" },
  { label: "Contact", key: "contact" },
];

export default function Navigation() {
  const seek = (key: string) => {
    if (key === "about") {
      scrollEngine.seek(0);
      return;
    }
    const target = NAV_TARGETS[key];
    if (target !== undefined) scrollEngine.seek(target);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 md:px-10"
      style={{
        paddingTop: "max(1.25rem, env(safe-area-inset-top))",
      }}
    >
      <button
        onClick={() => scrollEngine.seek(0)}
        className="pressable text-left"
      >
        <span className="font-[family-name:var(--font-display)] text-xs tracking-tight text-[#F4F1EA]/90">
          {PORTFOLIO_CONFIG.person.displayName}
        </span>
        <span className="mt-0.5 block text-[9px] uppercase tracking-[0.2em] text-[#F4F1EA]/40">
          {PORTFOLIO_CONFIG.person.shortRole}
        </span>
      </button>

      <div className="flex items-center gap-5 md:gap-8">
        {links.map((link) => (
          <button
            key={link.key}
            onClick={() => seek(link.key)}
            className="pressable text-[10px] uppercase tracking-[0.25em] text-[#F4F1EA]/50 transition-colors hover:text-[#00E5FF]"
          >
            {link.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

"use client";

import { PORTFOLIO_CONFIG } from "@/config/portfolio";
import { NAV_TARGETS } from "@/lib/scroll/timeline";
import { scrollEngine } from "@/lib/scroll/scrollEngine";

const links = [
  { label: "Work", key: "work" },
  { label: "Experience", key: "experience" },
  { label: "About", key: "about" },
  { label: "Contact", key: "contact" },
];

export default function Navigation() {
  const seek = (key: string) => {
    scrollEngine.init();
    const target = NAV_TARGETS[key];
    if (target !== undefined) scrollEngine.seek(target);
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 md:px-10"
      style={{
        paddingTop: "max(1.25rem, env(safe-area-inset-top))",
      }}
    >
      <button onClick={() => { scrollEngine.init(); scrollEngine.seek(0); }} className="pressable text-left max-w-[42vw] sm:max-w-none">
        <span className="nav-kola-text text-[10px] sm:text-xs text-[#F4F1EA]/90 leading-tight">
          {PORTFOLIO_CONFIG.person.displayName}
        </span>
        <span className="nav-kola-text mt-0.5 hidden text-[10px] text-[#F4F1EA]/45 sm:block">
          {PORTFOLIO_CONFIG.person.shortRole}
        </span>
      </button>

      <div className="flex items-center gap-2.5 sm:gap-5 md:gap-8">
        {links.map((link) => (
          <button
            key={link.key}
            onClick={() => seek(link.key)}
            className="nav-kola-text pressable text-[9px] sm:text-[11px] text-[#F4F1EA]/55 transition-colors hover:text-[#00E5FF]"
          >
            {link.key === "experience" ? (
              <>
                <span className="sm:hidden">Exp</span>
                <span className="hidden sm:inline">Experience</span>
              </>
            ) : (
              link.label
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}

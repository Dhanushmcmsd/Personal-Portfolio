type ScrollListener = (progress: number, velocity: number) => void;

class ScrollEngine {
  target = 0;
  current = 0;
  progress = 0;
  velocity = 0;
  reducedMotion = false;
  private listeners = new Set<ScrollListener>();
  private rafId = 0;
  private lastTarget = 0;
  private initialized = false;

  init() {
    if (this.initialized || typeof window === "undefined") return;
    this.initialized = true;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.addEventListener("scroll", this.onScroll, { passive: true });
    window.addEventListener("resize", this.onScroll, { passive: true });
    this.onScroll();
    this.rafId = requestAnimationFrame(this.tick);
  }

  destroy() {
    if (!this.initialized) return;
    window.removeEventListener("scroll", this.onScroll);
    window.removeEventListener("resize", this.onScroll);
    cancelAnimationFrame(this.rafId);
    this.initialized = false;
  }

  subscribe(listener: ScrollListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  seek(progress: number) {
    const max = this.getMaxScroll();
    const clamped = Math.max(0, Math.min(1, progress));
    window.scrollTo({ top: clamped * max, behavior: this.reducedMotion ? "auto" : "smooth" });
  }

  getMaxScroll() {
    if (typeof window === "undefined") return 1;
    return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }

  private onScroll = () => {
    const max = this.getMaxScroll();
    this.target = window.scrollY / max;
  };

  private tick = () => {
    const damping = this.reducedMotion ? 0.22 : 0.085;
    this.current += (this.target - this.current) * damping;
    this.progress = Math.max(0, Math.min(1, this.current));
    this.velocity = this.target - this.lastTarget;
    this.lastTarget = this.target;

    for (const listener of this.listeners) {
      listener(this.progress, this.velocity);
    }

    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("--scroll-progress", String(this.progress));
    }

    this.rafId = requestAnimationFrame(this.tick);
  };
}

export const scrollEngine = new ScrollEngine();

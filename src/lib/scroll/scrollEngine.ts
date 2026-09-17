import { SCROLL_LOCK_PROGRESS } from "@/lib/scroll/timeline";

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
  private inputLocked = true;

  private lastTouchY = 0;

  setInputLocked(locked: boolean) {
    this.inputLocked = locked;
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("scroll-locked", locked);
    if (locked) {
      this.snapToStart();
    }
  }

  private snapToStart() {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "auto" });
    this.target = 0;
    this.current = 0;
    this.progress = 0;
  }

  init() {
    if (this.initialized || typeof window === "undefined") return;
    this.initialized = true;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.addEventListener("scroll", this.onScroll, { passive: true });
    window.addEventListener("resize", this.onScroll, { passive: true });
    window.addEventListener("wheel", this.onWheel, { passive: false });
    window.addEventListener("touchstart", this.onTouchStart, { passive: true });
    window.addEventListener("touchmove", this.onTouchMove, { passive: false });
    window.addEventListener("keydown", this.onKeyDown);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("scroll-locked", this.inputLocked);
    }
    this.onScroll();
    this.rafId = requestAnimationFrame(this.tick);
  }

  destroy() {
    if (!this.initialized) return;
    window.removeEventListener("scroll", this.onScroll);
    window.removeEventListener("resize", this.onScroll);
    window.removeEventListener("wheel", this.onWheel);
    window.removeEventListener("touchstart", this.onTouchStart);
    window.removeEventListener("touchmove", this.onTouchMove);
    window.removeEventListener("keydown", this.onKeyDown);
    cancelAnimationFrame(this.rafId);
    this.initialized = false;
  }

  subscribe(listener: ScrollListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  seek(progress: number) {
    if (this.inputLocked) return;
    const max = this.getMaxScroll();
    const clamped = Math.max(0, Math.min(SCROLL_LOCK_PROGRESS, progress));
    window.scrollTo({
      top: (clamped / SCROLL_LOCK_PROGRESS) * max,
      behavior: this.reducedMotion ? "auto" : "smooth",
    });
  }

  getMaxScroll() {
    if (typeof window === "undefined") return 1;
    return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }

  private clampScroll() {
    const max = this.getMaxScroll();
    if (window.scrollY > max + 1) {
      window.scrollTo({ top: max, behavior: "auto" });
    }
  }

  private onScroll = () => {
    if (this.inputLocked) {
      this.snapToStart();
      return;
    }
    const max = this.getMaxScroll();
    this.target = Math.max(
      0,
      Math.min(SCROLL_LOCK_PROGRESS, (window.scrollY / max) * SCROLL_LOCK_PROGRESS)
    );
    this.clampScroll();
  };

  private onWheel = (e: WheelEvent) => {
    if (this.inputLocked) {
      e.preventDefault();
      this.snapToStart();
      return;
    }
    const max = this.getMaxScroll();
    const atBottom = window.scrollY >= max - 2;
    if (atBottom && e.deltaY > 0) {
      e.preventDefault();
      window.scrollTo({ top: max, behavior: "auto" });
    }
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (!this.inputLocked) return;
    const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "PageUp", "PageDown", "Home", "End", " ", "Spacebar"];
    if (keys.includes(e.key)) {
      e.preventDefault();
      this.snapToStart();
    }
  };

  private onTouchStart = (e: TouchEvent) => {
    this.lastTouchY = e.touches[0]?.clientY ?? 0;
  };

  private onTouchMove = (e: TouchEvent) => {
    if (this.inputLocked) {
      e.preventDefault();
      this.snapToStart();
      return;
    }
    const max = this.getMaxScroll();
    const atBottom = window.scrollY >= max - 2;
    const y = e.touches[0]?.clientY ?? this.lastTouchY;
    if (atBottom && y < this.lastTouchY) {
      e.preventDefault();
      window.scrollTo({ top: max, behavior: "auto" });
    }
    this.lastTouchY = y;
  };

  private tick = () => {
    const damping = this.reducedMotion ? 0.28 : 0.14;
    this.current += (this.target - this.current) * damping;
    this.progress = Math.max(0, Math.min(SCROLL_LOCK_PROGRESS, this.current));
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

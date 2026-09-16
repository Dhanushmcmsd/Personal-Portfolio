"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
  type PanInfo,
} from "framer-motion";
import { PORTFOLIO_CONFIG } from "@/config/portfolio";
import { scrollEngine } from "@/lib/scroll/scrollEngine";
import { sectionLocalProgress, smootherstep, SECTION } from "@/lib/scroll/timeline";

const CARD_GAP = 16;

type JobCard = (typeof PORTFOLIO_CONFIG.experience)[number] & { kind: "job" };
type EduCard = (typeof PORTFOLIO_CONFIG.education)[number] & { kind: "edu" };
type CarouselCard = JobCard | EduCard;

type LoopedCard = CarouselCard & { sourceIndex: number };

function padIndex(n: number) {
  return String(n + 1).padStart(2, "0");
}

function computeCardWidth(containerWidth: number) {
  if (containerWidth <= 0) return 360;
  const visible = containerWidth < 640 ? 1.02 : containerWidth < 1100 ? 1.85 : 2.7;
  return Math.max(280, Math.min(420, Math.floor((containerWidth - CARD_GAP * (visible - 1)) / visible)));
}

function loopSegmentWidth(cardCount: number, cardWidth: number) {
  return cardCount * cardWidth + Math.max(0, cardCount - 1) * CARD_GAP;
}

function wrapDragX(x: number, segment: number) {
  if (segment <= 0) return x;
  if (x > -segment * 0.5) return x - segment;
  if (x < -segment * 2.5) return x + segment;
  return x;
}

type ExperienceCardProps = {
  card: LoopedCard;
  index: number;
  cardWidth: number;
  dragX: MotionValue<number>;
  dragTilt: MotionValue<number>;
  dragDepth: MotionValue<number>;
  dragZoom: MotionValue<number>;
  containerWidth: number;
  enterProgress: number;
};

function ExperienceCard({
  card,
  index,
  cardWidth,
  dragX,
  dragTilt,
  dragDepth,
  dragZoom,
  containerWidth,
  enterProgress,
}: ExperienceCardProps) {
  const stagger = Math.min(1, Math.max(0, enterProgress - card.sourceIndex * 0.08) / 0.35);
  const enterY = (1 - stagger) * 48;
  const enterScale = 0.9 + stagger * 0.1;
  const cardStep = cardWidth + CARD_GAP;

  const cardLeft = index * cardStep;
  const cardTransform = useTransform(
    [dragX, dragTilt, dragDepth, dragZoom],
    ([x, tilt, depth, zoom]) => {
      const cardCenter = cardLeft + cardWidth * 0.5 + (x as number);
      const viewCenter = containerWidth * 0.5;
      const norm = containerWidth > 0 ? (cardCenter - viewCenter) / (containerWidth * 0.5) : 0;
      const clamped = Math.max(-1.2, Math.min(1.2, norm));
      const centerWeight = 1 - Math.min(1, Math.abs(clamped));
      const rotateY = clamped * -38 + (tilt as number) * 1.25;
      const depthPush = Math.abs(clamped) * 100 + (depth as number) * 65;
      const translateZ = -depthPush + Math.abs(tilt as number) * 2.8 + centerWeight * 24;
      const scale =
        (0.84 + centerWeight * 0.14 - Math.abs(clamped) * 0.11) * enterScale * (zoom as number);
      const skewX = (tilt as number) * 0.1;
      const rotateX = (tilt as number) * -0.12 - clamped * 2.2;
      return `translate3d(0, ${enterY}px, ${translateZ}px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) skewX(${skewX}deg) scale(${scale})`;
    }
  );

  return (
    <article
      className={`experience-card ${card.kind === "edu" ? "experience-card--edu" : ""}`}
      style={{
        width: cardWidth,
        minWidth: cardWidth,
        opacity: stagger,
      }}
    >
      <motion.div className="experience-card__inner" style={{ transform: cardTransform }}>
        <span className="experience-card__index">{padIndex(card.sourceIndex)}</span>

        {card.kind === "job" ? (
          <>
            <p className="experience-card__meta">{card.period}</p>
            <h3 className="experience-card__title">{card.role}</h3>
            <p className="experience-card__subtitle">{card.company}</p>
            <ul className="experience-card__body">
              {card.highlights.slice(0, 3).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <p className="experience-card__meta">{card.period}</p>
            <h3 className="experience-card__title">{card.degree}</h3>
            <p className="experience-card__subtitle">{card.school}</p>
            {card.gpa ? <p className="experience-card__gpa">{card.gpa}</p> : null}
          </>
        )}

        <span className="experience-card__corner experience-card__corner--tl" aria-hidden="true" />
        <span className="experience-card__corner experience-card__corner--br" aria-hidden="true" />
      </motion.div>
    </article>
  );
}

export default function ExperienceCarousel() {
  const [enterProgress, setEnterProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [cardWidth, setCardWidth] = useState(360);
  const dragX = useMotionValue(0);
  const dragTilt = useMotionValue(0);
  const dragDepth = useMotionValue(0);
  const dragZoom = useMotionValue(1);

  const baseCards = useMemo<CarouselCard[]>(
    () => [
      ...PORTFOLIO_CONFIG.experience.map((job) => ({ ...job, kind: "job" as const })),
      ...PORTFOLIO_CONFIG.education.map((edu) => ({ ...edu, kind: "edu" as const })),
    ],
    []
  );

  const loopSegment = loopSegmentWidth(baseCards.length, cardWidth);
  const cardStep = cardWidth + CARD_GAP;

  const loopedCards = useMemo<LoopedCard[]>(
    () =>
      Array.from({ length: 3 }, () =>
        baseCards.map((card, sourceIndex) => ({ ...card, sourceIndex }))
      ).flat(),
    [baseCards]
  );

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const width = container.clientWidth;
    setContainerWidth(width);
    setCardWidth(computeCardWidth(width));
  }, []);

  useEffect(() => {
    if (loopSegment <= 0 || baseCards.length === 0) return;
    dragX.set(-baseCards.length * cardStep);
  }, [baseCards.length, cardStep, dragX, loopSegment]);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, loopedCards.length]);

  useEffect(() => {
    if (enterProgress <= 0.02) return;
    const id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
  }, [enterProgress, measure]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(container);
    return () => observer.disconnect();
  }, [measure]);

  useEffect(() => {
    scrollEngine.init();
    const unsub = scrollEngine.subscribe((p) => {
      const expLocal = sectionLocalProgress(p, SECTION.experience[0], SECTION.experience[1]);
      const expScrollAway = smootherstep(0.5, 0.96, expLocal);
      const expExitFade = 1 - expScrollAway;
      const rowEnter = smootherstep(0.04, 0.55, expLocal) * expExitFade;
      setEnterProgress(rowEnter);
    });
    return () => {
      unsub();
    };
  }, []);

  const applyLoopWrap = useCallback(() => {
    const wrapped = wrapDragX(dragX.get(), loopSegment);
    if (wrapped !== dragX.get()) dragX.set(wrapped);
  }, [dragX, loopSegment]);

  const stopVerticalScroll = useCallback((event: React.PointerEvent | React.TouchEvent) => {
    event.stopPropagation();
  }, []);

  const onDrag = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const v = Math.abs(info.velocity.x);
      const tilt = Math.max(-20, Math.min(20, info.velocity.x * 0.022));
      dragTilt.set(tilt);
      dragDepth.set(Math.min(1, v * 0.0005));
      dragZoom.set(1 + Math.min(0.12, v * 0.00009));
      applyLoopWrap();
    },
    [applyLoopWrap, dragDepth, dragTilt, dragZoom]
  );

  const onDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const velocity = info.velocity.x;
      let current = dragX.get();
      current = wrapDragX(current + velocity * 0.22, loopSegment);

      animate(dragX, current, {
        type: "spring",
        stiffness: 280,
        damping: 32,
        mass: 0.8,
        velocity,
        onComplete: applyLoopWrap,
      });

      animate(dragTilt, 0, {
        type: "spring",
        stiffness: 260,
        damping: 28,
        velocity: velocity * 0.012,
      });

      animate(dragDepth, 0, {
        type: "spring",
        stiffness: 220,
        damping: 26,
        velocity: Math.abs(velocity) * 0.00035,
      });

      animate(dragZoom, 1, {
        type: "spring",
        stiffness: 240,
        damping: 28,
        velocity: Math.abs(velocity) * 0.00006,
      });
    },
    [applyLoopWrap, dragDepth, dragTilt, dragX, dragZoom, loopSegment]
  );

  return (
    <div
      className="experience-carousel"
      style={{ "--exp-enter": enterProgress } as React.CSSProperties}
    >
      <h2 className="experience-carousel__heading">Experience</h2>
      <p className="experience-carousel__hint">drag to explore →</p>

      <div
        ref={containerRef}
        className="experience-carousel__viewport"
        onPointerDown={stopVerticalScroll}
        onTouchStart={stopVerticalScroll}
        onWheel={(event) => event.stopPropagation()}
      >
        <motion.div
          ref={trackRef}
          className="experience-carousel__track"
          drag="x"
          dragElastic={0.12}
          dragMomentum
          style={{ x: dragX, touchAction: "pan-x" }}
          onDrag={onDrag}
          onDragEnd={onDragEnd}
        >
          {loopedCards.map((card, i) => (
            <ExperienceCard
              key={`${card.kind}-${card.sourceIndex}-${i}`}
              card={card}
              index={i}
              cardWidth={cardWidth}
              dragX={dragX}
              dragTilt={dragTilt}
              dragDepth={dragDepth}
              dragZoom={dragZoom}
              containerWidth={containerWidth}
              enterProgress={enterProgress}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}

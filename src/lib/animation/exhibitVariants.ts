export const ANIMATION_CYCLE_MS = 3000;

export type ExhibitAnimationMode =
  | "float"
  | "orbit"
  | "slideBehind"
  | "tiltReveal"
  | "depthPulse";

const MODES: ExhibitAnimationMode[] = [
  "float",
  "orbit",
  "slideBehind",
  "tiltReveal",
  "depthPulse",
];

export function getAnimationMode(timeMs: number): ExhibitAnimationMode {
  const index = Math.floor(timeMs / ANIMATION_CYCLE_MS) % MODES.length;
  return MODES[index];
}

export function getModeBlend(timeMs: number) {
  const cycle = (timeMs % ANIMATION_CYCLE_MS) / ANIMATION_CYCLE_MS;
  const fade = 0.12;
  if (cycle < fade) return cycle / fade;
  if (cycle > 1 - fade) return (1 - cycle) / fade;
  return 1;
}

export interface ExhibitTransform {
  x: number;
  y: number;
  z: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  scale: number;
  textDepth: number;
}

export function computeExhibitTransform(
  mode: ExhibitAnimationMode,
  t: number,
  visibility: number,
  side: -1 | 1
): ExhibitTransform {
  const base: ExhibitTransform = {
    x: 0,
    y: 0,
    z: 0,
    rotX: 0,
    rotY: side * -0.08,
    rotZ: 0,
    scale: 1,
    textDepth: 0,
  };

  switch (mode) {
    case "float":
      return {
        ...base,
        y: Math.sin(t * 1.8) * 0.22,
        x: Math.cos(t * 1.2) * 0.12 * side,
        rotY: base.rotY + Math.sin(t * 0.9) * 0.12,
        textDepth: Math.sin(t * 2) * 0.15,
      };
    case "orbit":
      return {
        ...base,
        x: Math.sin(t * 1.4) * 0.55 * side,
        z: Math.cos(t * 1.4) * 0.35,
        rotY: base.rotY + t * 0.35 * side,
        rotX: Math.sin(t * 0.8) * 0.08,
        textDepth: Math.cos(t * 1.6) * 0.25,
      };
    case "slideBehind":
      return {
        ...base,
        x: side * (0.35 + Math.sin(t * 2.2) * 0.45),
        z: -0.8 + Math.sin(t * 1.5) * 0.5,
        rotY: side * (0.35 + Math.sin(t * 1.1) * 0.2),
        scale: 0.92 + visibility * 0.08,
        textDepth: -0.35 + Math.sin(t * 2.5) * 0.2,
      };
    case "tiltReveal":
      return {
        ...base,
        rotX: -0.18 + Math.sin(t * 1.3) * 0.1,
        rotY: side * (-0.22 + Math.sin(t * 0.7) * 0.15),
        y: Math.sin(t * 2) * 0.14,
        z: Math.sin(t * 1.8) * 0.3,
        textDepth: 0.2 + Math.sin(t * 3) * 0.15,
      };
    case "depthPulse":
      return {
        ...base,
        z: Math.sin(t * 2.4) * 0.65,
        scale: 0.94 + Math.sin(t * 3) * 0.08,
        rotZ: Math.sin(t * 1.5) * 0.06 * side,
        textDepth: Math.sin(t * 2.8) * 0.35,
      };
    default:
      return base;
  }
}

export function computeOverlayDepth(
  mode: ExhibitAnimationMode,
  t: number,
  visibility: number
) {
  const transform = computeExhibitTransform(mode, t, visibility, 1);
  return {
    translateZ: transform.textDepth * 120,
    scale: 1 + transform.textDepth * 0.08,
    blur: Math.max(0, -transform.textDepth * 6),
    opacity: visibility,
  };
}

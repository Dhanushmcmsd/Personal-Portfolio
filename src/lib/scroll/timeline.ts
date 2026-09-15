import * as THREE from "three";

export const SCROLL_HEIGHT_VH = 1150;

export const TIMELINE = {
  intro: 0,
  hero: 0.05,
  transition: 0.08,
  vigilance: 0.1,
  hsn: 0.22,
  finance: 0.34,
  python: 0.46,
  experience: 0.58,
  about: 0.72,
  contact: 0.88,
  end: 1,
} as const;

export const SECTION = {
  hero: [0, 0.08] as const,
  vigilance: [0.08, 0.2] as const,
  hsn: [0.2, 0.32] as const,
  finance: [0.32, 0.44] as const,
  python: [0.44, 0.56] as const,
  experience: [0.56, 0.68] as const,
  about: [0.72, 0.84] as const,
  contact: [0.88, 1] as const,
};

export const NAV_TARGETS: Record<string, number> = {
  work: TIMELINE.vigilance,
  about: TIMELINE.about,
  experience: TIMELINE.experience,
  contact: TIMELINE.contact,
};

export interface CameraKeyframe {
  t: number;
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  fov: number;
}

export const CAMERA_KEYFRAMES: CameraKeyframe[] = [
  { t: 0, position: new THREE.Vector3(0, 1.5, 15), lookAt: new THREE.Vector3(0, 0.4, 0), fov: 52 },
  { t: 0.06, position: new THREE.Vector3(0.1, 1.1, 9), lookAt: new THREE.Vector3(0, 0.2, -5), fov: 48 },
  { t: 0.12, position: new THREE.Vector3(0.3, 0.75, 0), lookAt: new THREE.Vector3(0, 0.1, -12), fov: 44 },
  { t: 0.18, position: new THREE.Vector3(0, 0.5, -10), lookAt: new THREE.Vector3(0, 0.06, -18), fov: 42 },
  { t: 0.24, position: new THREE.Vector3(-0.4, 0.45, -20), lookAt: new THREE.Vector3(0.1, 0.06, -30), fov: 40 },
  { t: 0.3, position: new THREE.Vector3(0.3, 0.42, -28), lookAt: new THREE.Vector3(-0.1, 0.05, -38), fov: 38 },
  { t: 0.38, position: new THREE.Vector3(0.5, 0.48, -36), lookAt: new THREE.Vector3(-0.1, 0.06, -46), fov: 38 },
  { t: 0.44, position: new THREE.Vector3(-0.2, 0.4, -44), lookAt: new THREE.Vector3(0, 0.04, -54), fov: 36 },
  { t: 0.52, position: new THREE.Vector3(-0.5, 0.46, -52), lookAt: new THREE.Vector3(0.15, 0.06, -62), fov: 36 },
  { t: 0.58, position: new THREE.Vector3(0, 0.75, -62), lookAt: new THREE.Vector3(0, 0.15, -72), fov: 38 },
  { t: 0.72, position: new THREE.Vector3(0.2, 0.55, -72), lookAt: new THREE.Vector3(-0.1, 0.1, -82), fov: 36 },
  { t: 0.84, position: new THREE.Vector3(0.1, 0.45, -78), lookAt: new THREE.Vector3(0, 0.05, -86), fov: 34 },
  { t: 0.92, position: new THREE.Vector3(0, 0.35, -82), lookAt: new THREE.Vector3(0, 0, -90), fov: 32 },
  { t: 1, position: new THREE.Vector3(0, 0.28, -84), lookAt: new THREE.Vector3(0, -0.05, -92), fov: 30 },
];

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function smootherstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function rangeProgress(progress: number, start: number, end: number) {
  return smoothstep(start, end, progress);
}

export function inverseRangeProgress(progress: number, start: number, end: number) {
  return 1 - smoothstep(start, end, progress);
}

export function exclusiveOpacity(
  progress: number,
  start: number,
  end: number,
  fade = 0.025
) {
  return (
    smootherstep(start, start + fade, progress) *
    (1 - smootherstep(end - fade, end, progress))
  );
}

export function sectionLocalProgress(progress: number, start: number, end: number) {
  return clamp01((progress - start) / (end - start || 1));
}

export function interpolateCamera(progress: number) {
  const p = clamp01(progress);
  let a = CAMERA_KEYFRAMES[0];
  let b = CAMERA_KEYFRAMES[CAMERA_KEYFRAMES.length - 1];

  for (let i = 0; i < CAMERA_KEYFRAMES.length - 1; i++) {
    if (p >= CAMERA_KEYFRAMES[i].t && p <= CAMERA_KEYFRAMES[i + 1].t) {
      a = CAMERA_KEYFRAMES[i];
      b = CAMERA_KEYFRAMES[i + 1];
      break;
    }
  }

  const localT = clamp01((p - a.t) / (b.t - a.t || 1));
  const eased =
    localT < 0.5 ? 4 * localT ** 3 : 1 - (-2 * localT + 2) ** 3 / 2;

  return {
    position: new THREE.Vector3().lerpVectors(a.position, b.position, eased),
    lookAt: new THREE.Vector3().lerpVectors(a.lookAt, b.lookAt, eased),
    fov: lerp(a.fov, b.fov, eased),
  };
}

export function getGlitchIntensity(progress: number) {
  const windows = [
    [0.18, 0.21],
    [0.3, 0.33],
    [0.42, 0.45],
    [0.54, 0.57],
  ];

  let intensity = 0;
  for (const [start, end] of windows) {
    const mid = (start + end) / 2;
    const width = (end - start) / 2;
    const dist = Math.abs(progress - mid) / width;
    if (dist < 1) {
      intensity = Math.max(intensity, (1 - dist) * 0.7);
    }
  }
  return intensity;
}

export function computeScrollExhibitTransform(
  local: number,
  side: -1 | 1,
  visibility: number
) {
  const enter = smootherstep(0, 0.35, local);
  const exit = 1 - smootherstep(0.65, 1, local);
  const life = enter * exit * visibility;

  return {
    x: side * (1 - enter) * 1.8 + Math.sin(local * Math.PI) * side * 0.25,
    y: (1 - enter) * 0.6 + Math.sin(local * Math.PI * 2) * 0.08 * life,
    z: -0.4 + enter * 0.9 - (1 - exit) * 0.6,
    rotX: (1 - enter) * -0.35 + exit * 0.15,
    rotY: side * (-0.25 + enter * 0.18 - (1 - exit) * 0.12),
    rotZ: side * (1 - enter) * 0.06,
    scale: 0.72 + life * 0.28,
    depth: Math.sin(local * Math.PI) * 0.35,
  };
}

export function computeScrollOverlayTransform(local: number, side: -1 | 1, visibility: number) {
  const enter = smootherstep(0, 0.4, local);
  const exit = 1 - smootherstep(0.6, 1, local);
  const life = enter * exit * visibility;

  return {
    x: side * (1 - enter) * 60,
    y: (1 - enter) * 40,
    z: Math.sin(local * Math.PI) * 80,
    scale: 0.94 + life * 0.06,
    opacity: life,
  };
}

/** 0 = green glitch city, 1 = white fade at experience and beyond */
export function getCityWhiteBlend(progress: number) {
  return rangeProgress(progress, SECTION.experience[0], SECTION.about[0] + 0.06);
}

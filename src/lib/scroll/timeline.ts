import * as THREE from "three";

export const SCROLL_HEIGHT_VH = 900;

export const TIMELINE = {
  intro: 0,
  hero: 0.1,
  transition: 0.22,
  vigilance: 0.3,
  hsn: 0.46,
  finance: 0.62,
  experience: 0.74,
  about: 0.85,
  contact: 0.95,
  end: 1,
} as const;

export type TimelineKey = keyof typeof TIMELINE;

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
  {
    t: 0,
    position: new THREE.Vector3(0, 0.2, 14),
    lookAt: new THREE.Vector3(0, 0, 0),
    fov: 50,
  },
  {
    t: 0.1,
    position: new THREE.Vector3(0, 0.4, 10),
    lookAt: new THREE.Vector3(0, -0.2, -4),
    fov: 48,
  },
  {
    t: 0.22,
    position: new THREE.Vector3(-0.5, 0.3, 4),
    lookAt: new THREE.Vector3(0, 0, -8),
    fov: 46,
  },
  {
    t: 0.3,
    position: new THREE.Vector3(0.8, 0.2, -2),
    lookAt: new THREE.Vector3(0, 0, -14),
    fov: 44,
  },
  {
    t: 0.38,
    position: new THREE.Vector3(-0.3, 0.1, -8),
    lookAt: new THREE.Vector3(0, 0, -16),
    fov: 42,
  },
  {
    t: 0.46,
    position: new THREE.Vector3(1.2, 0.3, -18),
    lookAt: new THREE.Vector3(0, 0, -26),
    fov: 42,
  },
  {
    t: 0.54,
    position: new THREE.Vector3(-0.8, 0.2, -24),
    lookAt: new THREE.Vector3(0, 0, -32),
    fov: 40,
  },
  {
    t: 0.62,
    position: new THREE.Vector3(0.5, 0.4, -34),
    lookAt: new THREE.Vector3(0, 0, -42),
    fov: 40,
  },
  {
    t: 0.68,
    position: new THREE.Vector3(-0.4, 0.2, -40),
    lookAt: new THREE.Vector3(0, 0, -48),
    fov: 38,
  },
  {
    t: 0.74,
    position: new THREE.Vector3(0, 0.5, -50),
    lookAt: new THREE.Vector3(0, 0, -58),
    fov: 38,
  },
  {
    t: 0.8,
    position: new THREE.Vector3(0, 0.3, -56),
    lookAt: new THREE.Vector3(0, 0, -64),
    fov: 36,
  },
  {
    t: 0.85,
    position: new THREE.Vector3(0, 0.2, -62),
    lookAt: new THREE.Vector3(0, -0.2, -70),
    fov: 36,
  },
  {
    t: 0.92,
    position: new THREE.Vector3(0, 0.1, -66),
    lookAt: new THREE.Vector3(0, -0.3, -74),
    fov: 34,
  },
  {
    t: 0.95,
    position: new THREE.Vector3(0, 0, -70),
    lookAt: new THREE.Vector3(0, -0.4, -78),
    fov: 34,
  },
  {
    t: 1,
    position: new THREE.Vector3(0, 0, -72),
    lookAt: new THREE.Vector3(0, -0.5, -80),
    fov: 32,
  },
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

export function rangeProgress(progress: number, start: number, end: number) {
  return smoothstep(start, end, progress);
}

export function inverseRangeProgress(progress: number, start: number, end: number) {
  return 1 - smoothstep(start, end, progress);
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
  const eased = localT < 0.5 ? 4 * localT ** 3 : 1 - (-2 * localT + 2) ** 3 / 2;

  return {
    position: new THREE.Vector3().lerpVectors(a.position, b.position, eased),
    lookAt: new THREE.Vector3().lerpVectors(a.lookAt, b.lookAt, eased),
    fov: lerp(a.fov, b.fov, eased),
  };
}

export function getGlitchIntensity(progress: number) {
  const windows = [
    [0.42, 0.46],
    [0.58, 0.62],
    [0.72, 0.76],
  ];

  let intensity = 0;
  for (const [start, end] of windows) {
    const mid = (start + end) / 2;
    const width = (end - start) / 2;
    const dist = Math.abs(progress - mid) / width;
    if (dist < 1) {
      intensity = Math.max(intensity, (1 - dist) * 0.85);
    }
  }
  return intensity;
}

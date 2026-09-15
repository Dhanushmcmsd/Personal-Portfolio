import * as THREE from "three";

export const SCROLL_HEIGHT_VH = 920;

export const TIMELINE = {
  intro: 0,
  hero: 0.06,
  transition: 0.1,
  vigilance: 0.14,
  hsn: 0.28,
  finance: 0.42,
  python: 0.56,
  experience: 0.68,
  about: 0.8,
  contact: 0.92,
  end: 1,
} as const;

export const SECTION = {
  hero: [0, 0.1] as const,
  vigilance: [0.1, 0.24] as const,
  hsn: [0.24, 0.38] as const,
  finance: [0.38, 0.52] as const,
  python: [0.52, 0.64] as const,
  experience: [0.64, 0.76] as const,
  about: [0.76, 0.9] as const,
  contact: [0.9, 1] as const,
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
  {
    t: 0,
    position: new THREE.Vector3(0, 1.6, 16),
    lookAt: new THREE.Vector3(0, 0.5, 0),
    fov: 54,
  },
  {
    t: 0.06,
    position: new THREE.Vector3(0.15, 1.2, 10),
    lookAt: new THREE.Vector3(0, 0.25, -4),
    fov: 50,
  },
  {
    t: 0.12,
    position: new THREE.Vector3(0.4, 0.85, 2),
    lookAt: new THREE.Vector3(0, 0.15, -10),
    fov: 46,
  },
  {
    t: 0.18,
    position: new THREE.Vector3(0.1, 0.55, -8),
    lookAt: new THREE.Vector3(0, 0.08, -16),
    fov: 42,
  },
  {
    t: 0.26,
    position: new THREE.Vector3(-0.45, 0.5, -18),
    lookAt: new THREE.Vector3(0.15, 0.08, -28),
    fov: 40,
  },
  {
    t: 0.32,
    position: new THREE.Vector3(0.35, 0.45, -26),
    lookAt: new THREE.Vector3(-0.1, 0.06, -36),
    fov: 38,
  },
  {
    t: 0.4,
    position: new THREE.Vector3(0.55, 0.52, -34),
    lookAt: new THREE.Vector3(-0.15, 0.08, -44),
    fov: 38,
  },
  {
    t: 0.46,
    position: new THREE.Vector3(-0.25, 0.42, -42),
    lookAt: new THREE.Vector3(0.05, 0.05, -52),
    fov: 36,
  },
  {
    t: 0.54,
    position: new THREE.Vector3(-0.55, 0.48, -50),
    lookAt: new THREE.Vector3(0.2, 0.08, -60),
    fov: 36,
  },
  {
    t: 0.6,
    position: new THREE.Vector3(0.15, 0.42, -58),
    lookAt: new THREE.Vector3(0, 0.05, -68),
    fov: 34,
  },
  {
    t: 0.68,
    position: new THREE.Vector3(0, 0.85, -68),
    lookAt: new THREE.Vector3(0, 0.18, -78),
    fov: 38,
  },
  {
    t: 0.8,
    position: new THREE.Vector3(0.35, 0.62, -78),
    lookAt: new THREE.Vector3(-0.15, 0.12, -88),
    fov: 36,
  },
  {
    t: 0.92,
    position: new THREE.Vector3(0, 0.38, -88),
    lookAt: new THREE.Vector3(0, 0.02, -98),
    fov: 34,
  },
  {
    t: 1,
    position: new THREE.Vector3(0, 0.32, -92),
    lookAt: new THREE.Vector3(0, -0.08, -102),
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

export function exclusiveOpacity(
  progress: number,
  start: number,
  end: number,
  fade = 0.035
) {
  return (
    rangeProgress(progress, start, start + fade) *
    inverseRangeProgress(progress, end - fade, end)
  );
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
    [0.22, 0.25],
    [0.36, 0.39],
    [0.5, 0.53],
    [0.62, 0.65],
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

export function getActiveProjectIndex(progress: number, count: number) {
  const projectStarts = [
    TIMELINE.vigilance,
    TIMELINE.hsn,
    TIMELINE.finance,
    TIMELINE.python,
  ].slice(0, count);

  let active = 0;
  for (let i = projectStarts.length - 1; i >= 0; i--) {
    if (progress >= projectStarts[i] - 0.02) {
      active = i;
      break;
    }
  }
  return active;
}

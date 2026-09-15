function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export interface VirusPathPoint {
  x: number;
  y: number;
  z: number;
  rotY: number;
  rotZ: number;
}

const CYCLE = 16;

export function computeVirusPath(elapsed: number): VirusPathPoint {
  const u = (elapsed % CYCLE) / CYCLE;

  if (u < 0.14) {
    const t = smooth(u / 0.14);
    return {
      x: lerp(-3.2, 3.2, t),
      y: 1.85,
      z: -4.2,
      rotY: t * Math.PI * 0.35,
      rotZ: 0,
    };
  }

  if (u < 0.26) {
    const t = smooth((u - 0.14) / 0.12);
    return {
      x: lerp(3.2, -0.35, t),
      y: lerp(1.85, 1.45, t),
      z: -4.2,
      rotY: lerp(Math.PI * 0.35, -Math.PI * 0.25, t),
      rotZ: Math.sin(t * Math.PI) * 0.08,
    };
  }

  if (u < 0.36) {
    const t = smooth((u - 0.26) / 0.1);
    return {
      x: lerp(-0.35, 0.15, t),
      y: lerp(1.45, 1.05, t),
      z: lerp(-4.2, -2.8, Math.sin(t * Math.PI)),
      rotY: lerp(-Math.PI * 0.25, Math.PI * 0.15, t),
      rotZ: 0.12,
    };
  }

  if (u < 0.46) {
    const t = smooth((u - 0.36) / 0.1);
    return {
      x: lerp(0.15, -3.4, t),
      y: lerp(1.05, 2.4, t),
      z: lerp(-2.8, -6.5, t),
      rotY: lerp(Math.PI * 0.15, Math.PI * 0.6, t),
      rotZ: lerp(0.12, 0, t),
    };
  }

  const t = ((u - 0.46) / 0.54) * Math.PI * 2;
  const a = 1.05;
  const denom = 1 + Math.sin(t) ** 2;
  return {
    x: (a * Math.cos(t)) / denom,
    y: 1.35 + (a * Math.sin(t) * Math.cos(t)) / denom,
    z: -4.1 + Math.sin(t * 2) * 0.15,
    rotY: t * 0.85,
    rotZ: Math.sin(t * 1.5) * 0.06,
  };
}

export function computeVirusCatchBlend(elapsed: number, catching: boolean) {
  if (!catching) return 0;
  return 0.35 + Math.sin(elapsed * 8) * 0.1;
}

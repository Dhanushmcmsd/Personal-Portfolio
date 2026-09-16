let stampCanvas: HTMLCanvasElement | null = null;
let stampCtx: CanvasRenderingContext2D | null = null;

function getStampSurface(width: number, height: number) {
  if (!stampCanvas || stampCanvas.width !== width || stampCanvas.height !== height) {
    stampCanvas = document.createElement("canvas");
    stampCanvas.width = width;
    stampCanvas.height = height;
    stampCtx = stampCanvas.getContext("2d", { alpha: true });
  }
  return { canvas: stampCanvas, ctx: stampCtx! };
}

function splashRadiusAt(angle: number, radius: number, wobble: number) {
  const lump =
    1 +
    Math.sin(angle * 3 + wobble * 1.4) * 0.2 +
    Math.cos(angle * 5 - wobble * 1.1) * 0.14 +
    Math.sin(angle * 7 + wobble * 0.7) * 0.08;
  return radius * lump;
}

export function traceSplashPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  wobble = 0
) {
  const points = 18;
  const stretchX = 1.18;
  const stretchY = 0.92;
  const tilt = wobble * 0.08;

  ctx.beginPath();
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const r = splashRadiusAt(angle, radius, wobble);
    const x = cx + Math.cos(angle + tilt) * r * stretchX;
    const y = cy + Math.sin(angle + tilt) * r * stretchY + Math.sin(wobble * 2.3 + angle * 2) * radius * 0.05;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function fillSplashMask(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  wobble: number,
  innerAlpha: number,
  outerAlpha: number
) {
  traceSplashPath(ctx, cx, cy, radius, wobble);
  const grad = ctx.createRadialGradient(cx, cy, radius * 0.04, cx, cy, radius * 1.35);
  grad.addColorStop(0, `rgba(255,255,255,${innerAlpha})`);
  grad.addColorStop(0.32, `rgba(255,255,255,${innerAlpha * 0.78})`);
  grad.addColorStop(0.58, `rgba(255,255,255,${innerAlpha * 0.38})`);
  grad.addColorStop(0.82, `rgba(255,255,255,${outerAlpha})`);
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fill();
}

export function drawClothTearFrame(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  width: number,
  height: number,
  tearX: number,
  tearY: number,
  progress: number,
  alpha = 1
) {
  const strips = 22;
  const stripH = height / strips;
  const eased = progress * progress * (3 - 2 * progress);

  ctx.save();
  ctx.globalAlpha = alpha * (1 - eased * 0.98);

  for (let i = 0; i < strips; i++) {
    const sy = i * stripH;
    const cy = sy + stripH / 2;
    const distY = (cy - tearY) / height;
    const side = tearX < width * 0.5 ? -1 : 1;
    const fall = eased * (90 + Math.abs(distY) * 140);
    const rot = eased * side * (0.12 + Math.abs(distY) * 0.22);
    const sway = Math.sin(i * 0.65 + eased * 5.5) * eased * 28;
    const driftX = side * eased * (40 + Math.abs(distY) * 60);

    ctx.save();
    ctx.translate(tearX + driftX + sway, cy + fall * 0.85);
    ctx.rotate(rot);
    ctx.drawImage(source, 0, sy, width, stripH + 1, -tearX, -stripH / 2, width, stripH + 1);
    ctx.restore();
  }

  ctx.restore();
}

export function drawFeatheredVideoBlob(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  width: number,
  height: number,
  cx: number,
  cy: number,
  radius: number,
  opacity: number,
  wobble = 0
) {
  const { canvas, ctx: sctx } = getStampSurface(width, height);

  sctx.clearRect(0, 0, width, height);
  sctx.drawImage(source, 0, 0, width, height);
  sctx.globalCompositeOperation = "destination-in";
  fillSplashMask(sctx, cx, cy, radius, wobble, 1, 0.14);
  sctx.globalCompositeOperation = "source-over";

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.drawImage(canvas, 0, 0);
  ctx.restore();
}

export function punchFeatheredHole(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  strength: number,
  wobble = 0
) {
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  fillSplashMask(ctx, cx, cy, radius, wobble, strength, strength * 0.12);
  ctx.restore();
}

export function drawCursorGlow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  opacity: number,
  wobble = 0
) {
  ctx.save();
  ctx.globalAlpha = opacity;

  ctx.filter = "blur(14px)";
  traceSplashPath(ctx, cx, cy, radius * 1.32, wobble + 0.15);
  ctx.fillStyle = "rgba(255, 110, 0, 0.28)";
  ctx.fill();

  ctx.filter = "blur(9px)";
  traceSplashPath(ctx, cx, cy, radius * 1.14, wobble + 0.35);
  ctx.fillStyle = "rgba(255, 165, 0, 0.38)";
  ctx.fill();

  ctx.filter = "blur(5px)";
  traceSplashPath(ctx, cx, cy, radius * 1.02, wobble);
  ctx.fillStyle = "rgba(255, 210, 80, 0.42)";
  ctx.fill();

  ctx.filter = "blur(2px)";
  traceSplashPath(ctx, cx, cy, radius * 0.9, wobble - 0.2);
  ctx.fillStyle = "rgba(255, 235, 160, 0.32)";
  ctx.fill();

  ctx.filter = "none";
  traceSplashPath(ctx, cx, cy, radius * 1.06, wobble + 0.1);
  ctx.strokeStyle = "rgba(255, 215, 0, 0.55)";
  ctx.lineWidth = 2;
  ctx.shadowColor = "rgba(255, 140, 0, 0.75)";
  ctx.shadowBlur = 12;
  ctx.stroke();

  traceSplashPath(ctx, cx, cy, radius * 1.12, wobble + 0.25);
  ctx.strokeStyle = "rgba(255, 120, 0, 0.22)";
  ctx.lineWidth = 4;
  ctx.shadowBlur = 20;
  ctx.shadowColor = "rgba(255, 100, 0, 0.45)";
  ctx.stroke();

  ctx.restore();
}

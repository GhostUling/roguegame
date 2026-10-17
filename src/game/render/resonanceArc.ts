/**
 * Crackling resonance tether linking two vessels. Both endpoints are given in the
 * caller's current transform frame; `time` drives the flicker phase. `trim` pulls
 * each end inward so the bolt only spans the gap between the two hulls.
 */
export function drawResonanceArc(
  ctx: CanvasRenderingContext2D,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  time: number,
  trim: number = 0,
  jitter: () => number = Math.random
): void {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy);
  if (len <= trim * 2 + 2) return;

  const ux = dx / len;
  const uy = dy / len;
  const sx = ax + ux * trim;
  const sy = ay + uy * trim;
  const ex = bx - ux * trim;
  const ey = by - uy * trim;

  const flicker = 0.55 + Math.sin(time * 22) * 0.45;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.shadowColor = '#7dd3fc';
  ctx.shadowBlur = 12;

  ctx.strokeStyle = '#7dd3fc';
  ctx.globalAlpha *= 0.5 + flicker * 0.35;
  ctx.lineWidth = 2.4;
  strokeArcPath(ctx, sx, sy, ex, ey, 7, 4.5 * flicker, jitter);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.1;
  strokeArcPath(ctx, sx, sy, ex, ey, 7, 2.5 * flicker, jitter);
  ctx.restore();
}

function strokeArcPath(
  ctx: CanvasRenderingContext2D,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  segments: number,
  amplitude: number,
  jitter: () => number
): void {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / len;
  const ny = dx / len;

  ctx.beginPath();
  ctx.moveTo(ax, ay);
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const offset = (jitter() - 0.5) * 2 * amplitude;
    ctx.lineTo(ax + dx * t + nx * offset, ay + dy * t + ny * offset);
  }
  ctx.lineTo(bx, by);
  ctx.stroke();
}

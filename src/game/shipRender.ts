import { CharacterId } from './types';
import { getCharacterDef } from './characters';

/**
 * Draws a vessel's geometric silhouette centered on the current transform origin.
 * Shared by the in-game renderer and the hangar preview so both stay in sync.
 * `angle` orients the nose; `time` drives the idle spin animation.
 */
export function drawCharacterShip(
  ctx: CanvasRenderingContext2D,
  charId: CharacterId,
  radius: number,
  angle: number,
  time: number
): void {
  const def = getCharacterDef(charId);
  const lw = radius / 18;

  if (charId === 'alpha_prism') {
    ctx.save();
    ctx.rotate(time * 1.2);
    ctx.strokeStyle = def.color;
    ctx.shadowColor = def.color;
    ctx.shadowBlur = 18;
    ctx.lineWidth = 2.5 * lw;

    ctx.beginPath();
    const points = 8;
    const outerR = radius * 1.35;
    const innerR = radius * 0.95;
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const a = (i * Math.PI) / points;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#0a1922';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5 * lw;
    ctx.shadowColor = def.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
  } else if (charId === 'beta_phalanx') {
    ctx.save();
    ctx.rotate(time * 0.7);
    ctx.strokeStyle = def.color;
    ctx.shadowColor = def.color;
    ctx.shadowBlur = 18;
    ctx.lineWidth = 3.5 * lw;

    ctx.beginPath();
    for (let s = 0; s < 6; s++) {
      const a = (s * 2 * Math.PI) / 6;
      const px = Math.cos(a) * (radius * 1.35);
      const py = Math.sin(a) * (radius * 1.35);
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#170624';
    ctx.strokeStyle = def.accentColor;
    ctx.lineWidth = 2.5 * lw;
    ctx.shadowColor = def.accentColor;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = def.accentColor;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (charId === 'gamma_viper') {
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = '#1e1402';
    ctx.strokeStyle = def.color;
    ctx.shadowColor = def.color;
    ctx.shadowBlur = 18;
    ctx.lineWidth = 2.5 * lw;

    ctx.beginPath();
    ctx.moveTo(radius * 1.5, 0);
    ctx.lineTo(-radius * 1.1, -radius * 1.2);
    ctx.lineTo(-radius * 0.5, 0);
    ctx.lineTo(-radius * 1.1, radius * 1.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = def.accentColor;
    ctx.beginPath();
    ctx.arc(-radius * 0.9, -5 * lw, 3.5 * lw, 0, Math.PI * 2);
    ctx.arc(-radius * 0.9, 5 * lw, 3.5 * lw, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  } else if (charId === 'delta_chronos') {
    ctx.save();
    ctx.rotate(time * 1.4);
    ctx.strokeStyle = def.color;
    ctx.shadowColor = def.color;
    ctx.shadowBlur = 16;
    ctx.lineWidth = 2 * lw;

    ctx.beginPath();
    const points = 12;
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? radius * 1.4 : radius * 0.85;
      const a = (i * Math.PI) / points;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.rotate(-time * 1.8);
    ctx.strokeStyle = def.accentColor;
    ctx.shadowColor = def.accentColor;
    ctx.shadowBlur = 14;
    ctx.lineWidth = 2 * lw;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.75, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 5 * lw, 0, Math.PI * 2);
    ctx.fill();
  } else if (charId === 'epsilon_carrier') {
    ctx.save();
    ctx.rotate(time * 0.9);
    ctx.strokeStyle = def.color;
    ctx.shadowColor = def.color;
    ctx.shadowBlur = 18;
    ctx.lineWidth = 2.8 * lw;

    ctx.beginPath();
    const points = 10;
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? radius * 1.4 : radius * 0.9;
      const a = (i * Math.PI) / points;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.rotate(-time * 1.6);
    ctx.strokeStyle = def.accentColor;
    ctx.shadowColor = def.accentColor;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 2 * lw;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = def.accentColor;
    [-radius * 0.7, radius * 0.7].forEach((xPos) => {
      ctx.beginPath();
      ctx.arc(xPos, 0, 3 * lw, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    ctx.fillStyle = '#022c22';
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2 * lw;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 4 * lw, 0, Math.PI * 2);
    ctx.fill();
  } else if (charId === 'zeta_aurora') {
    ctx.save();
    ctx.rotate(time * 1.3);
    ctx.strokeStyle = def.color;
    ctx.shadowColor = def.color;
    ctx.shadowBlur = 18;
    ctx.lineWidth = 2.5 * lw;

    ctx.beginPath();
    for (let s = 0; s < 6; s++) {
      const a = (s * Math.PI * 2) / 6;
      const ox = Math.cos(a) * (radius * 1.45);
      const oy = Math.sin(a) * (radius * 1.45);
      ctx.moveTo(0, 0);
      ctx.lineTo(ox, oy);

      const bx = Math.cos(a) * (radius * 0.85);
      const by = Math.sin(a) * (radius * 0.85);
      const pa1 = a + Math.PI / 3;
      const pa2 = a - Math.PI / 3;
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(pa1) * 6 * lw, by + Math.sin(pa1) * 6 * lw);
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(pa2) * 6 * lw, by + Math.sin(pa2) * 6 * lw);
    }
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.rotate(-time * 2.0);
    ctx.strokeStyle = def.accentColor;
    ctx.shadowColor = def.accentColor;
    ctx.shadowBlur = 14;
    ctx.lineWidth = 2 * lw;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.65, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#083344';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2 * lw;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 4 * lw, 0, Math.PI * 2);
    ctx.fill();
  }

  if (charId !== 'gamma_viper') {
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(radius * 1.45, 0);
    ctx.lineTo(radius * 0.7, -4 * lw);
    ctx.lineTo(radius * 0.7, 4 * lw);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

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

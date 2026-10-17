import { CharacterDef } from '../core/types';
import { drawNoseCone, strokeUnit } from './shipDraw';

export const deltaChronos: CharacterDef = {
  id: 'delta_chronos',
  name: 'Chronos Delta',
  nameZh: 'δ·星芒',
  title: '时空静滞 / 谐振磁核',
  desc: '外层双逆向旋转的 12 角奇点机体，拥有操控战场时间流速与空间谐振的终极能力。',
  color: '#06b6d4',
  accentColor: '#ec4899',
  baseStats: {
    hp: 95,
    speed: 4.1,
    fireRate: 460, // ms
    bulletDamage: 24,
    bulletCount: 1,
    bulletPierce: 1,
    magnetRadius: 175, // very large pickup
    critChance: 0.15,
    critMultiplier: 2.0,
    orbitSatellites: 1, // starts with 1 resonance prism!
  },
  passive: {
    name: 'Resonant Core',
    nameZh: '共鸣磁核',
    desc: '超强引力磁场范围；每吸取 3 枚经验宝石即可减少主动技能 0.4 秒当前冷却时间。',
  },
  activeSkill: {
    id: 'time_dilation',
    name: 'Time Dilation',
    nameZh: '时空滞凝',
    desc: '释放绝对时滞力场 3.5 秒：全场敌人移速暴降 75%，自身获得高速机动且所有射击必定暴击。',
    cooldown: 15,
    duration: 3.5,
  },
};

/** Twelve-point star, plus a counter-rotating resonance ring. */
export function drawDeltaChronos(
  ctx: CanvasRenderingContext2D,
  radius: number,
  angle: number,
  time: number
): void {
  const lw = strokeUnit(radius);

  ctx.save();
  ctx.rotate(time * 1.4);
  ctx.strokeStyle = deltaChronos.color;
  ctx.shadowColor = deltaChronos.color;
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
  ctx.strokeStyle = deltaChronos.accentColor;
  ctx.shadowColor = deltaChronos.accentColor;
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

  drawNoseCone(ctx, radius, angle);
}

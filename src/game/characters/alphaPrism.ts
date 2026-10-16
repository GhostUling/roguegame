import { CharacterDef } from '../types';
import { drawNoseCone, strokeUnit } from './shipDraw';

export const alphaPrism: CharacterDef = {
  id: 'alpha_prism',
  name: 'Prism Alpha',
  nameZh: 'α·光棱',
  title: '平衡敏捷 / 折射矩阵',
  desc: '装备双重高频折射矩阵的原型机体，能在多变战况中精准穿梭并触发次生光刃。',
  color: '#00ffcc',
  accentColor: '#ffffff',
  baseStats: {
    hp: 100,
    speed: 4.4,
    fireRate: 430, // ms
    bulletDamage: 26,
    bulletCount: 1,
    bulletPierce: 1,
    magnetRadius: 110,
    critChance: 0.12,
    critMultiplier: 2.0,
    orbitSatellites: 0,
  },
  passive: {
    name: 'Refraction Matrix',
    nameZh: '折射矩阵',
    desc: '子弹命中敌人时有 35% 几率向两侧折射出 2 枚微型自动寻敌光刃（伤害为 60% 基础伤害）。',
  },
  activeSkill: {
    id: 'phase_blink',
    name: 'Phase Blink',
    nameZh: '相位跃迁',
    desc: '向机体矢量移动方向瞬移 170 像素并获得 0.6 秒绝对无敌帧，在始末位置爆发环形冲击波击退群敌。',
    cooldown: 8,
  },
};

/** Octagram refraction ring over a white-cored disc. */
export function drawAlphaPrism(
  ctx: CanvasRenderingContext2D,
  radius: number,
  angle: number,
  time: number
): void {
  const lw = strokeUnit(radius);

  ctx.save();
  ctx.rotate(time * 1.2);
  ctx.strokeStyle = alphaPrism.color;
  ctx.shadowColor = alphaPrism.color;
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
  ctx.shadowColor = alphaPrism.color;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.45, 0, Math.PI * 2);
  ctx.fill();

  drawNoseCone(ctx, radius, angle);
}

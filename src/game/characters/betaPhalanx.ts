import { CharacterDef } from '../core/types';
import { drawNoseCone, strokeUnit } from './shipDraw';

export const betaPhalanx: CharacterDef = {
  id: 'beta_phalanx',
  name: 'Phalanx Beta',
  nameZh: 'β·方阵',
  title: '重装度规 / 奇点坍缩',
  desc: '拥有超致密六角能量外骨骼的装甲机体，依靠强大的引力场操控战场局势。',
  color: '#a855f7',
  accentColor: '#38bdf8',
  baseStats: {
    hp: 160,
    speed: 3.7,
    fireRate: 500, // ms
    bulletDamage: 35,
    bulletCount: 1,
    bulletPierce: 2,
    magnetRadius: 100,
    critChance: 0.08,
    critMultiplier: 1.8,
    orbitSatellites: 0,
  },
  passive: {
    name: 'Graviton Plating',
    nameZh: '重力度规',
    desc: '受到敌人碰撞伤害减少 20%，生命自动回复速度翻倍；近身碰撞击退小怪并造成冲击损伤。',
  },
  activeSkill: {
    id: 'singularity_collapse',
    name: 'Singularity Collapse',
    nameZh: '奇点坍缩',
    desc: '在前方制造一个超重力几何黑洞（持续 2.5 秒），强力吸附大范围所有敌群与经验宝石，并在消散时剧烈爆炸。',
    cooldown: 14,
    duration: 2.5,
  },
};

/** Hexagonal armour cage around a heavy core. */
export function drawBetaPhalanx(
  ctx: CanvasRenderingContext2D,
  radius: number,
  angle: number,
  time: number
): void {
  const lw = strokeUnit(radius);

  ctx.save();
  ctx.rotate(time * 0.7);
  ctx.strokeStyle = betaPhalanx.color;
  ctx.shadowColor = betaPhalanx.color;
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
  ctx.strokeStyle = betaPhalanx.accentColor;
  ctx.lineWidth = 2.5 * lw;
  ctx.shadowColor = betaPhalanx.accentColor;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = betaPhalanx.accentColor;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.5, 0, Math.PI * 2);
  ctx.fill();

  drawNoseCone(ctx, radius, angle);
}

import { CharacterDef } from '../core/types';
import { drawNoseCone, strokeUnit } from './shipDraw';

export const zetaAurora: CharacterDef = {
  id: 'zeta_aurora',
  name: 'Aurora Zeta',
  nameZh: 'ζ·极光',
  title: '极地谐振 / 绝对零度',
  desc: '由高维超导寒晶凝聚而成的雪花晶体，将几何动能转化为极度深寒并诱发大范围冰爆碎裂。',
  color: '#00f0ff',
  accentColor: '#e879f9',
  baseStats: {
    hp: 90,
    speed: 4.5,
    fireRate: 400, // ms
    bulletDamage: 25,
    bulletCount: 1,
    bulletPierce: 1,
    magnetRadius: 120,
    critChance: 0.18,
    critMultiplier: 2.2,
    orbitSatellites: 0,
  },
  passive: {
    name: 'Absolute Zero',
    nameZh: '绝对零度',
    desc: '子弹默认自带 1 次墙壁弹射并直接附加冰霜冻结；消灭冰冻敌人会瞬间引发大范围极寒冰爆（对周围造成 140% 溅射伤害）。',
  },
  activeSkill: {
    id: 'aurora_glaciation',
    name: 'Aurora Glaciation',
    nameZh: '极光冰爆',
    desc: '瞬间向 360° 爆散 14 枚极光穿透棱锥，同时强制绝对冻结全场所有敌人 3 秒，冰冻期间自身射击全暴击。',
    cooldown: 12,
    duration: 3.0,
  },
};

/** Six-fold snowflake arms with side barbs, over a pale frost core. */
export function drawZetaAurora(
  ctx: CanvasRenderingContext2D,
  radius: number,
  angle: number,
  time: number
): void {
  const lw = strokeUnit(radius);

  ctx.save();
  ctx.rotate(time * 1.3);
  ctx.strokeStyle = zetaAurora.color;
  ctx.shadowColor = zetaAurora.color;
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
  ctx.strokeStyle = zetaAurora.accentColor;
  ctx.shadowColor = zetaAurora.accentColor;
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

  drawNoseCone(ctx, radius, angle);
}

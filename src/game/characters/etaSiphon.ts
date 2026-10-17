import { CharacterDef } from '../core/types';
import { drawNoseCone, strokeUnit } from './shipDraw';

export const etaSiphon: CharacterDef = {
  id: 'eta_siphon',
  name: 'Siphon Eta',
  nameZh: 'η·血棘',
  title: '生命汲取 / 背水超载',
  desc: '以敌舰残骸为燃料的有机几何体，在包围中越战越强，濒死时反而最致命。',
  color: '#e11d48',
  accentColor: '#fda4af',
  baseStats: {
    hp: 90,
    speed: 4.6,
    fireRate: 420, // ms
    bulletDamage: 22,
    bulletCount: 1,
    bulletPierce: 1,
    magnetRadius: 140,
    critChance: 0.15,
    critMultiplier: 2.1,
    orbitSatellites: 0,
  },
  passive: {
    name: 'Sanguine Lattice',
    nameZh: '噬血晶格',
    desc: '击杀敌人回复 1.5 点生命，溢出的治疗转化为 0.5 秒的 +15% 射速（最多叠加至 3 秒）；生命低于 30% 时，造成的伤害提升 40%。',
  },
  activeSkill: {
    id: 'blood_harvest',
    name: 'Blood Harvest',
    nameZh: '血晶收割',
    desc: '展开血晶力场 3 秒：期间造成伤害的 30% 转化为生命，且每次击杀额外储存 2 点临时护盾。',
    cooldown: 12,
    duration: 3.0,
  },
};

/** Eight barbed thorns over a blood core, wrapped in a counter-rotating lattice. */
export function drawEtaSiphon(
  ctx: CanvasRenderingContext2D,
  radius: number,
  angle: number,
  time: number
): void {
  const lw = strokeUnit(radius);

  ctx.save();
  ctx.rotate(time * 0.8);
  ctx.strokeStyle = etaSiphon.color;
  ctx.shadowColor = etaSiphon.color;
  ctx.shadowBlur = 18;
  ctx.lineWidth = 2.5 * lw;

  ctx.beginPath();
  const points = 8;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? radius * 1.5 : radius * 0.72;
    const a = (i * Math.PI) / points;
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.rotate(-time * 1.6);
  ctx.strokeStyle = etaSiphon.accentColor;
  ctx.shadowColor = etaSiphon.accentColor;
  ctx.shadowBlur = 12;
  ctx.lineWidth = 2 * lw;
  ctx.beginPath();
  for (let s = 0; s < 6; s++) {
    const a = (s * Math.PI) / 3;
    ctx.moveTo(Math.cos(a) * radius * 0.5, Math.sin(a) * radius * 0.5);
    ctx.lineTo(Math.cos(a + 0.4) * radius * 0.88, Math.sin(a + 0.4) * radius * 0.88);
  }
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#2a0410';
  ctx.strokeStyle = etaSiphon.accentColor;
  ctx.lineWidth = 2.5 * lw;
  ctx.shadowColor = etaSiphon.color;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.62, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.26, 0, Math.PI * 2);
  ctx.fill();

  drawNoseCone(ctx, radius, angle);
}

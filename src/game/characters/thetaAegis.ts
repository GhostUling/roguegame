import { CharacterDef } from '../core/types';
import { drawNoseCone, strokeUnit } from './shipDraw';

export const thetaAegis: CharacterDef = {
  id: 'theta_aegis',
  name: 'Aegis Theta',
  nameZh: 'θ·棱铠',
  title: '正面装甲 / 动能反弹',
  desc: '覆盖可动棱面装甲的突击机体，用最原始的动能撕裂敌阵，并把敌方火力原样奉还。',
  color: '#e2e8f0',
  accentColor: '#a3e635',
  baseStats: {
    hp: 115,
    speed: 4.9,
    fireRate: 560, // ms
    bulletDamage: 20,
    bulletCount: 1,
    bulletPierce: 1,
    magnetRadius: 95,
    critChance: 0.12,
    critMultiplier: 1.9,
    orbitSatellites: 0,
  },
  passive: {
    name: 'Kinetic Bulwark',
    nameZh: '动能壁垒',
    desc: '敌方子弹命中机体时有 35% 几率被弹回，反弹弹体伤害 +50% 且转为友方；机体冲撞敌人造成 120% 子弹伤害并强力击退。',
  },
  activeSkill: {
    id: 'inertia_charge',
    name: 'Inertia Charge',
    nameZh: '惯性冲锋',
    desc: '朝朝向以 3 倍速度冲锋 0.8 秒，冲锋期间无敌；撞击的敌人受到 300% 伤害并被击飞，结束时释放一圈震荡波。',
    cooldown: 9,
    duration: 0.8,
  },
};

/** Slow hex pauldron ring around a fixed frontal shield plate. */
export function drawThetaAegis(
  ctx: CanvasRenderingContext2D,
  radius: number,
  angle: number,
  time: number
): void {
  const lw = strokeUnit(radius);

  ctx.save();
  ctx.rotate(time * 0.6);
  ctx.strokeStyle = thetaAegis.color;
  ctx.shadowColor = thetaAegis.color;
  ctx.shadowBlur = 16;
  ctx.lineWidth = 3 * lw;

  ctx.beginPath();
  for (let s = 0; s < 6; s++) {
    const a = (s * Math.PI) / 3 + 0.4;
    const px = Math.cos(a) * radius * 1.4;
    const py = Math.sin(a) * radius * 1.4;
    if (s === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // The shield always faces where the hull is aiming, so it never spins.
  ctx.save();
  ctx.rotate(angle);
  ctx.strokeStyle = thetaAegis.accentColor;
  ctx.shadowColor = thetaAegis.accentColor;
  ctx.shadowBlur = 14;
  ctx.lineWidth = 3 * lw;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.05, -0.75, 0.75);
  ctx.stroke();
  ctx.lineWidth = 2 * lw;
  for (let i = 1; i <= 2; i++) {
    ctx.beginPath();
    ctx.arc(0, 0, radius * (1.05 - i * 0.22), -0.6 + i * 0.12, 0.6 - i * 0.12);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = '#131a1f';
  ctx.strokeStyle = thetaAegis.color;
  ctx.lineWidth = 2.5 * lw;
  ctx.shadowColor = thetaAegis.color;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = thetaAegis.accentColor;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.28, 0, Math.PI * 2);
  ctx.fill();

  drawNoseCone(ctx, radius, angle);
}

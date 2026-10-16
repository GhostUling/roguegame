import { CharacterDef } from '../types';
import { drawNoseCone, strokeUnit } from './shipDraw';

export const epsilonCarrier: CharacterDef = {
  id: 'epsilon_carrier',
  name: 'Carrier Epsilon',
  nameZh: 'ε·枢机',
  title: '机械构装 / 浮游蜂群',
  desc: '搭载自主神经中枢的重装星际母舰，掌控浮游无人机与轨道仆从席卷战场。',
  color: '#10b981',
  accentColor: '#f59e0b',
  baseStats: {
    hp: 110,
    speed: 4.2,
    fireRate: 460, // ms
    bulletDamage: 24,
    bulletCount: 1,
    bulletPierce: 1,
    magnetRadius: 130,
    critChance: 0.1,
    critMultiplier: 2.0,
    orbitSatellites: 0,
  },
  passive: {
    name: 'Construct Hive',
    nameZh: '构装母巢',
    desc: '开局自带 1 架自动化拦截浮游机；全场仆从（无人机与护航棱镜）攻击伤害与射速提升 35%；无人机击中敌人有几率产生纳米自愈。',
  },
  activeSkill: {
    id: 'swarm_overdrive',
    name: 'Swarm Overdrive',
    nameZh: '超频蜂群',
    desc: '启动母舰过载协议 4 秒：空投额外 2 架攻击浮游机，并令全场仆从射速与攻击力暴增 100%，火力齐射覆盖全场。',
    cooldown: 13,
    duration: 4.0,
  },
};

/** Decagram hull with a counter-rotating escort ring and two docked pods. */
export function drawEpsilonCarrier(
  ctx: CanvasRenderingContext2D,
  radius: number,
  angle: number,
  time: number
): void {
  const lw = strokeUnit(radius);

  ctx.save();
  ctx.rotate(time * 0.9);
  ctx.strokeStyle = epsilonCarrier.color;
  ctx.shadowColor = epsilonCarrier.color;
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
  ctx.strokeStyle = epsilonCarrier.accentColor;
  ctx.shadowColor = epsilonCarrier.accentColor;
  ctx.shadowBlur = 12;
  ctx.lineWidth = 2 * lw;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = epsilonCarrier.accentColor;
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

  drawNoseCone(ctx, radius, angle);
}

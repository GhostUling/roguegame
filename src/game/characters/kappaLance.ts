import { CharacterDef } from '../core/types';
import { strokeUnit } from './shipDraw';

export const kappaLance: CharacterDef = {
  id: 'kappa_lance',
  name: 'Lance Kappa',
  nameZh: 'κ·贯星',
  title: '超远穿透 / 弱点标记',
  desc: '搭载超长基线电磁轨道的狙击机体，在千里之外标记并贯穿成排的敌群。',
  color: '#818cf8',
  accentColor: '#5eead4',
  baseStats: {
    hp: 85,
    speed: 4.3,
    fireRate: 520, // ms
    bulletDamage: 34,
    bulletCount: 1,
    bulletPierce: 2,
    magnetRadius: 105,
    critChance: 0.14,
    critMultiplier: 2.6,
    orbitSatellites: 0,
  },
  passive: {
    name: 'Baseline Mark',
    nameZh: '长基线标记',
    desc: '每第 5 次射击发射一道贯穿全场的电磁射线，对路径上所有敌人造成 180% 伤害；被射线命中的敌人被标记 4 秒，期间受到的所有伤害 +25%。',
  },
  activeSkill: {
    id: 'annihilation',
    name: 'Annihilation',
    nameZh: '湮灭长矛',
    desc: '蓄力 0.6 秒后射出一道横贯战场的巨型光矛，造成 500% 伤害，贯穿一切并击退全场敌人。',
    cooldown: 14,
  },
};

/**
 * Long rail hull. Its own path already points the way it fires, so it needs no
 * separate nose cone and no idle spin (the same call Viper Gamma makes).
 */
export function drawKappaLance(
  ctx: CanvasRenderingContext2D,
  radius: number,
  angle: number,
  time: number
): void {
  const lw = strokeUnit(radius);

  ctx.save();
  ctx.rotate(angle);

  ctx.fillStyle = '#0b1024';
  ctx.strokeStyle = kappaLance.color;
  ctx.shadowColor = kappaLance.color;
  ctx.shadowBlur = 16;
  ctx.lineWidth = 2.5 * lw;
  ctx.beginPath();
  ctx.moveTo(radius * 1.7, 0);
  ctx.lineTo(radius * 0.35, -radius * 0.5);
  ctx.lineTo(-radius * 1.15, -radius * 0.75);
  ctx.lineTo(-radius * 1.15, radius * 0.75);
  ctx.lineTo(radius * 0.35, radius * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = kappaLance.accentColor;
  ctx.shadowColor = kappaLance.accentColor;
  ctx.shadowBlur = 10;
  ctx.lineWidth = 2 * lw;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(-radius * 0.9, side * radius * 0.62);
    ctx.lineTo(radius * 1.5, side * radius * 0.14);
    ctx.stroke();
  }

  ctx.restore();

  // Baseline gyro: an open ring that keeps its own beat, independent of the aim.
  ctx.save();
  ctx.rotate(-time * 1.1);
  ctx.strokeStyle = kappaLance.accentColor;
  ctx.shadowColor = kappaLance.accentColor;
  ctx.shadowBlur = 12;
  ctx.lineWidth = 2 * lw;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.95, 0.5, Math.PI * 1.7);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = kappaLance.color;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.22, 0, Math.PI * 2);
  ctx.fill();
}

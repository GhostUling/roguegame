import { CharacterDef } from '../core/types';
import { drawNoseCone, strokeUnit } from './shipDraw';

export const iotaFusion: CharacterDef = {
  id: 'iota_fusion',
  name: 'Fusion Iota',
  nameZh: 'ι·熔核',
  title: '过载爆轰 / 连锁熔核',
  desc: '核心永不熄火的自爆机体，每一发弹药都是一次微型核聚变，把战场烧成连锁火海。',
  color: '#f97316',
  accentColor: '#fde047',
  baseStats: {
    hp: 100,
    speed: 4.0,
    fireRate: 480, // ms
    bulletDamage: 30,
    bulletCount: 1,
    bulletPierce: 1,
    magnetRadius: 110,
    critChance: 0.1,
    critMultiplier: 2.0,
    orbitSatellites: 0,
  },
  passive: {
    name: 'Unstable Core',
    nameZh: '不稳定核心',
    desc: '子弹命中时额外引发一次半径 60 的爆炸，造成 40% 溅射伤害；每第 6 发子弹必定造成 250% 暴击并引发大范围爆轰。',
  },
  activeSkill: {
    id: 'meltdown',
    name: 'Meltdown',
    nameZh: '熔核裂变',
    desc: '在周身布置 5 枚熔核，1.5 秒后连锁引爆，每枚造成 200% 范围伤害，被波及的敌人附加 3 秒灼烧。',
    cooldown: 11,
  },
};

/** Three fuel rods feeding a caged core that never stops turning over. */
export function drawIotaFusion(
  ctx: CanvasRenderingContext2D,
  radius: number,
  angle: number,
  time: number
): void {
  const lw = strokeUnit(radius);

  ctx.save();
  ctx.rotate(time * 1.5);
  ctx.strokeStyle = iotaFusion.color;
  ctx.shadowColor = iotaFusion.color;
  ctx.shadowBlur = 18;
  ctx.lineWidth = 3 * lw;

  for (let s = 0; s < 3; s++) {
    ctx.save();
    ctx.rotate((s * Math.PI * 2) / 3);
    ctx.beginPath();
    ctx.moveTo(radius * 0.55, -radius * 0.16);
    ctx.lineTo(radius * 1.45, -radius * 0.16);
    ctx.lineTo(radius * 1.45, radius * 0.16);
    ctx.lineTo(radius * 0.55, radius * 0.16);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  ctx.save();
  ctx.rotate(-time * 2.2);
  ctx.strokeStyle = iotaFusion.accentColor;
  ctx.shadowColor = iotaFusion.accentColor;
  ctx.shadowBlur = 12;
  ctx.lineWidth = 2 * lw;

  ctx.beginPath();
  for (let s = 0; s < 6; s++) {
    const a = (s * Math.PI) / 3;
    const px = Math.cos(a) * radius * 0.78;
    const py = Math.sin(a) * radius * 0.78;
    if (s === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#1f0a02';
  ctx.strokeStyle = iotaFusion.accentColor;
  ctx.lineWidth = 2.5 * lw;
  ctx.shadowColor = iotaFusion.color;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.24, 0, Math.PI * 2);
  ctx.fill();

  drawNoseCone(ctx, radius, angle);
}

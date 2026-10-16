import { CharacterDef } from '../types';
import { strokeUnit } from './shipDraw';

export const gammaViper: CharacterDef = {
  id: 'gamma_viper',
  name: 'Viper Gamma',
  nameZh: 'γ·掠影',
  title: '极速机动 / 全向风暴',
  desc: '轻量化锐角掠翼歼击机体，将动力势能直接转化为毁灭性暴击伤害。',
  color: '#fbbf24',
  accentColor: '#ef4444',
  baseStats: {
    hp: 80,
    speed: 5.3,
    fireRate: 380, // ms
    bulletDamage: 22,
    bulletCount: 1,
    bulletPierce: 1,
    magnetRadius: 105,
    critChance: 0.25,
    critMultiplier: 2.4,
    orbitSatellites: 0,
  },
  passive: {
    name: 'Kinetic Surge',
    nameZh: '动能过载',
    desc: '移动速度直接等比转化为暴击几率（保持高速巡航可增加最高 +30% 额外暴击），暴击必引发范围小爆轰。',
  },
  activeSkill: {
    id: 'overload_barrage',
    name: 'Overload Barrage',
    nameZh: '全向超载齐射',
    desc: '机体进入超频过载状态 2 秒：开火频率暴增 300% 并呈 360° 旋转全向扫射弹幕风暴。',
    cooldown: 10,
    duration: 2.0,
  },
};

/**
 * Swept-wing interceptor. Its own hull path already points the way it faces, so
 * it needs no separate nose cone and no idle spin.
 */
export function drawGammaViper(
  ctx: CanvasRenderingContext2D,
  radius: number,
  angle: number
): void {
  const lw = strokeUnit(radius);

  ctx.save();
  ctx.rotate(angle);
  ctx.fillStyle = '#1e1402';
  ctx.strokeStyle = gammaViper.color;
  ctx.shadowColor = gammaViper.color;
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

  ctx.fillStyle = gammaViper.accentColor;
  ctx.beginPath();
  ctx.arc(-radius * 0.9, -5 * lw, 3.5 * lw, 0, Math.PI * 2);
  ctx.arc(-radius * 0.9, 5 * lw, 3.5 * lw, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

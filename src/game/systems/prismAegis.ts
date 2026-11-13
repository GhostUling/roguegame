import { Player } from '../core/types';

/**
 * Prism Aegis (绝对领域 · 棱镜偏折圣域)
 *
 * Expands an octagonal holographic aegis sanctuary around the vessel.
 * Enemy projectiles hitting the perimeter are reflected back at 2x speed as
 * piercing neon lasers! Accumulating enough absorbed force detonates a repelling
 * spatial discharge that pulverizes nearby swarms.
 *
 * Pure functions, testable headless.
 */

export const LVL_AEGIS_RADIUS = [130, 155, 180];
export const LVL_AEGIS_BURST_DAMAGE_SCALE = [3.5, 5.5, 8.0];
export const LVL_AEGIS_BURST_THRESHOLD = [8, 6, 4]; // reflections to trigger blast

export const AEGIS_REFLECT_SPEED_MULT = 2.0;
export const AEGIS_PULSE_INTERVAL = 0.55;
export const AEGIS_PULSE_DAMAGE_SHARE = 0.45;

export interface PrismAegisState {
  active: boolean;
  level: number;
  radius: number;
  rotAngle: number;
  absorbedCount: number;
  burstThreshold: number;
  pulseTimer: number;
}

export function aegisBurstDamage(player: Player, level: number = 1): number {
  const scale = LVL_AEGIS_BURST_DAMAGE_SCALE[Math.min(LVL_AEGIS_BURST_DAMAGE_SCALE.length, Math.max(1, level)) - 1];
  return Math.max(1, Math.round(player.bulletDamage * scale));
}

/** Determines if an incoming projectile position intersects the aegis barrier perimeter. */
export function projectileHitsAegisBarrier(
  playerX: number,
  playerY: number,
  aegisRadius: number,
  projX: number,
  projY: number,
  tolerance: number = 16
): boolean {
  const dist = Math.hypot(projX - playerX, projY - playerY);
  return Math.abs(dist - aegisRadius) <= tolerance;
}

/** Calculates reflected velocity vector aiming back outwards or toward nearest enemy. */
export function calculateReflectedVelocity(
  playerX: number,
  playerY: number,
  projX: number,
  projY: number,
  currentSpeed: number,
  speedMult: number = AEGIS_REFLECT_SPEED_MULT
): { vx: number; vy: number; angle: number } {
  const outAngle = Math.atan2(projY - playerY, projX - playerX);
  const newSpeed = Math.max(10, currentSpeed * speedMult);
  return {
    vx: Math.cos(outAngle) * newSpeed,
    vy: Math.sin(outAngle) * newSpeed,
    angle: outAngle,
  };
}

import { Player } from '../core/types';

/**
 * Mirage Blades (月华轮舞 · 幻影剑雨)
 *
 * 8 ice-blue diamond blades orbit tightly around the player, shredding and
 * freezing adjacent foes. Periodically or on command, all 8 blades fire in a
 * supersonic homing cascade, impaling the target in a geometric lotus bloom!
 *
 * Pure functions, testable headless.
 */

export const LVL_MIRAGE_COUNT = [8, 12, 16];
export const LVL_MIRAGE_INTERVAL = [4.5, 3.2, 2.2];
export const LVL_MIRAGE_DAMAGE_SCALE = [3.0, 4.5, 6.5];

export const MIRAGE_ORBIT_RADIUS = 75;
export const MIRAGE_ORBIT_SPEED = 4.5;
export const MIRAGE_ORBIT_HIT_COOLDOWN = 0.22;
export const MIRAGE_ORBIT_CONTACT_SHARE = 0.45;
export const MIRAGE_OUTBOUND_STAGGER = 0.035;
export const MIRAGE_OUTBOUND_SPEED = 28;
export const MIRAGE_RETURN_SPEED = 34;
export const MIRAGE_WAIT_PAUSE = 0.12;
export const MIRAGE_OFFSCREEN_MARGIN = 45;
export const MIRAGE_BLOOM_RADIUS = 60;
export const MIRAGE_BLOOM_DURATION = 0.45;
export const MAX_MIRAGE_BLOOMS = 28;
export const MIRAGE_BLOOM_MIN_SPACING = 28;

export interface MirageBlade {
  id: number;
  orbitAngle: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  state: 'orbit' | 'queued' | 'outbound' | 'waiting' | 'returning' | 'dead';
  launchDelay: number;
  targetX: number;
  targetY: number;
  targetEnemyId: number | null;
  life: number;
  damage: number;
  hitEnemies: Set<number>;
}

export interface MirageBloom {
  id: number;
  x: number;
  y: number;
  elapsed: number;
  duration: number;
}

export function mirageDamage(player: Player, level: number = 1): number {
  const scale = LVL_MIRAGE_DAMAGE_SCALE[Math.min(LVL_MIRAGE_DAMAGE_SCALE.length, Math.max(1, level)) - 1];
  return Math.max(1, Math.round(player.bulletDamage * scale));
}

/** Enforces active bloom cap and spatial deduplication so dense multi-pierces never flood rendering. */
export function canSpawnMirageBloom(
  existingBlooms: ReadonlyArray<Pick<MirageBloom, 'x' | 'y'>>,
  x: number,
  y: number,
  maxBlooms: number = MAX_MIRAGE_BLOOMS,
  minSpacing: number = MIRAGE_BLOOM_MIN_SPACING
): boolean {
  if (existingBlooms.length >= maxBlooms) return false;
  const minSq = minSpacing * minSpacing;
  for (let i = 0; i < existingBlooms.length; i++) {
    const b = existingBlooms[i];
    const d2 = (b.x - x) ** 2 + (b.y - y) ** 2;
    if (d2 < minSq) return false;
  }
  return true;
}

/** Computes orbit coordinates for a blade based on player pos and orbit angle. */
export function calculateBladeOrbitPos(
  playerX: number,
  playerY: number,
  orbitAngle: number,
  radius: number = MIRAGE_ORBIT_RADIUS
): { x: number; y: number } {
  return {
    x: playerX + Math.cos(orbitAngle) * radius,
    y: playerY + Math.sin(orbitAngle) * radius,
  };
}

/** Calculates straight velocity from blade toward target position. */
export function calculateBladeHomingVelocity(
  bladeX: number,
  bladeY: number,
  targetX: number,
  targetY: number,
  speed: number = MIRAGE_OUTBOUND_SPEED
): { vx: number; vy: number; dist: number; angle: number } {
  const dx = targetX - bladeX;
  const dy = targetY - bladeY;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return { vx: speed, vy: 0, dist: 0, angle: 0 };
  return {
    vx: (dx / dist) * speed,
    vy: (dy / dist) * speed,
    dist,
    angle: Math.atan2(dy, dx),
  };
}

/** True once the blade has flown outside the visible battlefield by margin px. */
export function isBladeOutsideScreen(
  x: number,
  y: number,
  width: number,
  height: number,
  margin: number = MIRAGE_OFFSCREEN_MARGIN
): boolean {
  return x < -margin || x > width + margin || y < -margin || y > height + margin;
}

/** Records a blade's edge-wait coordinates just outside the screen perimeter. */
export function clampBladeToOffscreenRim(
  x: number,
  y: number,
  width: number,
  height: number,
  margin: number = MIRAGE_OFFSCREEN_MARGIN
): { x: number; y: number } {
  return {
    x: Math.max(-margin, Math.min(width + margin, x)),
    y: Math.max(-margin, Math.min(height + margin, y)),
  };
}

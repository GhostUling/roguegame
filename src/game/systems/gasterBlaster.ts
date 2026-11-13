import { Player } from '../core/types';

/**
 * Gaster Blaster Protocol (龙骨共鸣 · 湮灭光环)
 *
 * Surrounds a target enemy or position in a circle of geometric skull-blasters
 * and sequentially discharges high-intensity piercing beams into the epicenter.
 *
 * All numbers and spatial calculations here are pure functions and testable headless.
 */

/** Radius of the surrounding blaster circle, in px. */
export const GASTER_RADIUS = 160;

/** Width of each fired laser beam, in px. */
export const GASTER_BEAM_WIDTH = 26;

/** Length of each fired laser beam beyond the center, in px. */
export const GASTER_BEAM_LENGTH = 520;

/** Time blasters take to materialize and lock onto target, in seconds. */
export const GASTER_WINDUP_SECONDS = 0.5;

/** Delay between sequential blaster shots, in seconds. */
export const GASTER_FIRE_STAGGER = 0.07;

/** Duration one blaster stays firing its beam, in seconds. */
export const GASTER_BEAM_DURATION = 0.22;

/** Time the ring lingers in dissipating state after last shot, in seconds. */
export const GASTER_DISSIPATE_SECONDS = 0.35;

/** Per-level table: blaster count (6, 8, 12) */
export const LVL_GASTER_COUNT = [6, 8, 12];

/** Per-level table: firing interval / cooldown (seconds) */
export const LVL_GASTER_INTERVAL = [7.0, 5.5, 4.0];

/** Per-level table: damage scale relative to player bullet damage */
export const LVL_GASTER_DAMAGE_SCALE = [3.5, 5.0, 7.5];

export interface BlasterUnit {
  id: number;
  angle: number; // Angle around the circle
  x: number; // Current position
  y: number;
  aimAngle: number; // Points towards center (angle + PI)
  chargePhase: number; // 0 to 1
  fireDelay: number; // Seconds from start until this blaster fires
  fired: boolean;
  fireProgress: number; // 0 (idle) to 1 (done)
}

export interface GasterRing {
  id: number;
  targetX: number;
  targetY: number;
  blasters: BlasterUnit[];
  elapsed: number;
  totalDuration: number;
  damage: number;
  hitEnemies: Set<number>; // IDs of enemies already hit by this ring
  completed: boolean;
}

/** Calculates positions of blasters evenly spaced on a circle around the target. */
export function createBlasterUnits(targetX: number, targetY: number, count: number): BlasterUnit[] {
  const units: BlasterUnit[] = [];
  const baseAngle = -Math.PI / 2; // Start from top
  for (let i = 0; i < count; i++) {
    const angle = baseAngle + (i / count) * Math.PI * 2;
    const x = targetX + Math.cos(angle) * GASTER_RADIUS;
    const y = targetY + Math.sin(angle) * GASTER_RADIUS;
    const aimAngle = angle + Math.PI; // Inward facing
    units.push({
      id: i,
      angle,
      x,
      y,
      aimAngle,
      chargePhase: 0,
      fireDelay: GASTER_WINDUP_SECONDS + i * GASTER_FIRE_STAGGER,
      fired: false,
      fireProgress: 0,
    });
  }
  return units;
}

/** Total lifetime of a full blaster sequence from summon to dissipation. */
export function gasterTotalDuration(count: number): number {
  return GASTER_WINDUP_SECONDS + count * GASTER_FIRE_STAGGER + GASTER_BEAM_DURATION + GASTER_DISSIPATE_SECONDS;
}

/** Damage one laser beam deals, derived from player bullet damage. */
export function gasterBeamDamage(player: Player, level: number = 1): number {
  const scale = LVL_GASTER_DAMAGE_SCALE[Math.min(LVL_GASTER_DAMAGE_SCALE.length, Math.max(1, level)) - 1];
  return Math.max(1, Math.round(player.bulletDamage * scale));
}

/**
 * Geometric check: whether a beam from (originX, originY) along aimAngle
 * with width and length hits a circular enemy at (enemyX, enemyY) with enemyRadius.
 */
export function beamHitsCircle(
  originX: number,
  originY: number,
  aimAngle: number,
  beamLength: number,
  beamWidth: number,
  enemyX: number,
  enemyY: number,
  enemyRadius: number
): boolean {
  const dx = enemyX - originX;
  const dy = enemyY - originY;

  // Project (dx, dy) onto the beam direction vector
  const dirX = Math.cos(aimAngle);
  const dirY = Math.sin(aimAngle);
  const forwardProj = dx * dirX + dy * dirY;

  // Behind the blaster or beyond beam length (accounting for enemy radius)
  if (forwardProj < -enemyRadius || forwardProj > beamLength + enemyRadius) {
    return false;
  }

  // Perpendicular distance to the beam axis
  const perpDist = Math.abs(dx * dirY - dy * dirX);
  const hitThreshold = beamWidth / 2 + enemyRadius;
  return perpDist <= hitThreshold;
}

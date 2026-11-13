import { Player } from '../core/types';

/**
 * Void Iaijutsu (次元居合 · 空间断绝)
 *
 * Slashes across dimensional space, momentarily freezing time during sheathing,
 * then detonates the seam in a catastrophic dimensional shatter.
 *
 * All numbers and spatial calculations here are pure functions and testable headless.
 */

/** Per-level dash distance in px. */
export const LVL_IAIJUTSU_DISTANCE = [220, 260, 300];

/** Per-level interval / cooldown in seconds. */
export const LVL_IAIJUTSU_INTERVAL = [5.0, 4.0, 3.0];

/** Per-level damage multiplier relative to player bullet damage. */
export const LVL_IAIJUTSU_DAMAGE_SCALE = [4.0, 6.5, 9.0];

/** Per-level spatial stun duration on cut enemies, in seconds. */
export const LVL_IAIJUTSU_STUN = [0.6, 0.8, 1.0];

/** Physical dash-cut travel duration of the phantom, in seconds. */
export const IAIJUTSU_CUT_DURATION = 0.14;

/** Sheathing pause (micro hit-stop) duration, in seconds. */
export const IAIJUTSU_SHEATH_PAUSE = 0.14;

/** Lifetime of the dimensional shattered seam visual, in seconds. */
export const IAIJUTSU_SHATTER_DURATION = 0.45;

/** Total width of the spatial cut damage corridor, in px. */
export const IAIJUTSU_CUT_WIDTH = 54;

export interface IaijutsuSlash {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  angle: number;
  length: number;
  elapsed: number;
  damage: number;
  stunDuration: number;
  phase: 'cut' | 'sheath' | 'shatter' | 'done';
  hitEnemies: Set<number>;
  shattered: boolean;
}

/** Computes phantom ship coordinates along the cut trajectory during the dash phase. */
export function calculateIaijutsuPhantomPos(
  slash: Pick<IaijutsuSlash, 'startX' | 'startY' | 'endX' | 'endY' | 'elapsed'>
): { x: number; y: number; progress: number } {
  const raw = Math.max(0, Math.min(1, slash.elapsed / IAIJUTSU_CUT_DURATION));
  // Rapid cubic ease-out: bursts across the line and snaps sharply at the sheathing point
  const progress = 1 - Math.pow(1 - raw, 3);
  return {
    x: slash.startX + (slash.endX - slash.startX) * progress,
    y: slash.startY + (slash.endY - slash.startY) * progress,
    progress,
  };
}

/** Calculates the cut destination point clamped to field boundaries. */
export function calculateIaijutsuDestination(
  startX: number,
  startY: number,
  angle: number,
  distance: number,
  fieldWidth: number,
  fieldHeight: number,
  margin: number = 50
): { endX: number; endY: number; actualDistance: number } {
  const targetX = startX + Math.cos(angle) * distance;
  const targetY = startY + Math.sin(angle) * distance;

  const clampedX = Math.max(margin, Math.min(fieldWidth - margin, targetX));
  const clampedY = Math.max(margin, Math.min(fieldHeight - margin, targetY));

  const actualDistance = Math.hypot(clampedX - startX, clampedY - startY);
  return { endX: clampedX, endY: clampedY, actualDistance };
}

/** Damage dealt by the dimensional shatter cut. */
export function iaijutsuDamage(player: Player, level: number = 1): number {
  const scale = LVL_IAIJUTSU_DAMAGE_SCALE[Math.min(LVL_IAIJUTSU_DAMAGE_SCALE.length, Math.max(1, level)) - 1];
  return Math.max(1, Math.round(player.bulletDamage * scale));
}

/** Distance from a point (px, py) to a finite line segment (x1, y1) -> (x2, y2). */
export function pointToSegmentDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return Math.hypot(px - x1, py - y1);

  // Project point onto segment, clamping projection t to [0, 1]
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSq));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

/** Checks whether a line cut hits a circular enemy. */
export function cutHitsEnemy(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  enemyX: number,
  enemyY: number,
  enemyRadius: number,
  corridorWidth: number = IAIJUTSU_CUT_WIDTH
): boolean {
  const dist = pointToSegmentDistance(enemyX, enemyY, x1, y1, x2, y2);
  return dist <= corridorWidth / 2 + enemyRadius;
}

/** Deterministic pseudo-random shards for drawing jagged spatial rift cracks. */
export function generateRiftShards(
  seed: number,
  count: number = 10
): Array<{ t: number; offset: number; angle: number; length: number }> {
  const shards: Array<{ t: number; offset: number; angle: number; length: number }> = [];
  for (let i = 0; i < count; i++) {
    // Linear congruential generator step
    const s = (seed * 1103515245 + i * 12345 + 1013904223) >>> 0;
    const t = (i + 0.5) / count;
    const offset = ((s % 200) / 100 - 1) * 22; // -22 to +22 px
    const angle = ((s % 628) / 100);
    const length = 12 + (s % 20);
    shards.push({ t, offset, angle, length });
  }
  return shards;
}

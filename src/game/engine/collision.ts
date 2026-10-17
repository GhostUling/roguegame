import { Enemy } from '../core/types';

/**
 * Hit tests shared by the two collision passes.
 *
 * They are pure geometry: no arrays, no player fields, no side effects. The
 * loop still owns what happens after a hit (damage, sparks, knockback, drops).
 */

export interface Point {
  x: number;
  y: number;
}

export function distanceSq(ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  return dx * dx + dy * dy;
}

/** Do two circles touch, given the squared centre distance and both radii? */
export function circlesTouch(distSq: number, radiusA: number, radiusB: number): boolean {
  const reach = radiusA + radiusB;
  return distSq < reach * reach;
}

/**
 * Fast-path reach for player rounds. It predates the boss: every wave enemy
 * plus a round fits inside it, while the 46px boss is wider than this box.
 * The value is kept so the hit boxes stay exactly what the game shipped with.
 */
const ROUND_BROAD_REACH = 32;

/** Does one player round overlap this enemy? */
export function roundHitsEnemy(
  x: number,
  y: number,
  radius: number,
  enemy: Pick<Enemy, 'x' | 'y' | 'radius'>
): boolean {
  const dx = enemy.x - x;
  if (dx > ROUND_BROAD_REACH || dx < -ROUND_BROAD_REACH) return false;
  const dy = enemy.y - y;
  if (dy > ROUND_BROAD_REACH || dy < -ROUND_BROAD_REACH) return false;
  return circlesTouch(dx * dx + dy * dy, radius, enemy.radius);
}

/**
 * The first wing an enemy round touches, or null. The port wing wins ties, so
 * a round landing between the two always reports the same side.
 */
export function firstWingHit(
  x: number,
  y: number,
  radius: number,
  wings: { p1: Point; p2: Point },
  paired: boolean,
  playerRadius: number
): Point | null {
  if (circlesTouch(distanceSq(x, y, wings.p1.x, wings.p1.y), playerRadius, radius)) {
    return wings.p1;
  }
  if (paired && circlesTouch(distanceSq(x, y, wings.p2.x, wings.p2.y), playerRadius, radius)) {
    return wings.p2;
  }
  return null;
}

import { Player } from './types';

/**
 * Rift Lance. The lance is a thrown spear, not a hitscan beam: it flies across
 * the field and leaves a torn seam behind it, and the seam is what chews through
 * the swarm while the spear itself skewers whatever is in front of it.
 *
 * Every number here is read by the engine and by the card copy, and the seam's
 * spacing is a pure function so it can be tested without a canvas.
 */

/**
 * How fast the lance crosses the field, in px per frame at 60fps. Faster than a
 * bullet (11), so the throw reads as a spear going *through* the field — but not
 * so fast that the flight itself is over before the eye catches it.
 */
export const LANCE_SPEED = 20;

/** Half-length of the drawn spear head, in px. */
export const LANCE_LENGTH = 42;

/** How far from the lance's axis it can hit, in px. Matches the drawn head. */
export const LANCE_RADIUS = 22;

/**
 * How long the lance stays in the air. Just long enough to leave the field:
 * longer than this and it would linger off-screen, shorter and the seam would
 * be cut off mid-flight.
 */
export const LANCE_LIFETIME = 1.8;

/**
 * How long one torn seam node lasts. The tear is the point of the card, so it
 * outlives the spear by a wide margin rather than vanishing behind it.
 */
export const RIFT_LIFETIME = 2.0;

/** Radius of one seam node, in px. */
export const RIFT_RADIUS = 26;

/** Seconds between a seam node's damage ticks. */
export const RIFT_TICK_SECONDS = 0.35;

/** Distance the lance travels between two seam nodes, in px. */
export const RIFT_SPACING = 26;

/**
 * Cap on live seam nodes. A full flight lays down about 95, so this holds one
 * complete seam plus most of a second; past that the oldest node is dropped
 * rather than the newest refused, so a tear is never truncated in the middle.
 * The seam is a line, not a wall, and it has to stay a line.
 */
export const MAX_RIFTS = 140;

/**
 * Stable offshoot for a seam node, derived from its id: the same node always
 * tears the same way, so the crack does not shimmer from frame to frame.
 */
export function riftBranch(id: number): { angle: number; length: number } {
  return {
    angle: ((id * 37) % 5) * 0.22 - 0.44,
    length: 9 + ((id * 17) % 7),
  };
}

/** Damage one seam tick deals to a mob (bosses are untouched by the seam). */
export function riftTickDamage(player: Player): number {
  return Math.max(1, Math.round(player.bulletDamage * player.riftDamageScale));
}

/** Damage the spear itself carries on each body it passes through. */
export function lanceDamage(player: Player): number {
  return Math.max(1, Math.round(player.bulletDamage * player.lanceDamageScale));
}

/**
 * The points along one frame's travel at which the seam is torn. The lance moves
 * up to ~115px in a single step at 3x speed, so walking the segment in
 * spacing-sized samples is also what stops it tunnelling straight past a body:
 * the samples double as the places the spear looks for something to hit.
 */
export function riftNodePath(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  spacing: number = RIFT_SPACING
): Array<{ x: number; y: number }> {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const travel = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(travel / spacing));

  const nodes: Array<{ x: number; y: number }> = [];
  for (let s = 1; s <= steps; s++) {
    nodes.push({ x: fromX + (dx * s) / steps, y: fromY + (dy * s) / steps });
  }
  return nodes;
}

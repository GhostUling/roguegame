import { Player } from '../core/types';

/**
 * Grid Verdict's lattice. The verdict cuts everything standing on the lines, so
 * all this has to answer is "how far is this point from the nearest line?" — the
 * card, the engine's scan and the renderer's lines all read the cell size from
 * here, which is what keeps the lines that are drawn identical to the lines that
 * cut.
 */

/** Lattice pitch, in px. Screen-anchored, so the lines never drift with the player. */
export const GRID_CELL = 48;

/** How long the lattice stays lit after a verdict, in seconds. */
export const GRID_FLASH = 0.35;

/** Seconds of stun a cut enemy takes. */
export const GRID_STUN = 0.5;

/** Seconds one line takes to cross the field during the wind-up. */
export const GRID_LINE_TIME = 0.16;

/** Spread of line start times; this is what makes the sweep uneven. */
export const GRID_STAGGER = 0.24;

/** Wind-up ends when the slowest line has finished crossing. */
export const GRID_WINDUP = GRID_STAGGER + GRID_LINE_TIME;

/** The assembled lattice holds this long, glowing, before it cuts. */
export const GRID_GLOW = 0.16;

/** Seconds from the start of the wind-up to the cut itself. */
export const GRID_STRIKE_AT = GRID_WINDUP + GRID_GLOW;

/** Deterministic [0,1) hash: a line always sweeps the same way in a session. */
function hash01(n: number): number {
  let x = Math.imul(n + 1, 374761393);
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

/** How much of one line has been drawn at `elapsed` seconds, from 0 to 1. */
export function gridLineReveal(seed: number, elapsed: number): number {
  const delay = hash01(seed * 2) * GRID_STAGGER;
  return Math.max(0, Math.min(1, (elapsed - delay) / GRID_LINE_TIME));
}

/** True when the line grows from the top/left edge rather than the far edge. */
export function gridLineFromStart(seed: number): boolean {
  return hash01(seed * 2 + 1) < 0.5;
}

/** 0 when the lattice has just assembled, 1 when the cut lands. */
export function gridGlowIntensity(elapsed: number): number {
  return Math.max(0, Math.min(1, (elapsed - GRID_WINDUP) / GRID_GLOW));
}

/** Damage one cut deals, as a share of the player's own shot. */
export function gridVerdictDamage(player: Player): number {
  return Math.max(1, Math.round(player.bulletDamage * player.gridDamageScale));
}

/** Distance from a coordinate to the nearest lattice line on that axis. */
export function gridLineDistance(value: number, cell: number = GRID_CELL): number {
  const offset = ((value % cell) + cell) % cell;
  return Math.min(offset, cell - offset);
}

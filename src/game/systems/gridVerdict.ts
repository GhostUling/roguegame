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

/** Damage one cut deals, as a share of the player's own shot. */
export function gridVerdictDamage(player: Player): number {
  return Math.max(1, Math.round(player.bulletDamage * player.gridDamageScale));
}

/** Distance from a coordinate to the nearest lattice line on that axis. */
export function gridLineDistance(value: number, cell: number = GRID_CELL): number {
  const offset = ((value % cell) + cell) % cell;
  return Math.min(offset, cell - offset);
}

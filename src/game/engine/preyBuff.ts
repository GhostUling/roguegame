import { Player } from '../core/types';
import { UpgradeDefinition } from '../cards/upgrades';

/**
 * How the prey grows stronger in Predator.
 *
 * It takes free levels out of **the same card pool a run draws from**, through
 * the same `apply(player, level)` path the level-up uses — the prey is the
 * `player` entity in this mode, so nothing here invents a second set of numbers.
 * A buff and a build are one table read from opposite sides.
 */

/** Seconds between two of the prey's free levels. */
export const PREY_BUFF_INTERVAL = 30;

/** How long a freshly taken level stays called out on the HUD. */
export const PREY_BUFF_CALLOUT = 4;

/**
 * Two cards in the pool are pure crystal economy: a wider pickup radius, and
 * sucking up the whole field on a level up. The prey collects no gems and never
 * levels (a soldier's death drops nothing), so handing it one of those would be
 * a card with no effect — the one thing this project's card rules forbid.
 */
export const PREY_EXCLUDED_KEYS: string[] = ['magnet', 'gravity_siphon'];

/** Cards the pool still has room to advance. Maxed cards are never offered. */
export function preyUpgradeCandidates(
  pool: UpgradeDefinition[],
  holder: Pick<Player, 'upgradeLevels'>
): UpgradeDefinition[] {
  const levels = holder.upgradeLevels;
  return pool.filter(
    (def) =>
      !PREY_EXCLUDED_KEYS.includes(def.key) && (levels[def.key] ?? 0) < def.maxLevel
  );
}

/** The card the prey takes now; undefined once the whole pool is maxed. */
export function pickPreyUpgrade(
  pool: UpgradeDefinition[],
  holder: Pick<Player, 'upgradeLevels'>,
  roll: () => number
): UpgradeDefinition | undefined {
  const eligible = preyUpgradeCandidates(pool, holder);
  if (eligible.length === 0) return undefined;
  const index = Math.min(eligible.length - 1, Math.floor(roll() * eligible.length));
  return eligible[index];
}

/** Seconds until the next level lands, clamped so a HUD never goes negative. */
export function preyBuffCountdown(secondsSinceLast: number): number {
  return Math.max(0, PREY_BUFF_INTERVAL - secondsSinceLast);
}

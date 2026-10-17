import { Enemy, Player } from '../core/types';

/**
 * Damage arithmetic that both sides of a collision need, kept out of the loop
 * so contact, enemy fire and every weapon agree on it.
 */

/** Lance Kappa's mark: +25% on every hit while it burns. */
const MARK_VULNERABILITY = 1.25;

/**
 * How much a status effect amplifies every hit on this enemy. Cryo freeze and
 * the mark stack multiplicatively.
 */
export function statusDamageMultiplier(
  enemy: Pick<Enemy, 'frozenTimer' | 'markedTimer'>,
  player: Pick<Player, 'cryoVulnerability'>
): number {
  let mult = 1;
  if (enemy.frozenTimer && enemy.frozenTimer > 0) mult *= 1 + player.cryoVulnerability;
  if (enemy.markedTimer && enemy.markedTimer > 0) mult *= MARK_VULNERABILITY;
  return mult;
}

/**
 * Aegis Theta's guardian drone shaves contact damage by a percentage, never
 * below 1. Enemy fire is not contact and skips this.
 */
export function afterDroneShield(
  amount: number,
  player: Pick<Player, 'droneShield' | 'droneShieldReduction'>
): number {
  if (!player.droneShield) return amount;
  return Math.max(1, Math.round(amount * (1 - player.droneShieldReduction)));
}

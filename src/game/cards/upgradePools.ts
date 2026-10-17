import { GameModeDef } from '../core/modes';
import { ALL_UPGRADES, UpgradeDefinition } from './upgrades';
import { OVERFLOW_UPGRADES } from './overflowUpgrades';

/**
 * The card table each mode draws its level-up hand from. A mode's `cardPool`
 * token names the table, so a mode is still one row in `GAME_MODES` and neither
 * pool knows the other exists.
 *
 * The two pools must never be merged into one draw: Overflow's cards reset a
 * build or lock max HP to 1 on purpose, which would wreck a standard run.
 */
export const CARD_POOLS: Record<GameModeDef['cardPool'], UpgradeDefinition[]> = {
  standard: ALL_UPGRADES,
  overflow: OVERFLOW_UPGRADES,
};

/**
 * Every card in the game, both pools. For display and key lookup only — a run
 * draws from `poolForMode`, never from here.
 */
export const EVERY_UPGRADE: UpgradeDefinition[] = [...ALL_UPGRADES, ...OVERFLOW_UPGRADES];

/**
 * The table a mode draws from. `override` exists for the sandbox's card-pool
 * switch; real runs pass nothing, so a mode's own table always wins.
 */
export function poolForMode(
  mode: Pick<GameModeDef, 'cardPool'>,
  override?: GameModeDef['cardPool']
): UpgradeDefinition[] {
  return CARD_POOLS[override ?? mode.cardPool];
}

/** Finds a card in either pool; undefined when no pool owns the key. */
export function findUpgrade(key: string): UpgradeDefinition | undefined {
  return EVERY_UPGRADE.find((u) => u.key === key);
}

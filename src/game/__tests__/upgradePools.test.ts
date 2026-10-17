import { describe, expect, it } from 'vitest';
import { GAME_MODES } from '../core/modes';
import { CARD_POOLS, poolForMode } from '../cards/upgradePools';
import { ALL_UPGRADES } from '../cards/upgrades';
import { OVERFLOW_UPGRADES } from '../cards/overflowUpgrades';

describe('poolForMode', () => {
  it('reads the mode table by default', () => {
    expect(poolForMode(GAME_MODES.standard)).toBe(ALL_UPGRADES);
    expect(poolForMode(GAME_MODES.overflow)).toBe(OVERFLOW_UPGRADES);
    expect(poolForMode(GAME_MODES.sandbox)).toBe(ALL_UPGRADES);
  });

  it('lets the sandbox borrow the other table without leaking either pool', () => {
    expect(poolForMode(GAME_MODES.sandbox, 'overflow')).toBe(OVERFLOW_UPGRADES);
    expect(poolForMode(GAME_MODES.sandbox, 'standard')).toBe(ALL_UPGRADES);

    // Without the override every mode still draws from its own table.
    for (const mode of Object.values(GAME_MODES)) {
      expect(poolForMode(mode)).toBe(CARD_POOLS[mode.cardPool]);
    }
  });
});

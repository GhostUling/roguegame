import { describe, expect, it } from 'vitest';
import { MONSTER_UPGRADES } from '../cards/monsterUpgrades';
import { ALL_UPGRADES } from '../cards/upgrades';
import { OVERFLOW_UPGRADES } from '../cards/overflowUpgrades';
import { createPlayer } from '../core/player';

describe('monster upgrades pool', () => {
  it('contains exactly 25 cards', () => {
    expect(MONSTER_UPGRADES).toHaveLength(25);
  });

  it('keeps all keys globally unique without collision against other pools', () => {
    const standardKeys = new Set(ALL_UPGRADES.map((u) => u.key));
    const overflowKeys = new Set(OVERFLOW_UPGRADES.map((u) => u.key));
    const monsterKeys = new Set<string>();

    for (const card of MONSTER_UPGRADES) {
      expect(monsterKeys.has(card.key), `duplicate key: ${card.key}`).toBe(false);
      expect(standardKeys.has(card.key), `collision with standard pool: ${card.key}`).toBe(false);
      expect(overflowKeys.has(card.key), `collision with overflow pool: ${card.key}`).toBe(false);
      monsterKeys.add(card.key);
    }
  });

  it('provides complete metadata and 3 levels for every card', () => {
    for (const card of MONSTER_UPGRADES) {
      expect(card.id).toBe(card.key);
      expect(card.name.length).toBeGreaterThan(0);
      expect(card.nameZh.length).toBeGreaterThan(0);
      expect(card.desc.length).toBeGreaterThan(0);
      expect(card.maxLevel).toBe(3);
      expect(['tactical', 'summon', 'defense', 'ballistic', 'energy']).toContain(card.category);
      expect(['common', 'rare', 'epic', 'legendary']).toContain(card.rarity);

      const dummyPlayer = createPlayer('alpha_prism', 'predator');
      const diff1 = card.statDiffText(dummyPlayer, 1);
      const diff2 = card.statDiffText(dummyPlayer, 2);
      const diff3 = card.statDiffText(dummyPlayer, 3);
      expect(diff1.length).toBeGreaterThan(0);
      expect(diff2.length).toBeGreaterThan(0);
      expect(diff3.length).toBeGreaterThan(0);
    }
  });

  it('applies level progression to player state without error', () => {
    for (const card of MONSTER_UPGRADES) {
      const player = createPlayer('alpha_prism', 'predator');
      expect(() => card.apply(player, 1)).not.toThrow();
      expect(() => card.apply(player, 2)).not.toThrow();
      expect(() => card.apply(player, 3)).not.toThrow();
    }
  });

  it('divides into Apex Dominion and Swarm Coordination families', () => {
    const apex = MONSTER_UPGRADES.filter((u) => u.key.startsWith('apex_'));
    const swarm = MONSTER_UPGRADES.filter((u) => u.key.startsWith('swarm_'));

    expect(apex).toHaveLength(13);
    expect(swarm).toHaveLength(12);
    expect(apex.length + swarm.length).toBe(25);
  });
});

import { describe, expect, it } from 'vitest';
import { ALL_UPGRADES, getRandomUpgrades } from '../upgrades';
import { OVERFLOW_UPGRADES } from '../overflowUpgrades';
import { EVERY_UPGRADE, findUpgrade, poolForMode } from '../upgradePools';
import { GAME_MODES } from '../modes';
import { createPlayer } from '../player';
import { Player } from '../types';

/** All numeric/boolean player state, so a no-op level is visible. */
function snapshot(p: Player): string {
  return JSON.stringify(
    Object.entries(p)
      .filter(([, v]) => typeof v === 'number' || typeof v === 'boolean')
      .sort(([a], [b]) => a.localeCompare(b))
  );
}

describe('overflow card table', () => {
  it('keeps ids and keys unique', () => {
    expect(new Set(OVERFLOW_UPGRADES.map((u) => u.id)).size).toBe(OVERFLOW_UPGRADES.length);
    expect(new Set(OVERFLOW_UPGRADES.map((u) => u.key)).size).toBe(OVERFLOW_UPGRADES.length);
  });

  it('never collides a key with the standard pool', () => {
    // One shared `upgradeLevels` record backs both pools, so a duplicate key
    // would silently merge two cards' levels into one.
    const keys = OVERFLOW_UPGRADES.map((u) => u.key);
    const standardKeys = new Set(ALL_UPGRADES.map((u) => u.key));
    for (const key of keys) {
      expect(standardKeys.has(key), key).toBe(false);
    }
    expect(new Set(EVERY_UPGRADE.map((u) => u.key)).size).toBe(EVERY_UPGRADE.length);
  });

  it('gives every card a real ceiling and readable copy', () => {
    for (const u of OVERFLOW_UPGRADES) {
      expect(u.maxLevel, u.key).toBeGreaterThan(0);
      expect(u.nameZh.length, u.key).toBeGreaterThan(0);
      expect(u.name.length, u.key).toBeGreaterThan(0);
      expect(u.desc.length, u.key).toBeGreaterThan(0);
    }
  });

  it('applies every card without throwing, even past its ceiling', () => {
    for (const u of OVERFLOW_UPGRADES) {
      const p = createPlayer('alpha_prism');
      for (let i = 0; i <= u.maxLevel + 3; i++) {
        expect(() => u.apply(p, i), u.key).not.toThrow();
      }
      expect(u.statDiffText(p, 1).length, u.key).toBeGreaterThan(0);
    }
  });
});

describe('every overflow level does something', () => {
  it('changes the player state on each and every rung', () => {
    for (const def of OVERFLOW_UPGRADES) {
      if (def.maxLevel < 2) continue;
      const p = createPlayer('alpha_prism');
      let previous = snapshot(p);
      for (let lvl = 1; lvl <= def.maxLevel; lvl++) {
        def.apply(p, lvl);
        const next = snapshot(p);
        expect(next, `${def.key} level ${lvl} changed nothing`).not.toBe(previous);
        previous = next;
      }
    }
  });

  it('previews the rung it is about to grant, not the one behind it', () => {
    const tableDriven = [
      'omni_barrage',
      'shard_storm',
      'kiloprism',
      'spawnshotter',
      'delayed_detonation',
      'phase_stutter',
      'crit_freeze',
      'chrono_verdict',
      'momentum',
      'mass_rounds',
      'hypercrit',
      'overdrive_engine',
      'gambler_pact',
      'prism_turret',
      'grid_verdict',
      'mirror_self',
      'necro_fleet',
      'overclock_protocol',
      'shot_echo',
      'rift_lance',
    ];
    for (const key of tableDriven) {
      const def = findUpgrade(key);
      expect(def, key).toBeDefined();
      const p = createPlayer('alpha_prism');
      def!.apply(p, 1);
      expect(def!.statDiffText(p, 2), key).not.toBe(def!.statDiffText(p, 1));
    }
  });
});

describe('overflow per-level ladders', () => {
  const atEachLevel = (key: string, read: (p: Player) => number) => {
    const def = findUpgrade(key)!;
    const p = createPlayer('alpha_prism');
    const seen: number[] = [];
    for (let lvl = 1; lvl <= def.maxLevel; lvl++) {
      def.apply(p, lvl);
      seen.push(read(p));
    }
    return seen;
  };

  it('grows the omni volley and keeps its damage share', () => {
    expect(atEachLevel('omni_barrage', (p) => p.omniBarrageCount)).toEqual([6, 9, 12]);
    expect(atEachLevel('omni_barrage', (p) => p.omniBarrageDamageScale)).toEqual([0.6, 0.6, 0.6]);
  });

  it('throws more shards on every kill', () => {
    expect(atEachLevel('shard_storm', (p) => p.shardStormCount)).toEqual([5, 8, 12]);
  });

  it('splits further and keeps children from splitting again', () => {
    expect(atEachLevel('spawnshotter', (p) => p.spawnShotCount)).toEqual([1, 2, 3]);
    expect(atEachLevel('spawnshotter', (p) => p.spawnShotDamageScale)).toEqual([0.5, 0.5, 0.5]);
  });

  it('adds both pierce and bounce on every kiloprism rung', () => {
    const pierce = atEachLevel('kiloprism', (p) => p.bulletPierce);
    const bounce = atEachLevel('kiloprism', (p) => p.bouncingBullets);
    // Alpha prism starts with 1 pierce; the ladder adds +2, +3, +4 cumulatively.
    expect(pierce).toEqual([3, 6, 10]);
    expect(bounce).toEqual([2, 6, 12]); // +2, +4, +6 cumulatively
  });

  it('runs the stopping clocks on the documented cadence', () => {
    expect(atEachLevel('crit_freeze', (p) => p.critFreezeTime)).toEqual([0.06, 0.1, 0.15]);
    expect(atEachLevel('chrono_verdict', (p) => p.verdictInterval)).toEqual([8, 6, 5]);
    expect(atEachLevel('chrono_verdict', (p) => p.verdictFreezeTime)).toEqual([0.8, 1.0, 1.4]);
  });

  it('tightens the stutter and lengthens the fuse every rung', () => {
    expect(atEachLevel('phase_stutter', (p) => p.stutterInterval)).toEqual([6, 4.5, 3]);
    expect(atEachLevel('delayed_detonation', (p) => p.delayedFuse)).toEqual([0.4, 0.6, 0.8]);
  });

  it('spools the reactor and the combo on every rung', () => {
    expect(atEachLevel('overdrive_engine', (p) => p.overdriveScale)).toEqual([1.35, 1.6, 1.9]);
    expect(atEachLevel('momentum', (p) => p.comboRatePerTen)).toEqual([0.08, 0.12, 0.16, 0.2, 0.24]);
  });

  it('makes glass storm a one-off switch, not a ladder', () => {
    const def = findUpgrade('glass_storm')!;
    expect(def.maxLevel).toBe(1);
    const p = createPlayer('alpha_prism');
    def.apply(p, 1);
    expect(p.maxHp).toBe(1);
    expect(p.hp).toBe(1);
  });

  it('deploys turrets sooner and hits harder on every rung', () => {
    expect(atEachLevel('prism_turret', (p) => p.turretInterval)).toEqual([25, 20, 15]);
    expect(atEachLevel('prism_turret', (p) => p.turretDamageScale)).toEqual([0.8, 1.0, 1.2]);
  });

  it('shortens the verdict cycle and sharpens the cut', () => {
    expect(atEachLevel('grid_verdict', (p) => p.gridInterval)).toEqual([10, 7]);
    expect(atEachLevel('grid_verdict', (p) => p.gridDamageScale)).toEqual([2.0, 3.0]);
  });

  it('fields the whole squad sooner and harder on every rung', () => {
    expect(atEachLevel('mirror_self', (p) => p.cloneInterval)).toEqual([40, 30, 20]);
    expect(atEachLevel('mirror_self', (p) => p.cloneDamageScale)).toEqual([0.5, 0.6, 0.7]);
    expect(atEachLevel('necro_fleet', (p) => p.necroChance)).toEqual([0.25, 0.35, 0.5]);
  });

  it('refunds the ultimate, replays the volley and throws the spear on every rung', () => {
    expect(atEachLevel('overclock_protocol', (p) => p.skillRefundPerKill)).toEqual([0.15, 0.25, 0.4]);
    expect(atEachLevel('shot_echo', (p) => p.echoDelay)).toEqual([0.35, 0.3, 0.25]);
    expect(atEachLevel('shot_echo', (p) => p.echoDamageScale)).toEqual([0.3, 0.4, 0.5]);
    expect(atEachLevel('rift_lance', (p) => p.lanceInterval)).toEqual([6, 4.5, 3]);
    expect(atEachLevel('rift_lance', (p) => p.lanceDamageScale)).toEqual([2.5, 3, 3.5]);
    expect(atEachLevel('rift_lance', (p) => p.riftDamageScale)).toEqual([0.22, 0.28, 0.34]);
  });
});

describe('pool dispatch', () => {
  it('routes each mode to its own table', () => {
    expect(poolForMode(GAME_MODES.standard)).toBe(ALL_UPGRADES);
    expect(poolForMode(GAME_MODES.twin_link)).toBe(ALL_UPGRADES);
    expect(poolForMode(GAME_MODES.overflow)).toBe(OVERFLOW_UPGRADES);
  });

  it('deals overflow cards, and only overflow cards, from the overflow pool', () => {
    const p = createPlayer('alpha_prism');
    const pool = poolForMode(GAME_MODES.overflow);
    const standardKeys = new Set(ALL_UPGRADES.map((u) => u.key));
    const overflowKeys = new Set(OVERFLOW_UPGRADES.map((u) => u.key));

    for (let i = 0; i < 60; i++) {
      const hand = getRandomUpgrades(p, {}, 3, pool);
      expect(hand).toHaveLength(3);
      expect(new Set(hand.map((o) => o.key)).size).toBe(hand.length);
      for (const card of hand) {
        expect(overflowKeys.has(card.key), card.key).toBe(true);
        expect(standardKeys.has(card.key), card.key).toBe(false);
      }
    }
  });

  it('never leaks an overflow card into a default draw', () => {
    const p = createPlayer('alpha_prism');
    const overflowKeys = new Set(OVERFLOW_UPGRADES.map((u) => u.key));
    for (let i = 0; i < 60; i++) {
      for (const card of getRandomUpgrades(p, {})) {
        expect(overflowKeys.has(card.key), card.key).toBe(false);
      }
    }
  });

  it('falls back to the emergency repair card once the overflow pool is maxed', () => {
    const p = createPlayer('alpha_prism');
    const maxed: Record<string, number> = {};
    for (const u of OVERFLOW_UPGRADES) maxed[u.key] = u.maxLevel;

    const hand = getRandomUpgrades(p, maxed, 3, OVERFLOW_UPGRADES);
    expect(hand).toHaveLength(1);
    expect(hand[0].key).toBe('emergency_repair');
  });
});

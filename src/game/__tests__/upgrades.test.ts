import { describe, expect, it } from 'vitest';
import { ALL_UPGRADES, getRandomUpgrades } from './upgrades';
import { createPlayer } from './player';
import { Player } from './types';

describe('upgrade table', () => {
  it('keeps ids and keys unique', () => {
    expect(new Set(ALL_UPGRADES.map((u) => u.id)).size).toBe(ALL_UPGRADES.length);
    expect(new Set(ALL_UPGRADES.map((u) => u.key)).size).toBe(ALL_UPGRADES.length);
  });

  it('gives every upgrade a real level ceiling and readable copy', () => {
    for (const u of ALL_UPGRADES) {
      expect(u.maxLevel, u.key).toBeGreaterThan(0);
      expect(u.nameZh.length, u.key).toBeGreaterThan(0);
      expect(u.desc.length, u.key).toBeGreaterThan(0);
    }
  });

  it('applies every upgrade without throwing', () => {
    for (const u of ALL_UPGRADES) {
      const p = createPlayer('alpha_prism');
      expect(() => u.apply(p, 1), u.key).not.toThrow();
    }
  });

  it('survives being applied past its own ceiling', () => {
    for (const u of ALL_UPGRADES) {
      const p = createPlayer('alpha_prism');
      for (let i = 0; i < u.maxLevel + 3; i++) {
        expect(() => u.apply(p, i), u.key).not.toThrow();
      }
    }
  });

  it('describes the step it is about to take', () => {
    for (const u of ALL_UPGRADES) {
      const p = createPlayer('alpha_prism');
      expect(u.statDiffText(p, 1).length, u.key).toBeGreaterThan(0);
    }
  });
});

describe('upgrade caps', () => {
  it('holds multi-shot at six barrels', () => {
    const p = createPlayer('alpha_prism');
    const multi = ALL_UPGRADES.find((u) => u.key === 'multi_shot')!;
    for (let i = 0; i < 10; i++) multi.apply(p, i);
    expect(p.bulletCount).toBe(6);
  });

  it('holds the fire interval at the 80ms floor', () => {
    const p = createPlayer('alpha_prism');
    const rate = ALL_UPGRADES.find((u) => u.key === 'fire_rate')!;
    for (let i = 0; i < 12; i++) rate.apply(p, i);
    expect(p.fireRate).toBeGreaterThanOrEqual(80);
  });

  it('holds crit chance at 90%', () => {
    const p = createPlayer('gamma_viper');
    const crit = ALL_UPGRADES.find((u) => u.key === 'critical_core')!;
    for (let i = 0; i < 12; i++) crit.apply(p, i);
    expect(p.critChance).toBeLessThanOrEqual(0.9);
  });

  it('keeps the damage ladder strictly increasing', () => {
    const p = createPlayer('alpha_prism');
    const dmg = ALL_UPGRADES.find((u) => u.key === 'damage')!;
    let previous = p.bulletDamage;
    for (let i = 0; i < dmg.maxLevel; i++) {
      dmg.apply(p, i);
      expect(p.bulletDamage).toBeGreaterThan(previous);
      previous = p.bulletDamage;
    }
  });
});

describe('getRandomUpgrades', () => {
  it('deals a hand of distinct, unmaxed options', () => {
    const p = createPlayer('alpha_prism');
    for (let i = 0; i < 40; i++) {
      const hand = getRandomUpgrades(p, {});
      expect(hand).toHaveLength(3);
      expect(new Set(hand.map((o) => o.key)).size).toBe(hand.length);
    }
  });

  it('falls back to the emergency repair card once everything is maxed', () => {
    const p = createPlayer('alpha_prism');
    const maxed: Record<string, number> = {};
    for (const u of ALL_UPGRADES) maxed[u.key] = u.maxLevel;

    const hand = getRandomUpgrades(p, maxed);
    expect(hand).toHaveLength(1);
    expect(hand[0].key).toBe('emergency_repair');
    expect(hand[0].apply).toBeTypeOf('function');
  });

  it('still deals a hand when some upgrades are maxed', () => {
    const p = createPlayer('alpha_prism');
    const levels = { multi_shot: ALL_UPGRADES.find((u) => u.key === 'multi_shot')!.maxLevel };
    const hand = getRandomUpgrades(p, levels);
    expect(hand).toHaveLength(3);
    expect(hand.map((o) => o.key)).not.toContain('multi_shot');
  });
});

/** All numeric/boolean player state, so a no-op level is visible. */
function snapshot(p: Player): string {
  return JSON.stringify(
    Object.entries(p)
      .filter(([, v]) => typeof v === 'number' || typeof v === 'boolean')
      .sort(([a], [b]) => a.localeCompare(b))
  );
}

describe('every level does something', () => {
  it('changes the player state on each and every rung', () => {
    for (const def of ALL_UPGRADES) {
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
    // These are the upgrades whose ladder lives in a per-level table, so their
    // preview must move with the level. The rest derive their preview from the
    // player's live stats, which do not change until the pick lands.
    const tableDriven = [
      'cluster_bombs',
      'cryo_freeze',
      'chain_lightning',
      'repulsion_field',
      'retaliation_thorns',
      'nanite_aegis',
      'drone_missiles',
      'drone_shield',
      'summon_railgun',
      'drone_overclock',
      'executioner',
      'gravity_siphon',
      'nova_pulse',
    ];
    for (const key of tableDriven) {
      const def = ALL_UPGRADES.find((u) => u.key === key);
      expect(def, key).toBeDefined();
      const p = createPlayer('alpha_prism');
      def!.apply(p, 1);
      expect(def!.statDiffText(p, 2), key).not.toBe(def!.statDiffText(p, 1));
    }
  });
});

describe('per-level ladders', () => {
  const get = (key: string) => ALL_UPGRADES.find((u) => u.key === key)!;
  const atEachLevel = (key: string, read: (p: Player) => number) => {
    const def = get(key);
    const p = createPlayer('alpha_prism');
    const seen: number[] = [];
    for (let lvl = 1; lvl <= def.maxLevel; lvl++) {
      def.apply(p, lvl);
      seen.push(read(p));
    }
    return seen;
  };

  it('recharges the nanite shield faster on every rung', () => {
    expect(atEachLevel('nanite_aegis', (p) => p.naniteShieldCooldown)).toEqual([4.0, 3.2, 2.5]);
    expect(atEachLevel('nanite_aegis', (p) => p.naniteBreakWaveRadius)).toEqual([80, 80, 200]);
  });

  it('raises the execution threshold on every rung', () => {
    expect(atEachLevel('executioner', (p) => p.executionerThreshold)).toEqual([0.25, 0.32, 0.4]);
  });

  it('adds spikes and bite to the thorns on every rung', () => {
    expect(atEachLevel('retaliation_thorns', (p) => p.thornsCount)).toEqual([8, 12, 16]);
    expect(atEachLevel('retaliation_thorns', (p) => p.thornsDamageScale)).toEqual([0.9, 1.35, 1.35]);
    expect(atEachLevel('retaliation_thorns', (p) => p.thornsPierce)).toEqual([2, 3, 3]);
  });

  it('deepens the freeze on every rung', () => {
    expect(atEachLevel('cryo_freeze', (p) => p.cryoSlowMultiplier)).toEqual([0.65, 0.55, 0.45]);
    expect(atEachLevel('cryo_freeze', (p) => p.cryoVulnerability)).toEqual([0.2, 0.3, 0.4]);
  });

  it('widens the repulsion field and shortens its cycle', () => {
    expect(atEachLevel('repulsion_field', (p) => p.repulsionRadius)).toEqual([160, 200, 200]);
    expect(atEachLevel('repulsion_field', (p) => p.repulsionInterval)).toEqual([6.0, 4.5, 3.0]);
  });

  it('chains further and stuns at the top rung', () => {
    expect(atEachLevel('chain_lightning', (p) => p.chainLightningTargets)).toEqual([3, 4, 5]);
    expect(atEachLevel('chain_lightning', (p) => p.chainLightningDamageScale)).toEqual([
      0.6, 0.84, 0.84,
    ]);
    expect(atEachLevel('chain_lightning', (p) => p.chainLightningStun)).toEqual([0, 0, 0.35]);
  });

  it('splits the cluster shells further and harder', () => {
    expect(atEachLevel('cluster_bombs', (p) => p.clusterBombFragments)).toEqual([3, 3, 4]);
    expect(atEachLevel('cluster_bombs', (p) => p.clusterBombDamageScale)).toEqual([0.4, 0.6, 0.6]);
  });

  it('speeds and hardens the drone swarm on every rung', () => {
    expect(atEachLevel('drone_overclock', (p) => p.droneRateScale)).toEqual([1.35, 1.35, 1.92]);
    expect(atEachLevel('drone_overclock', (p) => p.droneDamageScale)).toEqual([1, 1.25, 1.25]);
    // 1.92x is what lands the interceptor on the 240ms floor the card promises.
    const p = createPlayer('alpha_prism');
    expect(Math.round(p.droneFireInterval / 1.92)).toBe(240);
  });

  it('shortens the railgun cycle and doubles the beam at the top rung', () => {
    expect(atEachLevel('summon_railgun', (p) => p.railgunInterval)).toEqual([3400, 2500, 1800]);
    expect(atEachLevel('summon_railgun', (p) => p.railgunDamageScale)).toEqual([2.8, 4.2, 4.2]);
    expect(atEachLevel('summon_railgun', (p) => p.railgunWidthScale)).toEqual([1, 1, 2]);
  });

  it('makes the missiles faster and heavier', () => {
    expect(atEachLevel('drone_missiles', (p) => p.droneMissileInterval)).toEqual([2400, 2400, 1800]);
    expect(atEachLevel('drone_missiles', (p) => p.droneMissileDamageScale)).toEqual([1.5, 2.1, 2.1]);
  });

  it('thickens the guardian screen', () => {
    expect(atEachLevel('drone_shield', (p) => p.droneShieldReduction)).toEqual([0.15, 0.25, 0.35]);
    expect(atEachLevel('drone_shield', (p) => p.droneShieldSpinScale)).toEqual([1.0, 1.35, 1.35]);
  });

  it('adds the knockback wave to the gravity siphon at rung two', () => {
    const def = get('gravity_siphon');
    const p = createPlayer('alpha_prism');
    def.apply(p, 1);
    expect(p.gravitySiphonWave).toBe(false);
    def.apply(p, 2);
    expect(p.gravitySiphonWave).toBe(true);
    expect(p.gemPullSpeedScale).toBe(1.5);
  });

  it('tightens the nova cycle to the documented 2.5s', () => {
    expect(atEachLevel('nova_pulse', (p) => p.novaInterval)).toEqual([5000, 4000, 2500]);
  });
});

describe('cards grant the level they advertise', () => {
  const onlyAvailable = (key: string) => {
    const levels: Record<string, number> = {};
    for (const u of ALL_UPGRADES) levels[u.key] = u.maxLevel;
    delete levels[key];
    return levels;
  };

  it('applies the advertised level through the dealt wrapper', () => {
    const p = createPlayer('alpha_prism');
    const levels = onlyAvailable('nanite_aegis');

    const first = getRandomUpgrades(p, levels);
    expect(first).toHaveLength(1);
    expect(first[0].level).toBe(1);
    first[0].apply(p, first[0].level);
    expect(p.naniteShieldCooldown).toBe(4.0);

    // The wrapper used to forward the level *before* the pick, so a second card
    // re-granted level 1 and every tier above it stayed dead.
    const second = getRandomUpgrades(p, { ...levels, nanite_aegis: 1 });
    expect(second[0].level).toBe(2);
    second[0].apply(p, second[0].level);
    expect(p.naniteShieldCooldown).toBe(3.2);
  });
});

import { describe, expect, it } from 'vitest';
import { CHARACTERS } from './characters';
import { createPlayer } from './player';
import { isPaired } from './modes';

describe('createPlayer', () => {
  it('starts a solo run on the chassis own values', () => {
    const p = createPlayer('gamma_viper');
    expect(p.gameMode).toBe('standard');
    expect(p.twinPilotId).toBeUndefined();
    expect(p.maxHp).toBe(80);
    expect(p.bulletDamage).toBe(22);
    expect(p.hp).toBe(p.maxHp);
  });

  it('starts every chassis in the table runnable', () => {
    for (const def of CHARACTERS) {
      const p = createPlayer(def.id);
      expect(p.maxHp, def.id).toBe(def.baseStats.hp);
      expect(p.speed, def.id).toBe(def.baseStats.speed);
      expect(p.fireRate, def.id).toBe(def.baseStats.fireRate);
      expect(p.bulletDamage, def.id).toBe(def.baseStats.bulletDamage);
      expect(p.skillMaxCooldown, def.id).toBe(def.activeSkill.cooldown);
      expect(p.xp, def.id).toBe(0);
      expect(p.level, def.id).toBe(1);
    }
  });

  it('pools hit points and averages speed across a pair', () => {
    const p = createPlayer('gamma_viper', 'twin_link', 'beta_phalanx');
    expect(p.maxHp).toBe(240); // 80 + 160
    expect(p.speed).toBeCloseTo((5.3 + 3.7) / 2);
    expect(p.twinPilotId).toBe('beta_phalanx');
    expect(isPaired(p)).toBe(true);
  });

  it('takes the better pickup range and crit of the pair', () => {
    const p = createPlayer('delta_chronos', 'twin_link', 'gamma_viper');
    expect(p.magnetRadius).toBe(175); // chronos beats viper's 105
    expect(p.critChance).toBeCloseTo(0.25); // viper beats chronos' 0.15
    expect(p.critMultiplier).toBeCloseTo(2.4);
  });

  it('lets either wing contribute its passive', () => {
    expect(createPlayer('alpha_prism', 'twin_link', 'beta_phalanx').shieldRegenRate).toBe(7.0);
    expect(createPlayer('beta_phalanx', 'twin_link', 'alpha_prism').shieldRegenRate).toBe(7.0);

    const aurora = createPlayer('alpha_prism', 'twin_link', 'zeta_aurora');
    expect(aurora.cryoSlow).toBe(true);
    expect(aurora.bouncingBullets).toBe(1);
  });

  it('does not grant a passive the pair does not fly', () => {
    const p = createPlayer('alpha_prism', 'twin_link', 'gamma_viper');
    expect(p.shieldRegenRate).toBe(3.5);
    expect(p.cryoSlow).toBe(false);
    expect(p.bouncingBullets).toBe(0);
  });

  it('gives a carrier one drone per carrier wing', () => {
    expect(createPlayer('epsilon_carrier').drones).toHaveLength(1);
    expect(createPlayer('epsilon_carrier', 'twin_link', 'alpha_prism').drones).toHaveLength(1);
    expect(createPlayer('epsilon_carrier', 'twin_link', 'epsilon_carrier').drones).toHaveLength(2);
    expect(createPlayer('alpha_prism', 'twin_link', 'epsilon_carrier').drones).toHaveLength(1);
    expect(createPlayer('epsilon_carrier').droneCount).toBe(1);
    expect(createPlayer('epsilon_carrier').activeSlots).toContain('summon_drone');
  });

  it('charges the longer ultimate cooldown of the pair', () => {
    expect(createPlayer('alpha_prism').skillMaxCooldown).toBe(8);
    expect(createPlayer('alpha_prism').skillMaxDuration).toBe(0);

    const pair = createPlayer('alpha_prism', 'twin_link', 'beta_phalanx');
    expect(pair.skillMaxCooldown).toBe(14);
    expect(pair.skillMaxDuration).toBe(2.5);
  });

  it('starts every run out of combat and off cooldown', () => {
    const p = createPlayer('delta_chronos');
    expect(p.skillCooldown).toBe(0);
    expect(p.isSkillActive).toBe(false);
    expect(p.timeSinceLastDamage).toBeGreaterThan(3.0); // already regenerating
    expect(p.orbitSatellites).toBe(1); // chronos starts with a prism
  });
});

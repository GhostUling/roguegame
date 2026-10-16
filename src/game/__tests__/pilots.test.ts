import { describe, expect, it } from 'vitest';
import { createPlayer } from '../player';
import { getPilotWeaponStats, getTwinPositions, hasPilot } from '../pilots';
import { GAME_MODES, isPaired } from '../modes';

const WING_SPACING = GAME_MODES.twin_link.wingSpacing;

describe('solo run', () => {
  it('is not treated as a pair', () => {
    expect(isPaired(createPlayer('alpha_prism'))).toBe(false);
  });

  it('collapses both wing positions onto the vessel', () => {
    const p = createPlayer('alpha_prism');
    p.x = 100;
    p.y = 50;
    expect(getTwinPositions(p)).toEqual({
      p1: { x: 100, y: 50 },
      p2: { x: 100, y: 50 },
    });
  });

  it('hands the wing its own stats untouched', () => {
    const p = createPlayer('gamma_viper');
    const stats = getPilotWeaponStats(p, 0);
    expect(stats.charId).toBe('gamma_viper');
    expect(stats.bulletDamage).toBe(p.bulletDamage);
    expect(stats.fireRate).toBe(p.fireRate);
    expect(stats.bulletCount).toBe(p.bulletCount);
  });
});

describe('solo run asked for a second wing', () => {
  it('ignores the extra pilot id', () => {
    const stats = getPilotWeaponStats(createPlayer('alpha_prism', 'standard', 'beta_phalanx'), 1);
    expect(stats.charId).toBe('alpha_prism');
  });
});

describe('linked pair', () => {
  const pair = createPlayer('alpha_prism', 'twin_link', 'beta_phalanx');

  it('flies both wings one span either side of the centre', () => {
    const p = createPlayer('alpha_prism', 'twin_link', 'beta_phalanx');
    p.x = 200;
    p.y = 100;
    const { p1, p2 } = getTwinPositions(p);
    expect(p1).toEqual({ x: 200 - WING_SPACING, y: 100 });
    expect(p2).toEqual({ x: 200 + WING_SPACING, y: 100 });
  });

  it('reports either chassis as present', () => {
    expect(isPaired(pair)).toBe(true);
    expect(hasPilot(pair, 'alpha_prism')).toBe(true);
    expect(hasPilot(pair, 'beta_phalanx')).toBe(true);
    expect(hasPilot(pair, 'gamma_viper')).toBe(false);
  });

  it('gives the second wing its own chassis base', () => {
    const stats = getPilotWeaponStats(pair, 1);
    expect(stats.charId).toBe('beta_phalanx');
    expect(stats.fireRate).toBe(500);
    expect(stats.bulletDamage).toBe(35);
    expect(stats.bulletPierce).toBe(2);
    expect(stats.critChance).toBeCloseTo(0.08);
    expect(stats.critMultiplier).toBeCloseTo(1.8);
  });

  it('spreads a shared upgrade to the second wing as a delta', () => {
    const p = createPlayer('alpha_prism', 'twin_link', 'beta_phalanx');

    p.bulletDamage = 35; // one High-Energy Impact on the lead wing (26 * 1.35)
    expect(getPilotWeaponStats(p, 1).bulletDamage).toBe(47);

    p.bulletCount = 2; // one Multi-Vector Spread
    expect(getPilotWeaponStats(p, 1).bulletCount).toBe(2);

    p.bulletPierce = 2; // one Kinetic Pierce
    expect(getPilotWeaponStats(p, 1).bulletPierce).toBe(3);
  });

  it('only moves the second wing as far as the lead wing moved', () => {
    const p = createPlayer('alpha_prism', 'twin_link', 'beta_phalanx');
    p.fireRate = 215; // two Overclock Frequency hits (430 * 0.78^2)
    const ratio = 215 / 430;
    expect(getPilotWeaponStats(p, 1).fireRate).toBe(Math.round(500 * ratio));
  });

  it('clamps the second wing crit chance to the shared ceiling', () => {
    const p = createPlayer('alpha_prism', 'twin_link', 'beta_phalanx');
    p.critChance = 0.95;
    expect(getPilotWeaponStats(p, 1).critChance).toBe(0.9);
  });

  it('never lets the second wing drop below one bullet', () => {
    const p = createPlayer('beta_phalanx', 'twin_link', 'alpha_prism');
    p.bulletCount = 0;
    expect(getPilotWeaponStats(p, 1).bulletCount).toBe(1);
  });
});

import { describe, expect, it } from 'vitest';
import { EnemyType } from '../core/types';
import { ENEMY_TYPES } from '../core/enemyTypes';
import {
  BOSS_FORM_AFTER,
  MORPH_INVULN,
  PILOT_HP_SCALE,
  PILOT_SPEED_CEIL,
  PILOT_SPEED_FLOOR,
  createPilot,
  bindableForms,
  formOf,
  pilotContactFor,
  pilotHpFor,
  pilotSpeedFor,
  pickRespawnForm,
  soldierCanBite,
} from '../core/predatorForms';

const ALL_TYPES = Object.keys(ENEMY_TYPES) as EnemyType[];

describe('form table', () => {
  it('covers every monster type with a usable ult', () => {
    for (const type of ALL_TYPES) {
      const form = formOf(type);
      expect(form.ultNameZh.length, type).toBeGreaterThan(1);
      expect(form.ultDesc.length, type).toBeGreaterThan(4);
      expect(form.ultCooldown, type).toBeGreaterThan(0);
    }
  });
});

describe('pilot stats come from the monster table', () => {
  it('scales HP off the same growth curve the swarm uses', () => {
    expect(pilotHpFor('chaser', 0)).toBe(ENEMY_TYPES.chaser.hp * PILOT_HP_SCALE);
    // 120s of growth applies once, exactly like a freshly spawned soldier.
    expect(pilotHpFor('chaser', 120)).toBe(
      Math.round(40 * (1 + 0.7) * PILOT_HP_SCALE)
    );
  });

  it('clamps speed into a steerable band', () => {
    expect(pilotSpeedFor('chaser', 2.4)).toBeCloseTo(4.8);
    expect(pilotSpeedFor('tank', 2.4)).toBe(PILOT_SPEED_FLOOR);
    expect(pilotSpeedFor('speeder', 2.4)).toBe(PILOT_SPEED_CEIL);
  });

  it('rounds contact damage and never lets it reach zero', () => {
    expect(pilotContactFor('chaser', 2.5)).toBe(30);
    expect(pilotContactFor('chaser', 0.01)).toBe(1);
  });

  it('creates a pilot that starts morph-protected', () => {
    const pilot = createPilot('sniper', {
      x: 100,
      y: 200,
      elapsed: 0,
      speedScale: 2.4,
      contactScale: 2.5,
    });
    expect(pilot.form).toBe('sniper');
    expect(pilot.hp).toBe(pilot.maxHp);
    expect(pilot.radius).toBe(ENEMY_TYPES.sniper.radius);
    expect(pilot.invulnTimer).toBe(MORPH_INVULN);
    expect(pilot.ultTimer).toBe(0);
    expect(pilot.speed).toBeGreaterThan(0);
  });
});

describe('bindableForms', () => {
  it('only offers what the wave table has unlocked', () => {
    const early = bindableForms(10);
    expect(early.length).toBeGreaterThan(0);
    expect(early.every((type) => type === 'chaser' || type === 'speeder')).toBe(true);
  });

  it('holds the boss form back until late, then keeps it available', () => {
    expect(bindableForms(BOSS_FORM_AFTER - 1)).not.toContain('boss');
    expect(bindableForms(BOSS_FORM_AFTER)).toContain('boss');
    expect(bindableForms(280)).toContain('boss');
  });
});

describe('pickRespawnForm', () => {
  const roll = (value: number) => () => value;

  it('takes a bound slot and never the form you just lost', () => {
    expect(pickRespawnForm(['chaser', 'tank'], 'chaser', 0, roll(0))).toBe('tank');
    expect(pickRespawnForm(['chaser', 'tank'], 'tank', 0, roll(0.99))).toBe('chaser');
  });

  it('keeps the only slot you bound, even when it is the body you lost', () => {
    expect(pickRespawnForm(['tank'], 'tank', 0, roll(0))).toBe('tank');
  });

  it('rolls off the unlocked roster when you bound nothing', () => {
    const woke = pickRespawnForm([], 'chaser', 10, roll(0));
    expect(woke).not.toBe('chaser');
    expect(bindableForms(10)).toContain(woke);
  });
});

describe('soldier bite gate', () => {
  it('bites whenever its own cooldown has run out', () => {
    expect(soldierCanBite({ contactCooldown: 0.4 })).toBe(false);
    expect(soldierCanBite({ contactCooldown: 0 })).toBe(true);
    expect(soldierCanBite({})).toBe(true);
  });
});

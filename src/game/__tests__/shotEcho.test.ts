import { describe, expect, it } from 'vitest';
import { MAX_PENDING_ECHOES, echoRoundDamage } from '../shotEcho';
import { findUpgrade } from '../upgradePools';
import { createPlayer } from '../player';

describe('shot echo numbers', () => {
  it('keeps a bounded backlog of replays', () => {
    // Every echo doubles the rounds in the air and the projectile list is
    // capped, so this is the card's only brake on itself.
    expect(MAX_PENDING_ECHOES).toBeGreaterThan(0);
    expect(MAX_PENDING_ECHOES).toBeLessThanOrEqual(16);
  });

  it('stays off until the card is taken', () => {
    const def = findUpgrade('shot_echo');
    expect(def).toBeDefined();

    const p = createPlayer('alpha_prism');
    expect(p.echoDelay).toBe(0); // the engine's gate for the whole queue

    def!.apply(p, 1);
    expect(p.echoDelay).toBe(0.35);
  });

  it('replays sooner and harder on every rung', () => {
    const def = findUpgrade('shot_echo')!;
    const p = createPlayer('alpha_prism'); // 26 damage
    const delays: number[] = [];
    const echoes: number[] = [];
    for (let lvl = 1; lvl <= def.maxLevel; lvl++) {
      def.apply(p, lvl);
      delays.push(p.echoDelay);
      echoes.push(echoRoundDamage(p));
    }
    expect(delays).toEqual([0.35, 0.3, 0.25]);
    expect(echoes).toEqual([8, 10, 13]); // 26 × 0.3 / 0.4 / 0.5
  });

  it('always lets a replay register', () => {
    const p = createPlayer('alpha_prism');
    p.bulletDamage = 1;
    p.echoDamageScale = 0.01;
    expect(echoRoundDamage(p)).toBe(1);
  });
});

describe('overclock protocol card', () => {
  it('refunds the ultimate per weapon kill, and only once taken', () => {
    const def = findUpgrade('overclock_protocol');
    expect(def).toBeDefined();

    const p = createPlayer('alpha_prism');
    expect(p.skillRefundPerKill).toBe(0);

    def!.apply(p, 1);
    expect(p.skillRefundPerKill).toBe(0.15);
  });

  it('refunds more on every rung, but never a whole cooldown in one kill', () => {
    const def = findUpgrade('overclock_protocol')!;
    const p = createPlayer('alpha_prism');
    const refunds: number[] = [];
    for (let lvl = 1; lvl <= def.maxLevel; lvl++) {
      def.apply(p, lvl);
      refunds.push(p.skillRefundPerKill);
    }
    expect(refunds).toEqual([0.15, 0.25, 0.4]);
    // A single kill must stay well under the shortest ultimate in the game (8s),
    // or the ability would be refunded outright by one corpse.
    expect(Math.max(...refunds)).toBeLessThan(1);
  });
});

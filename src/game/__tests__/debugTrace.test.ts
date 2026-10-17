import { describe, expect, it } from 'vitest';
import { DEBUG_EVENT_CAP, DebugEvent, pushDebugEvent } from '../engine/debugTrace';
import type { GameEngine } from '../engine';
import { runHeadless } from './headlessEngine';

describe('debug trace buffer', () => {
  it('keeps only the most recent events', () => {
    const log: DebugEvent[] = [];
    for (let i = 0; i < DEBUG_EVENT_CAP + 5; i++) {
      pushDebugEvent(log, { seq: i, t: i, tag: 't', detail: '' });
    }
    expect(log).toHaveLength(DEBUG_EVENT_CAP);
    expect(log[0].t).toBe(5);
  });
});

describe('spawnshot trace', () => {
  const setup = (engine: GameEngine) => {
    engine.spawnTestEnemies('tank', 1);
    const enemy = engine.enemies[0];
    enemy.x = engine.player.x + 40;
    enemy.y = engine.player.y;
    enemy.hp = 1e9;
    enemy.maxHp = 1e9;
  };

  it('records the hit line and the split when the switch is on', () => {
    const run = runHeadless({
      character: 'alpha_prism',
      gameMode: 'sandbox',
      build: { spawnshotter: 1 },
      setup: (engine) => {
        engine.setDebugTrace(true);
        setup(engine);
      },
    });
    try {
      run.step(30);
      const tags = run.engine.debugEvents.map((e) => e.tag);
      expect(tags).toContain('hit');
      expect(tags).toContain('spawn');
      expect(run.engine.debugEvents.find((e) => e.tag === 'hit')?.detail).toContain('count=1');
    } finally {
      run.restore();
    }
  });

  it('stays empty when the switch is off', () => {
    const run = runHeadless({
      character: 'alpha_prism',
      gameMode: 'sandbox',
      build: { spawnshotter: 1 },
      setup,
    });
    try {
      run.step(30);
      expect(run.engine.debugEvents).toHaveLength(0);
    } finally {
      run.restore();
    }
  });
});

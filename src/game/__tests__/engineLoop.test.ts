import { describe, expect, it } from 'vitest';
import { GameEngine } from '../engine';
import { modeOfPlayer } from '../core/modes';
import { findNonFinite, runHeadless, sampleFields, sampleWorld, WorldSample } from './headlessEngine';

/**
 * A regression net for the engine loop, which until now had none. It needs a
 * canvas, so every other test stops at the pure modules and the loop has only
 * ever been checked by playing the game. That is fine for adding a card and
 * useless for moving code around inside it, because a move has no way to show
 * that it changed nothing.
 *
 * These runs drive the real engine — spawning, AI, collisions, drops, the card
 * hooks, the render pass — through the substitutions described in
 * headlessEngine.ts. What they assert is deliberately about *shape*, not about
 * recorded numbers:
 *
 *   - invariants on every single frame: no NaN anywhere, nothing outside the
 *     field, no cap broken;
 *   - counters that must never go backwards (kills, damage, level), which is how
 *     a lost update or a double-applied step shows up;
 *   - the systems actually engaged — if a refactor quietly stops deploying
 *     turrets or spears, that is a failure, not a smaller diff;
 *   - the same seed replays the same run, which is a precondition for trusting
 *     any of the above and catches accidental use of unseeded randomness.
 *
 * It does not pin the numbers themselves. A recorded trace would catch subtler
 * drift, at the cost of needing a deliberate re-record whenever behaviour changes
 * on purpose; that trade-off is worth taking separately rather than by default.
 */

/** A slow lissajous sweep, so the hull wanders and picks gems up. */
const SWEEP = (frame: number) => ({
  x: Math.cos(frame * 0.011) * 0.8 + Math.cos(frame * 0.003) * 0.2,
  y: Math.sin(frame * 0.017) * 0.8 + Math.sin(frame * 0.005) * 0.2,
});

/** Start one gem short of a level, so the level-up path runs early. */
const oneShortOfALevel = (engine: GameEngine) => {
  engine.player.xp = engine.player.nextLevelXp - 1;
};

/**
 * One card per engine hook, so a run has every system live at once. Left out on
 * purpose: glass_storm (max HP 1) and overdrive_engine (burns HP while idle),
 * which would end the run before it got going.
 */
const CARD_SINK: Record<string, number> = {
  magnet: 5, overcharge_amp: 2, overclock_clock: 2, infinite_fan: 2,
  omni_barrage: 1, shard_storm: 1, spawnshotter: 1, pinball_hell: 1, kiloprism: 1,
  delayed_detonation: 1, mass_rounds: 1, momentum: 1,
  crit_freeze: 1, chrono_verdict: 1, phase_stutter: 1, hypercrit: 1,
  prism_turret: 3, mirror_self: 3, necro_fleet: 3, shot_echo: 3, rift_lance: 3, grid_verdict: 2,
};

const PEAK_KEYS = [
  'enemies', 'projectiles', 'gems', 'particles',
  'rifts', 'lances', 'turrets', 'clones', 'allies', 'echoes',
] as const;
type PeakKey = (typeof PEAK_KEYS)[number];

interface Run {
  /** One reading per simulated second. */
  trace: WorldSample[];
  /** The same readings as lines, for comparing whole runs. */
  lines: string[];
  peaks: Record<string, number>;
  engine: GameEngine;
  /** Anything that broke an every-frame invariant, by label. */
  violations: string[];
}

type Scenario = Omit<
  Parameters<typeof runHeadless>[0],
  'frames' | 'seed' | 'input' | 'watch'
>;

function run(opts: Scenario, seconds: number): Run {
  const violations: string[] = [];
  const peaks: Record<string, number> = {};

  const harness = runHeadless({
    ...opts,
    seed: 7,
    input: SWEEP,
    watch: (engine) => {
      const nonFinite = findNonFinite(engine);
      if (nonFinite) violations.push(nonFinite);

      const mode = modeOfPlayer(engine.player);
      if (engine.enemies.length > mode.maxAlive) {
        violations.push(`enemies past the cap: ${engine.enemies.length} > ${mode.maxAlive}`);
      }

      const p = engine.player;
      if (p.x < 0 || p.x > engine.width || p.y < 0 || p.y > engine.height) {
        violations.push(`the hull left the field at ${p.x.toFixed(1)},${p.y.toFixed(1)}`);
      }
    },
  });

  const trace: WorldSample[] = [];
  const lines: string[] = [];
  try {
    for (let second = 0; second < seconds; second++) {
      harness.step(60);
      trace.push(sampleFields(harness.engine));
      lines.push(sampleWorld(harness.engine));
      for (const key of PEAK_KEYS) {
        const list = harness.engine[key as keyof GameEngine] as unknown[];
        peaks[key] = Math.max(peaks[key] ?? 0, list.length);
      }
    }
    return { trace, lines, peaks, engine: harness.engine, violations };
  } finally {
    harness.restore();
  }
}

/** Counters that only ever go up. A backwards step means a lost or doubled update. */
function expectNeverDecreases(trace: WorldSample[], key: keyof WorldSample) {
  for (let i = 1; i < trace.length; i++) {
    expect(trace[i][key], `${String(key)} went backwards at ${i}s`).toBeGreaterThanOrEqual(
      trace[i - 1][key]
    );
  }
}

describe('engine loop, headless', () => {
  it('A: overflow, holding still for 15s', () => {
    const r = run({ character: 'alpha_prism', gameMode: 'overflow' }, 15);

    expect(r.violations).toEqual([]);
    expect(r.engine.state).toBe('playing');
    expect(r.trace).toHaveLength(15);
    expect(r.peaks.enemies, 'nothing spawned').toBeGreaterThan(10);
    expect(r.engine.player.kills, 'nothing died').toBeGreaterThan(0);
    expectNeverDecreases(r.trace, 'kills');
    expectNeverDecreases(r.trace, 'damage');
  });

  it('B: standard, every card system live, 30s', () => {
    const r = run(
      { character: 'alpha_prism', gameMode: 'standard', build: CARD_SINK, setup: oneShortOfALevel },
      30
    );

    expect(r.violations).toEqual([]);
    expect(r.engine.state).toBe('playing');
    expect(r.engine.player.level, 'the level-up path never ran').toBeGreaterThan(1);
    expectNeverDecreases(r.trace, 'kills');
    expectNeverDecreases(r.trace, 'damage');
    expectNeverDecreases(r.trace, 'level');

    for (const key of ['rifts', 'turrets', 'clones', 'allies', 'echoes'] as const) {
      expect(r.peaks[key], `${key} never engaged`).toBeGreaterThan(0);
    }
  });

  it('C: twin link, every card system live, 30s', () => {
    const r = run(
      {
        character: 'alpha_prism',
        gameMode: 'twin_link',
        twinPilotId: 'beta_phalanx',
        build: CARD_SINK,
        setup: oneShortOfALevel,
      },
      30
    );

    expect(r.violations).toEqual([]);
    expect(r.engine.state).toBe('playing');
    // Pooled hit points are the twin link's defining knob, worth pinning here.
    expect(r.engine.player.maxHp).toBe(260);
    expect(r.engine.player.kills).toBeGreaterThan(0);
    expectNeverDecreases(r.trace, 'kills');
    for (const key of ['rifts', 'turrets', 'allies'] as const) {
      expect(r.peaks[key], `${key} never engaged`).toBeGreaterThan(0);
    }
  });

  it('replays the same run from the same seed', () => {
    // Everything random in the engine runs off the harness's seeded RNG, so two
    // runs have to agree line for line. If this fails, some code reached for the
    // real clock or the real Math.random, and the other assertions lose meaning.
    const opts: Scenario = {
      character: 'alpha_prism',
      gameMode: 'standard',
      build: CARD_SINK,
      setup: oneShortOfALevel,
    };
    const first = run(opts, 10);
    const second = run(opts, 10);

    expect(second.lines).toEqual(first.lines);
  });

  it('cannot pass by doing nothing', () => {
    // A guard on the runs above: if the harness ever stops driving the engine,
    // the world freezes and most assertions here would still hold.
    const r = run({ character: 'alpha_prism', gameMode: 'overflow' }, 6);

    expect(r.trace).toHaveLength(6);
    expect(new Set(r.lines).size, 'the world never changed').toBeGreaterThan(2);
  });
});

import { GameEngine, GameEngineCallbacks } from '../engine';
import { CharacterId, GameMode, Player } from '../core/types';
import { getRandomUpgrades } from '../cards/upgrades';
import { findUpgrade, poolForMode } from '../cards/upgradePools';
import { modeOfPlayer } from '../core/modes';

/**
 * A headless way to run the real engine loop.
 *
 * The engine and the renderer are the one layer nothing else covers — they need a
 * canvas, so every test so far has stopped at the pure modules and the loop has
 * been verified by playing the game. That is fine for adding a card and hopeless
 * for moving code around inside it: a refactor of the loop has no way to prove it
 * changed nothing.
 *
 * So this drives the actual GameEngine with three substitutions, and nothing else:
 *
 * - a canvas and a 2D context that accept every call and return nothing useful,
 *   which lets the real render pass run and throw if it is broken;
 * - a clock, requestAnimationFrame included, so frames are stepped by hand and
 *   never by wall time;
 * - a seeded Math.random, because the engine makes hundreds of random rolls a
 *   second and nothing below is meaningful without them being repeatable.
 *
 * Everything else — spawning, AI, collisions, drops, the card hooks, the render
 * pass — is the real code taking its real path.
 */

/** Every method is a no-op; reads of state give back something sane. */
function stubContext(): CanvasRenderingContext2D {
  const store: Record<string, unknown> = {
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    lineDashOffset: 0,
    shadowBlur: 0,
    shadowColor: 'transparent',
    strokeStyle: '#000',
    fillStyle: '#000',
    font: '10px sans-serif',
    textAlign: 'start',
  };

  const proxy = new Proxy(store, {
    get(target, prop) {
      if (prop in target) return target[prop as string];
      // Anything unknown becomes a callable that returns this same proxy, which
      // is what makes chained results work: createRadialGradient().addColorStop().
      const fn = () => proxy;
      target[prop as string] = fn;
      return fn;
    },
    set(target, prop, value) {
      target[prop as string] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;

  return proxy;
}

function stubCanvas(): HTMLCanvasElement {
  const ctx = stubContext();
  return {
    width: 1920,
    height: 1080,
    style: {},
    getContext: () => ctx,
  } as unknown as HTMLCanvasElement;
}

interface Harness {
  engine: GameEngine;
  /** Steps exactly `frames` frames of 60fps and returns the engine. */
  step: (frames: number) => GameEngine;
  /**
   * Puts the real clock, RNG and globals back. The caller owns this: it is kept
   * out of `step` so a run can be walked in chunks and asserted as it goes, and it
   * must be called even when an assertion fails, or a later test file inherits a
   * fake clock.
   */
  restore: () => void;
}

/**
 * Runs one scenario headlessly. The level-up callback mirrors what App does on a
 * level up (take the first card the pool offers, at the level it would be granted),
 * so the card hooks are exercised rather than skipped.
 */
export function runHeadless(opts: {
  character: CharacterId;
  gameMode: GameMode;
  twinPilotId?: CharacterId;
  seed?: number;
  /**
   * Scripted stick input, called once per frame. Steering moves the hull, which
   * is what collects gems, which is what levels the player up and therefore what
   * actually exercises the card hooks — without it a run stays at level 1 and
   * every card system sits idle.
   */
  input?: (frame: number, engine: GameEngine) => { x: number; y: number };
  /**
   * Cards to hand the player before the run starts, as key → level. Applied
   * through the real card definitions, so every hook they install is the real
   * one. This is how a regression run reaches the interesting states without
   * playing for ten minutes: left alone, a run takes one or two cards an hour.
   */
  build?: Record<string, number>;
  /**
   * Last say before the first frame, for arranging the board — e.g. putting the
   * player one gem short of a level so the level-up path runs early instead of
   * needing a minute of play to reach. State is set; behaviour is not faked.
   */
  setup?: (engine: GameEngine) => void;
  /**
   * Called after every frame, for checks that have to hold all the way through
   * rather than only at the end of a run — no NaN in the world, nothing outside
   * the field, no cap broken.
   */
  watch?: (engine: GameEngine, frame: number) => void;
}): Harness {
  const seed = opts.seed ?? 1;

  // A deterministic RNG. mulberry32: small, fast, and good enough that the
  // scenario reaches the same state every run.
  let state = seed >>> 0;
  const realRandom = Math.random;
  Math.random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  let virtualNow = 0;
  const realPerformance = globalThis.performance;
  // @ts-expect-error the harness owns the clock
  globalThis.performance = { now: () => virtualNow };

  let pendingFrame: ((t: number) => void) | null = null;
  const realRaf = globalThis.requestAnimationFrame;
  const realCancel = globalThis.cancelAnimationFrame;
  globalThis.requestAnimationFrame = (cb: (t: number) => void) => {
    pendingFrame = cb;
    return 1;
  };
  globalThis.cancelAnimationFrame = () => {
    pendingFrame = null;
  };

  const realWindow = globalThis.window;
  const listeners = new Map<string, unknown>();
  // @ts-expect-error a window with just what the engine touches
  globalThis.window = {
    innerWidth: 1920,
    innerHeight: 1080,
    addEventListener: (type: string, fn: unknown) => listeners.set(type, fn),
    removeEventListener: (type: string) => listeners.delete(type),
  };

  const realDocument = globalThis.document;
  // @ts-expect-error only the glow-sprite cache asks for a canvas
  globalThis.document = { createElement: () => stubCanvas() };

  // Put back everything the harness swapped out, so a failing assertion in one
  // test file cannot leak a fake clock into the next.
  const restore = () => {
    Math.random = realRandom;
    globalThis.performance = realPerformance;
    globalThis.requestAnimationFrame = realRaf;
    globalThis.cancelAnimationFrame = realCancel;
    if (realWindow === undefined) delete (globalThis as { window?: unknown }).window;
    else globalThis.window = realWindow;
    if (realDocument === undefined) delete (globalThis as { document?: unknown }).document;
    else globalThis.document = realDocument;
  };

  let engine: GameEngine;
  try {
    engine = new GameEngine(stubCanvas(), {
      onLevelUp: () => {
        const p = engine.player;
        const levels = p.upgradeLevels || {};
        const pool = poolForMode(modeOfPlayer(p));
        const hand = getRandomUpgrades(p, levels, 3, pool);
        const card = hand[0];
        if (card) {
          const level = (levels[card.key] || 0) + 1;
          if (!p.activeSlots) p.activeSlots = [];
          if (!p.activeSlots.includes(card.key)) p.activeSlots.push(card.key);
          card.apply(p, level);
          p.upgradeLevels[card.key] = level;
        }
        engine.resumeGame();
      },
      onGameOver: () => {},
      onStatsUpdate: () => {},
    } as GameEngineCallbacks);
  } catch (error) {
    restore();
    throw error;
  }

  engine.startNewGame(opts.character, opts.gameMode, opts.twinPilotId);

  if (opts.build) {
    const levels = engine.player.upgradeLevels || {};
    engine.player.upgradeLevels = levels;
    for (const [key, level] of Object.entries(opts.build)) {
      const def = findUpgrade(key);
      if (!def) throw new Error(`headless build names a card that does not exist: ${key}`);
      if (!engine.player.activeSlots) engine.player.activeSlots = [];
      if (!engine.player.activeSlots.includes(key)) engine.player.activeSlots.push(key);
      def.apply(engine.player, level);
      levels[key] = level;
    }
  }

  if (opts.setup) opts.setup(engine);

  let frameIndex = 0;
  const step = (frames: number): GameEngine => {
    for (let i = 0; i < frames; i++) {
      if (opts.input) engine.joystickVector = opts.input(frameIndex, engine);
      virtualNow += 1000 / 60;
      const cb = pendingFrame;
      pendingFrame = null;
      if (cb) cb(virtualNow);
      frameIndex++;
      if (opts.watch) opts.watch(engine, frameIndex);
    }
    return engine;
  };

  return { engine, step, restore };
}

/** One second of the world, as numbers, for assertions. */
export interface WorldSample {
  hp: number;
  level: number;
  xp: number;
  kills: number;
  damage: number;
  enemies: number;
  projectiles: number;
  gems: number;
  particles: number;
  lances: number;
  rifts: number;
  turrets: number;
  clones: number;
  allies: number;
  /** Sum of rounded enemy coordinates: catches drift the counts would miss. */
  where: number;
}

/**
 * A coarse, order-independent reading of the world. Enemy positions are rounded
 * before summing, so the reading does not depend on storage order or on float
 * addition order.
 */
export function sampleFields(engine: GameEngine): WorldSample {
  const p = engine.player;
  return {
    hp: p.hp,
    level: p.level,
    xp: Math.round(p.xp),
    kills: p.kills,
    damage: Math.round(p.totalDamageDealt),
    enemies: engine.enemies.length,
    projectiles: engine.projectiles.length,
    gems: engine.gems.length,
    particles: engine.particles.length,
    lances: engine.lances.length,
    rifts: engine.rifts.length,
    turrets: engine.turrets.length,
    clones: engine.clones.length,
    allies: engine.allies.length,
    where: engine.enemies.reduce((acc, e) => acc + Math.round(e.x) + Math.round(e.y), 0),
  };
}

/** The same reading as one line, for comparing whole runs. */
export function sampleWorld(engine: GameEngine): string {
  const s = sampleFields(engine);
  return [
    s.hp.toFixed(1), s.level, s.xp, s.kills, s.damage,
    s.enemies, s.projectiles, s.gems, s.particles,
    s.lances, s.rifts, s.turrets, s.clones, s.allies, s.where,
  ].join('|');
}

/** Every number the simulation depends on has to stay a real number. */
export function findNonFinite(engine: GameEngine): string | null {
  const bad = (label: string, values: number[]) =>
    values.some((v) => !Number.isFinite(v)) ? label : null;

  const p = engine.player;
  return (
    bad('player', [p.x, p.y, p.vx, p.vy, p.hp, p.xp, p.totalDamageDealt, p.score]) ||
    engine.enemies.map((e) => bad(`enemy#${e.id}`, [e.x, e.y, e.hp, e.damage])).find(Boolean) ||
    engine.projectiles.map((b) => bad(`round#${b.id}`, [b.x, b.y, b.damage])).find(Boolean) ||
    null
  );
}

import { CharacterId, GameMode, Player } from './types';

/**
 * Everything that makes one game mode different from another.
 *
 * The engine, the UI and the player factory all read these numbers instead of
 * comparing `gameMode === 'twin_link'`, so adding a mode is adding one row here.
 */
export interface GameModeDef {
  id: GameMode;
  /** Chinese display name shown on the mode card and the in-game badge. */
  name: string;
  /** Latin sub-label, e.g. `SOLO` / `TWIN LINK`. */
  tag: string;
  desc: string;
  /** How many vessels the player must pick on the select screen. */
  pilotSlots: 1 | 2;
  /** Distance from the formation centre to each wing, in px. 0 = single hull. */
  wingSpacing: number;
  /** Enemies spawned per spawn tick. */
  spawnMultiplier: number;
  /** Concurrent enemy cap. */
  maxAlive: number;
  /** Multiplier on the enemy hp/speed growth curve over time. */
  growthScale: number;
  /**
   * Multiplier on the enemy damage and speed growth rates. 0 keeps both flat,
   * which is how every mode behaved before the Overflow design added the curves.
   */
  threatScale: number;
  /** Max HP is the sum of both pilots' chassis HP. */
  pooledHp: boolean;
  /** Which card table the level-up hand is drawn from (see upgradePools.ts). */
  cardPool: 'standard' | 'overflow';
  /**
   * True for the sandbox: no wave ticks and no boss schedule. Every enemy on
   * the field was placed by the test API, so nothing buries what you are
   * watching.
   */
  manualSpawn: boolean;
  /** Hidden from the title screen in a production build; dev server only. */
  devOnly: boolean;
  /**
   * Predator's inversion in one switch: the `player` entity is the scripted
   * prey, `enemies` are your own soldiers, and your rounds only bite the prey.
   * Every other mode leaves this false and keeps the standard collision paths.
   */
  heroPrey: boolean;
  /** Predator: prey HP = chassis HP x this. 0 = no scripted prey in the run. */
  heroHpScale: number;
  /** Predator: soldiers spawned per wave tick. 0 = no swarm gathers. */
  swarmMultiplier: number;
  /** Predator: the pilot form's contact damage scale. */
  contactDamageScale: number;
  /** Predator: monster speed x this = how fast you steer. */
  pilotSpeedScale: number;
  /** Seconds of run before the clock ends it. 0 = no clock (every older mode). */
  runDurationSec: number;
  /** UI hue token; the screens map it to Tailwind classes. */
  accent: 'cyan' | 'fuchsia' | 'amber' | 'emerald' | 'rose';
}

export const GAME_MODES: Record<GameMode, GameModeDef> = {
  standard: {
    id: 'standard',
    name: '标准出击',
    tag: 'SOLO',
    desc: '单机体独立作战，原有节奏与难度，标准肉鸽体验。',
    pilotSlots: 1,
    wingSpacing: 0,
    spawnMultiplier: 1,
    maxAlive: 95,
    growthScale: 1,
    threatScale: 0,
    pooledHp: false,
    cardPool: 'standard',
    manualSpawn: false,
    devOnly: false,
    heroPrey: false,
    heroHpScale: 0,
    swarmMultiplier: 0,
    contactDamageScale: 1,
    pilotSpeedScale: 1,
    runDurationSec: 0,
    accent: 'cyan',
  },
  twin_link: {
    id: 'twin_link',
    name: '双子共鸣',
    tag: 'TWIN LINK',
    desc: '双机同频编队，共用血条与强化，火力翻倍、怪潮也翻倍。',
    pilotSlots: 2,
    wingSpacing: 32,
    spawnMultiplier: 2,
    maxAlive: 150,
    growthScale: 1.5,
    threatScale: 0,
    pooledHp: true,
    cardPool: 'standard',
    manualSpawn: false,
    devOnly: false,
    heroPrey: false,
    heroHpScale: 0,
    swarmMultiplier: 0,
    contactDamageScale: 1,
    pilotSpeedScale: 1,
    runDurationSec: 0,
    accent: 'fuchsia',
  },
  overflow: {
    id: 'overflow',
    name: '溢流',
    tag: 'OVERFLOW',
    desc: '反应堆越过临界点：怪潮四倍密度，敌人随时间越打越痛，升级快得离谱。',
    pilotSlots: 1,
    wingSpacing: 0,
    spawnMultiplier: 4.5,
    maxAlive: 260,
    growthScale: 3.0,
    threatScale: 1.0,
    pooledHp: false,
    // The only mode with its own card table — the whole point of the mode.
    cardPool: 'overflow',
    manualSpawn: false,
    devOnly: false,
    heroPrey: false,
    heroHpScale: 0,
    swarmMultiplier: 0,
    contactDamageScale: 1,
    pilotSpeedScale: 1,
    runDurationSec: 0,
    accent: 'amber',
  },
  sandbox: {
    id: 'sandbox',
    name: '测试场',
    tag: 'SANDBOX',
    desc: '不自动刷怪。右侧面板自选敌人与数量、手动放置，可清场与开关无敌。仅开发环境可见。',
    pilotSlots: 1,
    wingSpacing: 0,
    spawnMultiplier: 1,
    maxAlive: 260,
    growthScale: 1,
    threatScale: 0,
    pooledHp: false,
    cardPool: 'standard',
    manualSpawn: true,
    devOnly: true,
    heroPrey: false,
    heroHpScale: 0,
    swarmMultiplier: 0,
    contactDamageScale: 1,
    pilotSpeedScale: 1,
    runDurationSec: 0,
    accent: 'emerald',
  },
  predator: {
    id: 'predator',
    name: '捕食者',
    tag: 'PREDATOR',
    desc: '你是怪潮的一员：操控一只怪，带着同族士兵，猎杀那台原本由你驾驶的机体。它由脚本操控，五分钟之内把它咬死。',
    pilotSlots: 1,
    wingSpacing: 0,
    spawnMultiplier: 1,
    maxAlive: 260,
    growthScale: 1,
    threatScale: 0,
    pooledHp: false,
    cardPool: 'standard',
    manualSpawn: false,
    devOnly: false,
    heroPrey: true,
    heroHpScale: 12,
    swarmMultiplier: 1.5,
    contactDamageScale: 2.5,
    pilotSpeedScale: 2.4,
    runDurationSec: 300,
    accent: 'rose',
  },
};

/** Descriptor for a mode id; undefined falls back to the standard run. */
export function modeOf(mode?: GameMode): GameModeDef {
  return GAME_MODES[mode ?? 'standard'];
}

/**
 * The mode a pilot selection implies. An explicit pick from the title screen
 * always wins; without one, a second pilot links the run and a lone pilot flies
 * the standard run.
 */
export function modeForPilots(selected?: GameMode, twinPilotId?: CharacterId): GameMode {
  if (selected) return selected;
  return twinPilotId ? 'twin_link' : 'standard';
}

/**
 * Descriptor for whatever mode a live player object is flying.
 * Also usable on the stat snapshots the game-over screen shows.
 */
export function modeOfPlayer(player: Pick<Player, 'gameMode' | 'twinPilotId'>): GameModeDef {
  // A real pair always flies twin link.
  if (isPaired(player)) return GAME_MODES.twin_link;

  // Otherwise trust the mode the run recorded — that is the only way a solo
  // mode that is not `standard` (Overflow) can reach its own knobs. A recorded
  // `twin_link` without a partner is a link request that never linked, which
  // createPlayer already downgrades, so it falls back to standard here too.
  const recorded = player.gameMode;
  if (recorded && recorded !== 'twin_link') return GAME_MODES[recorded];
  return GAME_MODES.standard;
}

/** True when two vessels are actually flying linked, not merely requested. */
export function isPaired(player: Pick<Player, 'gameMode' | 'twinPilotId'>): boolean {
  return player.gameMode === 'twin_link' && !!player.twinPilotId;
}

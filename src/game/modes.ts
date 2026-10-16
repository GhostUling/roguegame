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
  /** Max HP is the sum of both pilots' chassis HP. */
  pooledHp: boolean;
  /** UI hue token; the screens map it to Tailwind classes. */
  accent: 'cyan' | 'fuchsia';
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
    pooledHp: false,
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
    pooledHp: true,
    accent: 'fuchsia',
  },
};

/** Descriptor for a mode id; undefined falls back to the standard run. */
export function modeOf(mode?: GameMode): GameModeDef {
  return GAME_MODES[mode ?? 'standard'];
}

/** The mode a pilot selection implies: picking a second vessel links the run. */
export function modeForPilots(twinPilotId?: CharacterId): GameMode {
  return twinPilotId ? 'twin_link' : 'standard';
}

/**
 * Descriptor for whatever mode a live player object is flying.
 * Also usable on the stat snapshots the game-over screen shows.
 */
export function modeOfPlayer(player: Pick<Player, 'gameMode' | 'twinPilotId'>): GameModeDef {
  return GAME_MODES[isPaired(player) ? 'twin_link' : 'standard'];
}

/** True when two vessels are actually flying linked, not merely requested. */
export function isPaired(player: Pick<Player, 'gameMode' | 'twinPilotId'>): boolean {
  return player.gameMode === 'twin_link' && !!player.twinPilotId;
}

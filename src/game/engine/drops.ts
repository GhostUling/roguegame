import { Enemy, Player } from '../core/types';

/**
 * What a kill is worth and what it leaves behind: score, gem burst, the XP
 * curve and how hard the pickup pulls.
 *
 * Pure numbers only — the loop still owns spawning Gem objects, merging past
 * the cap, and opening the level-up hand.
 */

/** Concurrent drop cap; past this the oldest gem is folded into the next one. */
export const GEM_CAP = 90;

export function killScore(enemy: Pick<Enemy, 'isBoss' | 'maxHp'>): number {
  return enemy.isBoss ? 1500 : Math.round(enemy.maxHp * 2);
}

export interface GemDrop {
  count: number;
  value: number;
  radius: number;
  color: string;
  /** Maximum scatter offset from the corpse, in px. */
  scatter: number;
}

const BOSS_DROP: GemDrop = {
  count: 6,
  value: 5,
  radius: 7,
  color: '#00e5ff',
  scatter: 30,
};

/** How many gems a kill drops and what each is worth. */
export function gemDropFor(enemy: Pick<Enemy, 'isBoss' | 'expValue'>): GemDrop {
  if (enemy.isBoss) return BOSS_DROP;
  return { count: 1, value: enemy.expValue, radius: 5, color: '#00ffaa', scatter: 8 };
}

/**
 * XP required after reaching `level`. The opening bar (level 1) is 18 and is
 * set by createPlayer; this curve only runs from level 2 onward.
 */
export function nextLevelXp(level: number): number {
  return Math.floor(20 * Math.pow(1.28, level - 1));
}

/** Banks one gem and reports whether it filled the bar. */
export function bankGem(player: Pick<Player, 'xp' | 'nextLevelXp'>, value: number): boolean {
  player.xp += value;
  return player.xp >= player.nextLevelXp;
}

/** Consumes the filled bar and sets the requirement for the next level. */
export function advanceLevel(player: Pick<Player, 'level' | 'xp' | 'nextLevelXp'>): void {
  player.level++;
  player.xp -= player.nextLevelXp;
  player.nextLevelXp = nextLevelXp(player.level);
}

/** How fast a gem streams toward the hull at a given distance. */
export function gemPullSpeed(dist: number, magnetRadius: number, pullScale: number): number {
  return Math.min(18, 5 + (1 - dist / (magnetRadius + 100)) * 14) * pullScale;
}

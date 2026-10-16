import React from 'react';
import { Player } from '../game/types';
import { getCharacterDef } from '../game/characters';
import { getPilotWeaponStats } from '../game/pilots';
import { isPaired } from '../game/modes';
import {
  Volume2,
  VolumeX,
  Pause,
  Skull,
  Clock,
  Zap,
  Shield,
  Sparkles,
  Users,
  Keyboard,
  MousePointer2,
} from 'lucide-react';

const SPEED_OPTIONS = [0.5, 1, 2, 3];

interface HUDProps {
  player: Player;
  timeSeconds: number;
  bossWarning: boolean;
  isMuted: boolean;
  timeScale: number;
  controlMode: 'keys' | 'mouse';
  onToggleMute: () => void;
  onPause: () => void;
  onTriggerSkill: () => void;
  onChangeTimeScale: (scale: number) => void;
  onToggleControlMode: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  player,
  timeSeconds,
  bossWarning,
  isMuted,
  timeScale,
  controlMode,
  onToggleMute,
  onPause,
  onTriggerSkill,
  onChangeTimeScale,
  onToggleControlMode,
}) => {
  const char = getCharacterDef(player.characterId);

  const twinId = isPaired(player) ? player.twinPilotId : undefined;
  const twinDef = twinId ? getCharacterDef(twinId) : null;
  const twinStats = twinId ? getPilotWeaponStats(player, 1) : null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const xpProgress = Math.min(100, Math.max(0, (player.xp / player.nextLevelXp) * 100));
  const hpProgress = Math.min(100, Math.max(0, (player.hp / player.maxHp) * 100));

  // Skill states
  const isSkillReady = player.skillCooldown <= 0 && !player.isSkillActive;
  const cdProgress = player.skillMaxCooldown > 0
    ? (player.skillCooldown / player.skillMaxCooldown) * 100
    : 0;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10">
      {/* Top Bar: XP, Timer, Stats, Controls */}
      <div className="flex flex-col gap-2 w-full max-w-4xl mx-auto">
        {/* Full-width Top XP Bar */}
        <div className="w-full relative flex items-center gap-3">
          <div className="glass-panel px-3 py-1 rounded-md text-xs font-bold text-cyan-300 font-mono-numbers shrink-0 border border-cyan-500/30">
            LV.{player.level}
          </div>

          {twinDef && (
            <div className="glass-panel px-2.5 py-1 rounded-md text-[11px] font-bold font-mono-numbers shrink-0 border border-fuchsia-500/40 flex items-center gap-1.5">
              <Users size={12} className="text-fuchsia-300" />
              <span className="text-fuchsia-300">双子共鸣</span>
              <span style={{ color: char.color }}>{char.nameZh}</span>
              <span className="text-slate-500">+</span>
              <span style={{ color: twinDef.color }}>{twinDef.nameZh}</span>
            </div>
          )}

          <div className="relative flex-1 h-3.5 bg-slate-900/90 rounded-full overflow-hidden border border-slate-700/60 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-150 rounded-full shadow-[0_0_12px_rgba(0,255,204,0.6)]"
              style={{ width: `${xpProgress}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono-numbers font-medium text-slate-200 tracking-wider">
              {player.xp} / {player.nextLevelXp} XP
            </div>
          </div>

          {/* Quick controls */}
          <div className="pointer-events-auto flex items-center gap-1.5 shrink-0">
            <div className="flex items-center h-[34px] rounded-lg bg-slate-900/80 border border-slate-700/60 overflow-hidden">
              <span className="px-1.5 text-[10px] font-mono-numbers text-slate-500">速度</span>
              {SPEED_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => onChangeTimeScale(s)}
                  className={`h-full px-1.5 text-[10px] font-mono-numbers border-l border-slate-800 transition-colors cursor-pointer ${
                    s === timeScale
                      ? 'bg-cyan-500/25 text-cyan-200 font-bold'
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  {s}×
                </button>
              ))}
            </div>
            <button
              onClick={onToggleControlMode}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                controlMode === 'mouse'
                  ? 'bg-cyan-950/70 border-cyan-500/60 text-cyan-300'
                  : 'bg-slate-900/80 border-slate-700/60 text-slate-300 hover:text-cyan-400'
              }`}
              title={
                controlMode === 'mouse'
                  ? '当前: 鼠标操控 (机体追随光标) — 点击切回键盘'
                  : '当前: 键盘/摇杆操控 — 点击切换为鼠标追随'
              }
            >
              {controlMode === 'mouse' ? <MousePointer2 size={16} /> : <Keyboard size={16} />}
            </button>
            <button
              onClick={onToggleMute}
              className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-700/60 transition-colors cursor-pointer"
              title={isMuted ? '取消静音' : '静音'}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <button
              onClick={onPause}
              className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-700/60 transition-colors cursor-pointer"
              title="暂停游戏"
            >
              <Pause size={16} />
            </button>
          </div>
        </div>

        {/* Status Dashboard Row */}
        <div className="flex items-center justify-between mt-1">
          {/* Health Bar */}
          <div className="w-52 sm:w-72 flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs font-mono-numbers">
              <span className="flex items-center gap-1 text-rose-400 font-medium">
                <Shield size={13} /> HP
                {twinDef && (
                  <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] text-fuchsia-300 bg-fuchsia-950/70 border border-fuchsia-500/40">
                    双机共享
                  </span>
                )}
                {player.hp < player.maxHp ? (
                  (player.timeSinceLastDamage || 0) >= 3.0 ? (
                    <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 animate-pulse">
                      脱战自愈 +{(player.shieldRegenRate).toFixed(1)}/s
                    </span>
                  ) : (
                    <span className="ml-1 text-[10px] text-slate-500 font-normal">
                      自愈冷却 {(Math.max(0, 3.0 - (player.timeSinceLastDamage || 0))).toFixed(1)}s
                    </span>
                  )
                ) : null}
              </span>
              <span className="text-slate-300">
                {Math.ceil(player.hp)} / {player.maxHp}
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-900/90 rounded-full overflow-hidden border border-rose-900/40">
              <div
                className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-150 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                style={{ width: `${hpProgress}%` }}
              />
            </div>
          </div>

          {/* Center Run Timer */}
          <div className="flex items-center gap-4 glass-panel px-4 py-1.5 rounded-lg border border-slate-700/50">
            <div className="flex items-center gap-1.5 text-slate-200 font-mono-numbers text-sm font-semibold">
              <Clock size={15} className="text-cyan-400" />
              <span>{formatTime(timeSeconds)}</span>
            </div>
            <span className="text-slate-600">·</span>
            <div className="flex items-center gap-1.5 text-slate-200 font-mono-numbers text-sm font-semibold">
              <Skull size={15} className="text-rose-400" />
              <span>{player.kills}</span>
            </div>
            <span className="text-slate-600">·</span>
            <div className="flex items-center gap-1.5 text-amber-300 font-mono-numbers text-sm font-semibold">
              <Sparkles size={15} className="text-amber-400" />
              <span>{player.score.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Boss Incoming Warning Banner */}
      {bossWarning && (
        <div className="mx-auto my-auto animate-bounce text-center py-2 px-6 rounded-lg bg-rose-950/80 border border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.7)] backdrop-blur-md">
          <div className="text-rose-400 text-xs font-bold uppercase tracking-widest">WARNING // 异常高能反应</div>
          <div className="text-white text-lg font-black tracking-wider flex items-center justify-center gap-2">
            <span>⚠️</span> 星型首领即将跃迁抵达 <span>⚠️</span>
          </div>
        </div>
      )}

      {/* Bottom Area: Weapon Stats & Active Skill Trigger */}
      <div className="flex items-end justify-between w-full max-w-4xl mx-auto gap-4">
        {/* Active Weapon Passives */}
        <div className="glass-panel px-3 py-2 rounded-lg border border-slate-800/80 flex items-center gap-3 font-mono-numbers text-xs text-slate-400 flex-wrap">
          {twinStats && (
            <>
              <div className="flex items-center gap-1 font-semibold" style={{ color: twinDef!.color }}>
                <span>{twinDef!.nameZh.slice(0, 1)}·副炮</span>
                <span className="text-slate-400 font-normal">
                  间隔 {twinStats.fireRate}ms · 伤害 {twinStats.bulletDamage} · 弹道 {twinStats.bulletCount}
                </span>
              </div>
              <span className="text-slate-700">|</span>
            </>
          )}
          <div className="flex items-center gap-1 text-slate-300 font-semibold">
            {twinStats && <span>{char.nameZh.slice(0, 1)}·主炮</span>}
            <Zap size={13} className="text-amber-400" />
            <span>间隔: {Math.round(player.fireRate)}ms</span>
          </div>
          <span className="text-slate-700">|</span>
          <div>
            <span>伤害: {Math.round(player.bulletDamage)}</span>
          </div>
          <span className="text-slate-700">|</span>
          <div>
            <span>弹道: {player.bulletCount} 发</span>
          </div>
          <span className="text-slate-700">|</span>
          <div>
            <span>贯穿: {player.bulletPierce} 次</span>
          </div>
          <span className="text-slate-700">|</span>
          <div>
            <span className="text-amber-300">
              暴击: {Math.round(player.critChance * 100)}% ({player.critMultiplier.toFixed(1)}x)
            </span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="text-emerald-400">
            <span>脱战自愈: {player.shieldRegenRate.toFixed(1)}/s</span>
          </div>
          {player.orbitSatellites > 0 && (
            <>
              <span className="text-slate-700">|</span>
              <div className="text-purple-300">
                <span>棱镜: {player.orbitSatellites} 枚</span>
              </div>
            </>
          )}
          {player.drones && player.drones.length > 0 && (
            <>
              <span className="text-slate-700">|</span>
              <div className="text-sky-300 flex items-center gap-1 font-semibold">
                <span>战机: {player.drones.length} 架</span>
              </div>
            </>
          )}
          {player.naniteShieldActive && (
            <>
              <span className="text-slate-700">|</span>
              <div className="text-cyan-300 font-bold flex items-center gap-0.5">
                <span>[硬光盾 就绪]</span>
              </div>
            </>
          )}
        </div>

        {/* Right Active Skill Button with CD Indicator */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={onTriggerSkill}
            disabled={!isSkillReady}
            data-interactive="true"
            className={`relative group px-4 py-2.5 rounded-xl border backdrop-blur-md transition-all duration-150 flex items-center gap-3 cursor-pointer ${
              isSkillReady
                ? 'bg-slate-900/90 shadow-[0_0_20px_rgba(0,255,204,0.3)] hover:scale-105 active:scale-95'
                : player.isSkillActive
                ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.5)] animate-pulse'
                : 'bg-slate-950/80 border-slate-800/80 opacity-80 cursor-not-allowed'
            }`}
            style={{
              borderColor: isSkillReady ? char.color : player.isSkillActive ? '#22d3ee' : undefined,
            }}
          >
            {/* CD Sweep Overlay */}
            {!isSkillReady && !player.isSkillActive && (
              <div
                className="absolute inset-0 bg-slate-950/70 rounded-xl overflow-hidden pointer-events-none"
                style={{
                  clipPath: `polygon(0 0, 100% 0, 100% ${cdProgress}%, 0 ${cdProgress}%)`,
                }}
              />
            )}

            {/* Skill Icon */}
            <div
              className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 relative z-10"
              style={{ color: char.color }}
            >
              <Zap size={18} />
            </div>

            {/* Skill Labels */}
            <div className="text-left relative z-10">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white tracking-tight">
                  {char.activeSkill.nameZh}
                  {twinDef && (
                    <span className="text-slate-400 font-normal">
                      {' + '}
                      <span style={{ color: twinDef.color }}>{twinDef.activeSkill.nameZh}</span>
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-mono-numbers px-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {twinDef ? '齐发' : 'SPACE'}
                </span>
              </div>
              <div className="text-[11px] font-mono-numbers">
                {player.isSkillActive ? (
                  <span className="text-cyan-300 font-bold">
                    激活中 ({player.skillActiveTimer.toFixed(1)}s)
                  </span>
                ) : isSkillReady ? (
                  <span className="text-emerald-400 font-semibold">就绪 (READY)</span>
                ) : (
                  <span className="text-slate-400">
                    冷却 {player.skillCooldown.toFixed(1)}s
                  </span>
                )}
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

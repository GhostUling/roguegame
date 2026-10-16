import React, { useState } from 'react';
import { Player } from '../game/types';
import { sound } from '../game/audio';
import { findUpgrade } from '../game/upgradePools';
import { getCharacterDef } from '../game/characters';
import { isPaired } from '../game/modes';
import {
  interceptorInterval,
  interceptorShotDamage,
  missileShotDamage,
  railgunShotDamage,
} from '../game/drones';
import {
  Play,
  RotateCcw,
  Home,
  Volume2,
  VolumeX,
  Shield,
  Crosshair,
  Zap,
  Bot,
  Activity,
  Layers,
  Sparkles,
  Gauge,
  Heart,
  ChevronRight,
  Flame,
  Bookmark,
  RefreshCw,
} from 'lucide-react';

interface PauseModalProps {
  player: Player;
  upgradeLevels: Record<string, number>;
  gameTime?: number;
  isMuted: boolean;
  onToggleMute: () => void;
  /** Test switch: level-up rerolls stop consuming the run's reroll count. */
  infiniteReroll: boolean;
  onToggleInfiniteReroll: () => void;
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  onOpenCodex?: (initialKey?: string) => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  player,
  upgradeLevels,
  gameTime = 0,
  isMuted,
  onToggleMute,
  infiniteReroll,
  onToggleInfiniteReroll,
  onResume,
  onRestart,
  onHome,
  onOpenCodex,
}) => {
  const [activeTab, setActiveTab] = useState<'upgrades' | 'stats'>('upgrades');

  const charDef = getCharacterDef(player.characterId);
  const twinDef = isPaired(player) ? getCharacterDef(player.twinPilotId!) : null;
  const currentUpgrades = player.upgradeLevels || upgradeLevels || {};
  const upgradeEntries = Object.entries(currentUpgrades).filter(([, lvl]) => lvl > 0);

  // Drone figures come from the same pure module the engine fires them with,
  // so this panel cannot drift away from the actual cadence and damage.
  const hasCarrier =
    player.characterId === 'epsilon_carrier' || twinDef?.id === 'epsilon_carrier';
  const baseDroneInterval = interceptorInterval(player, hasCarrier);
  const droneAttacksPerSec = (1000 / baseDroneInterval).toFixed(1);
  const droneShotDmg = interceptorShotDamage(player, hasCarrier);

  const mainAttacksPerSec = (1000 / Math.max(1, player.fireRate)).toFixed(1);

  const timeOutSec = (player.timeSinceLastDamage || 0).toFixed(1);
  const isOutOfCombat = (player.timeSinceLastDamage || 0) >= 3.0;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'ballistic':
        return {
          label: '弹道工程',
          border: 'border-cyan-500/40',
          bg: 'bg-cyan-950/40',
          badgeBg: 'bg-cyan-500/15',
          text: 'text-cyan-300',
          icon: Crosshair,
        };
      case 'energy':
        return {
          label: '高维能量',
          border: 'border-purple-500/40',
          bg: 'bg-purple-950/40',
          badgeBg: 'bg-purple-500/15',
          text: 'text-purple-300',
          icon: Zap,
        };
      case 'defense':
        return {
          label: '机体防御',
          border: 'border-blue-500/40',
          bg: 'bg-blue-950/40',
          badgeBg: 'bg-blue-500/15',
          text: 'text-blue-300',
          icon: Shield,
        };
      case 'summon':
        return {
          label: '自律蜂群',
          border: 'border-emerald-500/40',
          bg: 'bg-emerald-950/40',
          badgeBg: 'bg-emerald-500/15',
          text: 'text-emerald-300',
          icon: Bot,
        };
      case 'tactical':
        return {
          label: '高危战术',
          border: 'border-amber-500/40',
          bg: 'bg-amber-950/40',
          badgeBg: 'bg-amber-500/15',
          text: 'text-amber-300',
          icon: Flame,
        };
      default:
        return {
          label: '通用协议',
          border: 'border-slate-500/40',
          bg: 'bg-slate-950/40',
          badgeBg: 'bg-slate-500/15',
          text: 'text-slate-300',
          icon: Sparkles,
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shadow-lg"
              style={{
                backgroundColor: `${charDef.color}20`,
                borderColor: `${charDef.color}60`,
                borderWidth: '1px',
                color: charDef.color,
              }}
            >
              {charDef.nameZh.slice(0, 1)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono tracking-widest text-cyan-400 font-bold uppercase">
                  PAUSED
                </span>
                <span className="text-slate-600">/</span>
                <span className="text-sm font-bold text-white">{charDef.nameZh}</span>
                {twinDef && (
                  <>
                    <span className="text-slate-500">+</span>
                    <span className="text-sm font-bold" style={{ color: twinDef.color }}>
                      {twinDef.nameZh}
                    </span>
                    <span className="text-[10px] font-mono text-fuchsia-300 px-1.5 py-0.5 rounded bg-fuchsia-950/60 border border-fuchsia-800/40">
                      双子共鸣
                    </span>
                  </>
                )}
                <span className="text-xs font-mono text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
                  LV.{player.level}
                </span>
              </div>
              <p className="text-xs text-slate-400">{charDef.title}</p>
            </div>
          </div>

          {/* Quick HUD Metrics */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs font-mono">
            <div className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5">
              <Heart size={14} className="text-rose-400" />
              <span className="text-slate-400">生命</span>
              <span className="font-bold text-rose-300">
                {Math.ceil(player.hp)} / {player.maxHp}
              </span>
            </div>
            <div className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5">
              <Crosshair size={14} className="text-amber-400" />
              <span className="text-slate-400">击杀</span>
              <span className="font-bold text-amber-300">{player.kills}</span>
            </div>
            <div className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5">
              <Activity size={14} className="text-cyan-400" />
              <span className="text-slate-400">得分</span>
              <span className="font-bold text-cyan-300">{player.score.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-800 bg-slate-900/60 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('upgrades')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'upgrades'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers size={15} />
            <span>已装载强化列表 ({upgradeEntries.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'stats'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gauge size={15} />
            <span>实时机体数值面板 (含无人机与攻速)</span>
          </button>

          {onOpenCodex && (
            <button
              onClick={() => {
                sound.playUpgrade();
                onOpenCodex();
              }}
              className="ml-auto mb-1.5 px-3 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-[0_0_12px_rgba(0,255,204,0.15)]"
              title="查阅全 25 项科技强化阶梯与流派羁绊"
            >
              <Bookmark size={13} className="text-cyan-400" />
              <span>科技全维图鉴 (CODEX)</span>
            </button>
          )}
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeTab === 'upgrades' ? (
            <div>
              {upgradeEntries.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-800/60 flex items-center justify-center text-slate-500">
                    <Layers size={22} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-300">尚未选择任何升级强化</h4>
                  <p className="text-xs text-slate-500">击败敌人拾取晶体升级后，将在此展示已获得的全部强化与效果加成</p>
                  {onOpenCodex && (
                    <button
                      onClick={() => onOpenCodex()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-bold hover:bg-cyan-900/60 transition-colors"
                    >
                      <Bookmark size={14} />
                      <span>直接浏览全维科技图鉴</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {upgradeEntries.map(([key, level]) => {
                    const def = findUpgrade(key);
                    if (!def) return null;
                    const theme = getCategoryTheme(def.category);
                    const CategoryIcon = theme.icon;
                    const isMax = level >= def.maxLevel;

                    return (
                      <div
                        key={key}
                        className={`p-3.5 rounded-xl border ${theme.border} ${theme.bg} transition-all space-y-2.5 flex flex-col justify-between`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${theme.badgeBg} ${theme.text} flex items-center gap-1`}
                              >
                                <CategoryIcon size={12} />
                                {theme.label}
                              </span>
                              <span className="text-sm font-bold text-white">{def.nameZh}</span>
                            </div>

                            {/* Level Badge */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-mono font-bold text-slate-300">
                                Lv.{level} / {def.maxLevel}
                              </span>
                              {isMax && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                                  MAX
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Level Progress Bar */}
                          <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isMax ? 'bg-amber-400' : 'bg-cyan-400'
                              }`}
                              style={{ width: `${Math.min(100, (level / def.maxLevel) * 100)}%` }}
                            />
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed">{def.desc}</p>
                        </div>

                        {/* Current Level Effect Diff & Codex Jump */}
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono gap-2">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="text-slate-400 shrink-0">效果:</span>
                            <span className="text-cyan-300 font-bold truncate">
                              {def.statDiffText(player, level)}
                            </span>
                          </div>
                          {onOpenCodex && (
                            <button
                              onClick={() => {
                                sound.playUpgrade();
                                onOpenCodex(key);
                              }}
                              className="text-[10px] text-cyan-400 hover:text-cyan-200 flex items-center gap-0.5 shrink-0 transition-colors cursor-pointer"
                              title="在科技图鉴中查看此模块全等级与羁绊"
                            >
                              <span>图鉴</span>
                              <ChevronRight size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Detailed Real-time Stats Panel */
            <div className="space-y-4">
              {/* 1. Main Weapon & Ballistics */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-cyan-500/30 space-y-3">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                  <Crosshair size={14} />
                  <span>主武器与弹道火力 (Main Ballistics)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 text-[11px]">基础子弹伤害</span>
                    <div className="text-sm font-bold text-white">{player.bulletDamage} 点</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 text-[11px]">主炮攻击频率</span>
                    <div className="text-sm font-bold text-cyan-300">
                      {mainAttacksPerSec} 次/秒{' '}
                      <span className="text-[10px] text-slate-500">({player.fireRate}ms)</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 text-[11px]">扇面齐射弹道</span>
                    <div className="text-sm font-bold text-white">x{player.bulletCount} 发</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 text-[11px]">弹道穿透次数</span>
                    <div className="text-sm font-bold text-white">{player.bulletPierce} 次穿透</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 text-[11px]">致命暴击概率</span>
                    <div className="text-sm font-bold text-amber-300">
                      {Math.round(player.critChance * 100)}%
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 text-[11px]">暴击伤害倍率</span>
                    <div className="text-sm font-bold text-amber-400">
                      {player.critMultiplier.toFixed(1)}x{' '}
                      <span className="text-[10px] text-slate-500">
                        ({Math.round(player.bulletDamage * player.critMultiplier)}点)
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 text-[11px]">墙壁反射弹射</span>
                    <div className="text-sm font-bold text-white">
                      {player.bouncingBullets || 0} 次反弹
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 text-[11px]">子弹飞行航速</span>
                    <div className="text-sm font-bold text-white">{player.bulletSpeed} px/f</div>
                  </div>
                </div>

                {/* Main Weapon Special Affixes */}
                <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-mono">
                  {player.cryoSlow && (
                    <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                      ❄️ 绝对零度 (命中减速 35% + 20% 易伤)
                    </span>
                  )}
                  {player.chainLightning && (
                    <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-300">
                      ⚡ 特斯拉电弧 (暴击传导 3 个目标 60% 伤害)
                    </span>
                  )}
                  {player.clusterBombs && (
                    <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300">
                      💥 集束爆轰 (击中爆裂 3 颗次级炸弹 40% 伤害)
                    </span>
                  )}
                </div>
              </div>

              {/* 2. Autonomous Fleet & Drones */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                    <Bot size={14} />
                    <span>自律蜂群与无人机编队 (Drone Fleet & Summons)</span>
                  </div>
                  {player.droneOverclock && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold font-mono">
                      🔥 母舰蜂群超频中 (+40%攻速 / 20%易伤)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 text-[11px]">拦截无人机数量</span>
                    <div className="text-sm font-bold text-emerald-300">
                      {player.droneCount || 0} 架伴飞
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 text-[11px]">无人机攻击频率</span>
                    <div className="text-sm font-bold text-emerald-300">
                      {player.droneCount > 0 ? (
                        <>
                          {droneAttacksPerSec} 次/秒{' '}
                          <span className="text-[10px] text-slate-500">
                            ({baseDroneInterval}ms)
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-500">未部署</span>
                      )}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 text-[11px]">无人机单发等离子</span>
                    <div className="text-sm font-bold text-emerald-300">
                      {player.droneCount > 0 ? `${droneShotDmg} 点` : <span className="text-slate-500">未部署</span>}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 text-[11px]">环绕共振棱镜</span>
                    <div className="text-sm font-bold text-purple-300">
                      {player.orbitSatellites || 0} 枚近战绞杀
                    </div>
                  </div>
                </div>

                {/* Drone Modules & Equipment State */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                  <div
                    className={`p-2 rounded-lg border flex items-center justify-between ${
                      player.droneMissiles
                        ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200'
                        : 'border-slate-800 bg-slate-900/40 text-slate-500'
                    }`}
                  >
                    <span>🚀 蜂群微型制导飞弹</span>
                    <span className="font-mono font-bold text-[11px]">
                      {player.droneMissiles
                        ? `每 ${player.droneMissileInterval / 1000}s (伤 ${missileShotDamage(player, hasCarrier)})`
                        : '未解锁'}
                    </span>
                  </div>

                  <div
                    className={`p-2 rounded-lg border flex items-center justify-between ${
                      player.droneShield
                        ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200'
                        : 'border-slate-800 bg-slate-900/40 text-slate-500'
                    }`}
                  >
                    <span>🛡️ 护卫偏折力场机</span>
                    <span className="font-mono font-bold text-[11px]">
                      {player.droneShield
                        ? `偏折弹幕 +${Math.round(player.droneShieldReduction * 100)}%免伤`
                        : '未解锁'}
                    </span>
                  </div>

                  <div
                    className={`p-2 rounded-lg border flex items-center justify-between ${
                      player.droneRailgun
                        ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200'
                        : 'border-slate-800 bg-slate-900/40 text-slate-500'
                    }`}
                  >
                    <span>⚡ 重型轨道激光炮</span>
                    <span className="font-mono font-bold text-[11px]">
                      {player.droneRailgun
                        ? `贯穿 5 敌 (伤 ${railgunShotDamage(player, hasCarrier)})`
                        : '未解锁'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Defense, Survivability & Regeneration */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-blue-500/30 space-y-3">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
                  <Shield size={14} />
                  <span>防御机制与自愈系统 (Defense & Out-of-Combat Regen)</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 text-[11px]">机体耐久上限</span>
                    <div className="text-sm font-bold text-rose-300">{player.maxHp} HP</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 text-[11px]">脱战自愈速率</span>
                    <div className="text-sm font-bold text-emerald-300">
                      +{player.shieldRegenRate.toFixed(1)} HP/s
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 text-[11px]">自愈触发状态</span>
                    <div
                      className={`text-xs font-bold ${
                        isOutOfCombat ? 'text-emerald-300' : 'text-amber-400'
                      }`}
                    >
                      {isOutOfCombat ? `🟢 自愈中 (${timeOutSec}s)` : `⚠️ 受创 (${timeOutSec}s / 3.0s)`}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 text-[11px]">动力引擎移速</span>
                    <div className="text-sm font-bold text-cyan-300">{player.speed.toFixed(1)} px/s</div>
                  </div>
                </div>

                {/* Defensive Gadgets */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                  <div
                    className={`p-2 rounded-lg border flex items-center justify-between ${
                      player.naniteShield
                        ? 'border-blue-500/40 bg-blue-950/20 text-blue-200'
                        : 'border-slate-800 bg-slate-900/40 text-slate-500'
                    }`}
                  >
                    <span>🛡️ 纳米抵消坚盾</span>
                    <span className="font-mono font-bold text-[11px]">
                      {player.naniteShield
                        ? player.naniteShieldActive
                          ? '✅ 充能就绪 (抵消伤害)'
                          : `⏳ 充能中 (${player.naniteShieldTimer.toFixed(1)}s)`
                        : '未装载'}
                    </span>
                  </div>

                  <div
                    className={`p-2 rounded-lg border flex items-center justify-between ${
                      player.retaliationThorns
                        ? 'border-blue-500/40 bg-blue-950/20 text-blue-200'
                        : 'border-slate-800 bg-slate-900/40 text-slate-500'
                    }`}
                  >
                    <span>🦔 复仇荆棘反击</span>
                    <span className="font-mono font-bold text-[11px]">
                      {player.retaliationThorns ? '全向 8 发光刺' : '未装载'}
                    </span>
                  </div>

                  <div
                    className={`p-2 rounded-lg border flex items-center justify-between ${
                      player.repulsionField
                        ? 'border-blue-500/40 bg-blue-950/20 text-blue-200'
                        : 'border-slate-800 bg-slate-900/40 text-slate-500'
                    }`}
                  >
                    <span>🌊 空间排斥震波</span>
                    <span className="font-mono font-bold text-[11px]">
                      {player.repulsionField ? '每 6 秒强退 150px' : '未装载'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Tactical & Utility */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-amber-500/30 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <Flame size={14} />
                  <span>战术辅助与特殊协议 (Tactical Modules)</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 text-[11px]">晶体吸附引力场</span>
                    <div className="text-sm font-bold text-amber-300">
                      {Math.round(player.magnetRadius)} px
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 text-[11px]">重置刷新余量</span>
                    <div className="text-sm font-bold text-cyan-300">
                      {player.rerollCount || 0} 次
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 text-[11px]">终决处刑协议</span>
                    <div
                      className={`text-xs font-bold ${
                        player.executioner ? 'text-rose-400' : 'text-slate-500'
                      }`}
                    >
                      {player.executioner ? '低于 25% 血即死斩杀' : '未解锁'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 text-[11px]">次元全屏虹吸</span>
                    <div
                      className={`text-xs font-bold ${
                        player.gravitySiphon ? 'text-amber-300' : 'text-slate-500'
                      }`}
                    >
                      {player.gravitySiphon ? '升级吸附全图晶体' : '未解锁'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-mono hidden sm:block">
            按 <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">ESC</kbd> 或{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">P</kbd> 继续游戏
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onToggleMute}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              <span>{isMuted ? '开启音效' : '静音'}</span>
            </button>

            <button
              onClick={onToggleInfiniteReroll}
              title="测试用：开启后升级时重抽不再消耗剩余次数"
              className={`py-2.5 px-3 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer border ${
                infiniteReroll
                  ? 'bg-amber-500/15 border-amber-400/60 text-amber-300'
                  : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <RefreshCw size={15} />
              <span>无限刷新 {infiniteReroll ? '开' : '关'}</span>
            </button>

            <button
              onClick={() => {
                sound.playClick(false);
                onRestart();
              }}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw size={15} />
              <span>重新开始</span>
            </button>

            <button
              onClick={() => {
                sound.playClick(false);
                onHome();
              }}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Home size={15} />
              <span>返回主界面</span>
            </button>

            <button
              onClick={() => {
                sound.playClick(true);
                onResume();
              }}
              className="flex-1 sm:flex-initial py-2.5 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.35)] flex items-center justify-center gap-2 cursor-pointer ml-auto"
            >
              <Play size={16} />
              <span>继续行动</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect } from 'react';
import { UpgradeOption, Player } from '../game/types';
import { sound } from '../game/audio';
import {
  Zap,
  Shield,
  Crosshair,
  Magnet,
  FastForward,
  Disc,
  Radio,
  Flame,
  Sparkles,
  RefreshCw,
  Cpu,
  Layers,
  Snowflake,
  Activity,
  Compass,
  Bomb,
  Target,
  Skull,
} from 'lucide-react';

interface UpgradeModalProps {
  upgrades: UpgradeOption[];
  player: Player;
  onSelectUpgrade: (upgrade: UpgradeOption) => void;
  onReroll?: () => void;
  rerollsRemaining?: number;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  upgrades,
  player,
  onSelectUpgrade,
  onReroll,
  rerollsRemaining = 0,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1' && upgrades[0]) {
        handleChoose(upgrades[0]);
      } else if (e.key === '2' && upgrades[1]) {
        handleChoose(upgrades[1]);
      } else if (e.key === '3' && upgrades[2]) {
        handleChoose(upgrades[2]);
      } else if ((e.key === 'r' || e.key === 'R') && onReroll && rerollsRemaining > 0) {
        handleReroll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [upgrades, rerollsRemaining]);

  const handleChoose = (u: UpgradeOption) => {
    sound.playClick(true);
    onSelectUpgrade(u);
  };

  const handleReroll = () => {
    if (rerollsRemaining > 0 && onReroll) {
      sound.playReroll();
      onReroll();
    }
  };

  const getRarityConfig = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return {
          border: 'border-amber-400/80 shadow-[0_0_25px_rgba(251,191,36,0.25)]',
          badge: 'text-amber-300 bg-amber-950/60 border border-amber-500/40',
          title: 'text-amber-300',
          gradient: 'from-amber-500/10 to-transparent',
        };
      case 'epic':
        return {
          border: 'border-purple-400/80 shadow-[0_0_25px_rgba(192,132,252,0.25)]',
          badge: 'text-purple-300 bg-purple-950/60 border border-purple-500/40',
          title: 'text-purple-300',
          gradient: 'from-purple-500/10 to-transparent',
        };
      case 'rare':
        return {
          border: 'border-cyan-400/80 shadow-[0_0_25px_rgba(34,211,238,0.25)]',
          badge: 'text-cyan-300 bg-cyan-950/60 border border-cyan-500/40',
          title: 'text-cyan-300',
          gradient: 'from-cyan-500/10 to-transparent',
        };
      default:
        return {
          border: 'border-slate-600/80 hover:border-slate-400/80',
          badge: 'text-slate-300 bg-slate-800/60 border border-slate-600/40',
          title: 'text-slate-100',
          gradient: 'from-slate-700/10 to-transparent',
        };
    }
  };

  const getCategoryBadge = (category?: string) => {
    switch (category) {
      case 'summon':
        return { text: '无人机矩阵', color: 'text-sky-300 bg-sky-950/60 border-sky-500/40' };
      case 'ballistic':
        return { text: '弹道工程', color: 'text-amber-300 bg-amber-950/60 border-amber-500/40' };
      case 'energy':
        return { text: '共鸣能量', color: 'text-purple-300 bg-purple-950/60 border-purple-500/40' };
      case 'defense':
        return { text: '生存力场', color: 'text-emerald-300 bg-emerald-950/60 border-emerald-500/40' };
      case 'tactical':
        return { text: '战术特化', color: 'text-rose-300 bg-rose-950/60 border-rose-500/40' };
      default:
        return { text: '科技跃迁', color: 'text-slate-300 bg-slate-800/60 border-slate-600/40' };
    }
  };

  const getUpgradeIcon = (key: string) => {
    switch (key) {
      case 'fire_rate':
        return <Zap className="text-amber-400" size={26} />;
      case 'multi_shot':
        return <Crosshair className="text-cyan-400" size={26} />;
      case 'damage':
        return <Flame className="text-rose-400" size={26} />;
      case 'magnet':
        return <Magnet className="text-emerald-400" size={26} />;
      case 'shield':
        return <Shield className="text-blue-400" size={26} />;
      case 'pierce':
        return <FastForward className="text-indigo-400" size={26} />;
      case 'speed':
        return <Sparkles className="text-yellow-400" size={26} />;
      case 'bouncing_blades':
        return <Layers className="text-cyan-300" size={26} />;
      case 'cluster_bombs':
        return <Bomb className="text-amber-400" size={26} />;
      case 'cryo_freeze':
        return <Snowflake className="text-cyan-200" size={26} />;
      case 'chain_lightning':
        return <Activity className="text-blue-300" size={26} />;
      case 'orbit_satellite':
        return <Disc className="text-purple-400" size={26} />;
      case 'nova_pulse':
        return <Radio className="text-teal-400" size={26} />;
      case 'repulsion_field':
        return <Compass className="text-sky-400" size={26} />;
      case 'retaliation_thorns':
        return <Target className="text-rose-400" size={26} />;
      case 'nanite_aegis':
        return <Shield className="text-cyan-400" size={26} />;
      case 'summon_drone':
      case 'drone_missiles':
      case 'drone_shield':
      case 'summon_railgun':
      case 'drone_overclock':
        return <Cpu className="text-sky-300" size={26} />;
      case 'executioner':
      case 'glass_cannon':
        return <Skull className="text-rose-500" size={26} />;
      default:
        return <Zap className="text-cyan-400" size={26} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-4xl flex flex-col items-center gap-5">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="text-xs uppercase font-mono-numbers tracking-widest text-cyan-400 font-semibold">
            GEOMETRIC EVOLUTION // 突破跃迁
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center gap-3">
            <span className="text-cyan-400">⚡</span>
            <span>选择核心构筑强化</span>
            <span className="text-cyan-400">⚡</span>
          </h2>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
            <span>按数字键 <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono-numbers">1</kbd>、<kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono-numbers">2</kbd>、<kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono-numbers">3</kbd> 选择</span>
            {onReroll && (
              <button
                onClick={handleReroll}
                disabled={rerollsRemaining <= 0}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border font-mono-numbers text-xs font-semibold transition-all cursor-pointer ${
                  rerollsRemaining > 0
                    ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-cyan-500/40 hover:scale-105 active:scale-95'
                    : 'bg-slate-900/40 text-slate-600 border-slate-800 cursor-not-allowed'
                }`}
              >
                <RefreshCw size={12} className={rerollsRemaining > 0 ? 'text-cyan-400' : ''} />
                <span>矩阵重抽 [R] (剩余 {rerollsRemaining})</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Upgrade Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {upgrades.map((u, idx) => {
            const config = getRarityConfig(u.rarity);
            const catBadge = getCategoryBadge(u.category);
            return (
              <button
                key={u.id}
                onClick={() => handleChoose(u)}
                onMouseEnter={() => sound.playClick(false)}
                className={`group relative text-left p-5 rounded-xl bg-slate-900/90 border backdrop-blur-xl transition-all duration-200 hover:-translate-y-1.5 hover:shadow-2xl flex flex-col justify-between overflow-hidden cursor-pointer ${config.border}`}
              >
                {/* Background ambient gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-b ${config.gradient} pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity`}
                />

                <div className="relative z-10 space-y-3.5">
                  {/* Top card metadata */}
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 group-hover:scale-110 transition-transform">
                      {getUpgradeIcon(u.key)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-mono-numbers px-2 py-0.5 rounded border font-semibold ${catBadge.color}`}>
                        {catBadge.text}
                      </span>
                      <span className="text-xs font-mono-numbers font-bold text-slate-400 px-2 py-0.5 bg-slate-800 rounded">
                        [{idx + 1}]
                      </span>
                    </div>
                  </div>

                  {/* Title & Level */}
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className={`text-lg font-bold tracking-tight ${config.title}`}>
                        {u.nameZh}
                      </h3>
                      <span className="text-xs font-mono-numbers text-slate-400">
                        Lv.{u.level}/{u.maxLevel}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono-numbers mt-0.5">
                      {u.name}
                    </div>

                    {/* Level Progress Pips */}
                    <div className="flex items-center gap-1 mt-1.5">
                      {Array.from({ length: u.maxLevel }).map((_, pIdx) => (
                        <div
                          key={pIdx}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            pIdx < u.level ? 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]' : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-300 leading-relaxed min-h-[38px]">
                    {u.desc}
                  </p>
                </div>

                {/* Stat Diff preview */}
                <div className="relative z-10 mt-3 pt-3 border-t border-slate-800">
                  <div className="text-[11px] font-mono-numbers font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-1.5 rounded border border-emerald-900/40 truncate">
                    ▲ {u.statDiffText(player)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  LabUpgrades,
  getStoredLab,
  saveStoredLab,
  getStoredShards,
  saveStoredShards,
  LAB_CONFIGS,
  getUpgradeCost,
} from '../game/lab';
import { sound } from '../game/audio';
import { Flame, Shield, Zap, Clock, Magnet, RotateCcw, X, Sparkles } from 'lucide-react';

interface LabModalProps {
  onClose: () => void;
}

export const LabModal: React.FC<LabModalProps> = ({ onClose }) => {
  const [lab, setLab] = useState<LabUpgrades>(() => getStoredLab());
  const [shards, setShards] = useState<number>(() => getStoredShards());

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame':
        return <Flame className="text-rose-400" size={20} />;
      case 'Shield':
        return <Shield className="text-cyan-400" size={20} />;
      case 'Zap':
        return <Zap className="text-amber-400" size={20} />;
      case 'Clock':
        return <Clock className="text-purple-400" size={20} />;
      case 'Magnet':
        return <Magnet className="text-emerald-400" size={20} />;
      case 'RotateCcw':
        return <RotateCcw className="text-yellow-400" size={20} />;
      default:
        return <Sparkles className="text-cyan-400" size={20} />;
    }
  };

  const handleUpgrade = (cfg: typeof LAB_CONFIGS[0]) => {
    const curLevel = lab[cfg.key];
    if (curLevel >= cfg.maxLevel) return;
    const cost = getUpgradeCost(cfg, curLevel);
    if (shards < cost) {
      sound.playClick(false);
      return;
    }

    const nextShards = shards - cost;
    const nextLab = { ...lab, [cfg.key]: curLevel + 1 };

    setShards(nextShards);
    setLab(nextLab);
    saveStoredShards(nextShards);
    saveStoredLab(nextLab);
    sound.playUpgrade();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
      <div className="w-full max-w-2xl p-6 rounded-2xl bg-slate-900/95 border border-cyan-500/30 shadow-[0_0_35px_rgba(0,255,204,0.15)] space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="text-xs font-mono-numbers text-cyan-400 uppercase tracking-widest font-semibold">
              METAPROGRESSION LAB // 局外永久科技树
            </div>
            <h2 className="text-2xl font-black text-white mt-0.5">
              超维工坊
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Shards Currency Counter */}
            <div className="glass-panel px-4 py-2 rounded-xl border border-cyan-400/40 flex items-center gap-2 font-mono-numbers text-sm font-bold text-cyan-300">
              <span className="text-base">💎</span>
              <span>{shards.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 font-normal">碎片</span>
            </div>

            <button
              onClick={() => {
                sound.playClick(false);
                onClose();
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Upgrades Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[60vh] overflow-y-auto pr-1">
          {LAB_CONFIGS.map((cfg) => {
            const level = lab[cfg.key];
            const isMax = level >= cfg.maxLevel;
            const cost = getUpgradeCost(cfg, level);
            const canAfford = shards >= cost && !isMax;

            return (
              <div
                key={cfg.key}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between gap-3 group hover:border-slate-700 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                        {getIcon(cfg.iconName)}
                      </div>
                      <span className="font-bold text-sm text-slate-100">{cfg.nameZh}</span>
                    </div>

                    <span className="text-xs font-mono-numbers font-semibold text-slate-400">
                      Lv.{level}/{cfg.maxLevel}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed min-h-[30px]">
                    {cfg.desc}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-900">
                  <div className="flex items-center justify-between text-xs font-mono-numbers">
                    <span className="text-emerald-400 font-medium">
                      {cfg.effectText(level)}
                    </span>
                    {!isMax && (
                      <span className="text-slate-500 text-[10px]">
                        下级: {cfg.effectText(level + 1)}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleUpgrade(cfg)}
                    disabled={!canAfford}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold font-mono-numbers flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isMax
                        ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-800'
                        : canAfford
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                        : 'bg-slate-800/40 text-slate-500 cursor-not-allowed border border-slate-800'
                    }`}
                  >
                    {isMax ? (
                      '已升至最高级 (MAX)'
                    ) : (
                      <>
                        <span>升阶 (UPGRADE)</span>
                        <span>·</span>
                        <span>💎 {cost} 碎片</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 font-mono-numbers">
          在战斗中击破敌人与首领均可获取超维数据碎片，永久强化机体性能！
        </div>
      </div>
    </div>
  );
};

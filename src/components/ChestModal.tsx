import React, { useState, useEffect } from 'react';
import { UpgradeOption, Player } from '../game/types';
import { sound } from '../game/audio';
import { Sparkles, Trophy, Zap, Check } from 'lucide-react';

interface ChestModalProps {
  player: Player;
  rewards: UpgradeOption[];
  onClaim: () => void;
}

export const ChestModal: React.FC<ChestModalProps> = ({
  player,
  rewards,
  onClaim,
}) => {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    sound.playChestFanfare();
    const timer = setTimeout(() => {
      setRevealed(true);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
      <div className="w-full max-w-xl p-6 rounded-2xl bg-slate-900/95 border border-amber-500/40 shadow-[0_0_40px_rgba(245,158,11,0.25)] space-y-6 text-center">
        {/* Header */}
        <div className="space-y-1">
          <div className="text-xs font-mono-numbers uppercase tracking-widest text-amber-400 font-bold flex items-center justify-center gap-1.5">
            <Trophy size={14} />
            <span>MATRIX VAULT // 击破首领战利宝箱</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            获得超维矩阵嘉奖！
          </h2>
          <p className="text-xs text-slate-400">
            星型核心瓦解，释放出多重超载能量跃迁
          </p>
        </div>

        {/* Rewards Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {rewards.map((u, idx) => (
            <div
              key={u.id || idx}
              className={`p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 flex flex-col justify-between gap-2.5 transition-all duration-300 ${
                revealed ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
            >
              <div className="space-y-1">
                <span className="text-[10px] font-mono-numbers text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                  {u.rarity.toUpperCase()}
                </span>
                <h4 className="font-bold text-sm text-white mt-1">{u.nameZh}</h4>
                <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                  {u.desc}
                </p>
              </div>

              <div className="text-[10px] font-mono-numbers text-emerald-400 font-semibold bg-emerald-950/40 p-1.5 rounded border border-emerald-900/40">
                ▲ {u.statDiffText(player)}
              </div>
            </div>
          ))}
        </div>

        {/* Claim Button */}
        <button
          onClick={() => {
            sound.playClick(true);
            onClaim();
          }}
          disabled={!revealed}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black tracking-wide text-base shadow-[0_0_25px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <Check size={18} />
          <span>吸收全部强化 (CLAIM ALL)</span>
        </button>
      </div>
    </div>
  );
};

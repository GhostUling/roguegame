import React from 'react';
import { GameStats } from '../game/types';
import { isPaired } from '../game/modes';
import { sound } from '../game/audio';
import { RotateCcw, Home, Trophy, Skull, Clock, Zap, Target, Bookmark, Users } from 'lucide-react';

interface GameOverModalProps {
  stats: GameStats;
  highScore: number;
  onRestart: () => void;
  onHome: () => void;
  onOpenCodex?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  highScore,
  onRestart,
  onHome,
  onOpenCodex,
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isNewRecord = stats.score > highScore;

  const isTwin = isPaired(stats);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
      <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl space-y-6">
        {/* Title */}
        <div className="text-center space-y-1">
          <div className="text-xs font-mono-numbers tracking-widest text-rose-400 font-bold uppercase">
            CORE MELTDOWN // 能量耗尽
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white">
            几何架构崩溃
          </h2>
          <p className="text-xs text-slate-400">
            你在几何风暴中奋战直至奇点瓦解
          </p>
        </div>

        {/* Score Card */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center gap-1">
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Trophy size={14} className="text-amber-400" />
            <span>本次行动战绩评分</span>
          </div>
          <div className="text-4xl font-extrabold font-mono-numbers text-amber-300 tracking-tight">
            {stats.score.toLocaleString()}
          </div>
          {isNewRecord && (
            <div className="text-xs font-semibold text-emerald-400 mt-1">
              ★ 刷新历史最高纪录！ ★
            </div>
          )}
          {!isNewRecord && (
            <div className="text-xs text-slate-500 font-mono-numbers mt-0.5">
              历史最高: {highScore.toLocaleString()}
            </div>
          )}
        </div>

        {/* Twin Link pairing summary */}
        {isTwin && (
          <div className="flex items-center justify-center gap-1.5 text-xs font-mono-numbers text-fuchsia-300 border border-fuchsia-500/30 bg-fuchsia-950/30 rounded-xl py-2">
            <Users size={13} />
            <span>双子共鸣编队</span>
            <span className="text-slate-500">·</span>
            <span>双机共享血条与强化 · 敌潮密度双倍</span>
          </div>
        )}

        {/* Breakdown Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 flex items-center gap-3">
            <Clock size={16} className="text-cyan-400 shrink-0" />
            <div>
              <div className="text-slate-400 text-[11px]">存活时间</div>
              <div className="text-slate-100 font-bold font-mono-numbers text-sm">
                {formatTime(stats.survivedTime)}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 flex items-center gap-3">
            <Zap size={16} className="text-indigo-400 shrink-0" />
            <div>
              <div className="text-slate-400 text-[11px]">最终等级</div>
              <div className="text-slate-100 font-bold font-mono-numbers text-sm">
                LV.{stats.finalLevel}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 flex items-center gap-3">
            <Skull size={16} className="text-rose-400 shrink-0" />
            <div>
              <div className="text-slate-400 text-[11px]">歼灭几何体</div>
              <div className="text-slate-100 font-bold font-mono-numbers text-sm">
                {stats.enemiesKilled} 个
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 flex items-center gap-3">
            <Target size={16} className="text-amber-400 shrink-0" />
            <div>
              <div className="text-slate-400 text-[11px]">总伤害输出</div>
              <div className="text-slate-100 font-bold font-mono-numbers text-sm">
                {stats.damageDealt.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          <button
            onClick={() => {
              sound.playClick(true);
              onRestart();
            }}
            className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw size={18} />
            <span>立即重构 (重新开始)</span>
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            {onOpenCodex && (
              <button
                onClick={() => {
                  sound.playClick(false);
                  onOpenCodex();
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-cyan-500/30 text-cyan-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Bookmark size={15} />
                <span>科技图鉴</span>
              </button>
            )}
            <button
              onClick={() => {
                sound.playClick(false);
                onHome();
              }}
              className={`py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                !onOpenCodex ? 'col-span-2' : ''
              }`}
            >
              <Home size={15} />
              <span>返回主界面</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  X,
  Settings,
  Volume2,
  VolumeX,
  ShieldCheck,
  ShieldOff,
  RefreshCw,
  Activity,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  invincible: boolean;
  onToggleInvincible: () => void;
  infiniteReroll: boolean;
  onToggleInfiniteReroll: () => void;
  debugTrace: boolean;
  onToggleDebugTrace: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isMuted,
  onToggleMute,
  invincible,
  onToggleInvincible,
  infiniteReroll,
  onToggleInfiniteReroll,
  debugTrace,
  onToggleDebugTrace,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-[0_0_50px_rgba(0,0,0,0.85)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <Settings size={17} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">系统设置</h2>
              <p className="text-[11px] font-mono text-slate-400">SYSTEM SETTINGS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="关闭设置"
          >
            <X size={16} />
          </button>
        </div>

        {/* Settings List */}
        <div className="p-5 space-y-3">
          {/* Invincible Toggle */}
          <div
            className={`p-3.5 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
              invincible
                ? 'bg-emerald-950/35 border-emerald-500/50'
                : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 p-2 rounded-lg border ${
                  invincible
                    ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                {invincible ? <ShieldCheck size={17} /> : <ShieldOff size={17} />}
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>无敌模式</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    GOD MODE
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  开启后免疫所有敌方弹幕与碰撞伤害，爽快测试各种技能组合。
                </p>
              </div>
            </div>
            <button
              onClick={onToggleInvincible}
              className={`shrink-0 px-3.5 py-2 rounded-lg text-xs font-bold font-mono border transition-all cursor-pointer ${
                invincible
                  ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.45)]'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              {invincible ? '已开启' : '已关闭'}
            </button>
          </div>

          {/* Audio Toggle */}
          <div className="p-3.5 rounded-xl border bg-slate-950/60 border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-2 rounded-lg border bg-slate-900 border-slate-700 text-cyan-300">
                {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
              </div>
              <div>
                <div className="text-sm font-bold text-white">游戏音效</div>
                <p className="text-xs text-slate-400 mt-0.5">控制合成器射击、击杀与技能特效音量。</p>
              </div>
            </div>
            <button
              onClick={onToggleMute}
              className={`shrink-0 px-3.5 py-2 rounded-lg text-xs font-bold font-mono border transition-all cursor-pointer ${
                !isMuted
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
              }`}
            >
              {isMuted ? '静音中' : '开启'}
            </button>
          </div>

          {/* Infinite Reroll */}
          <div className="p-3.5 rounded-xl border bg-slate-950/60 border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-2 rounded-lg border bg-slate-900 border-slate-700 text-amber-300">
                <RefreshCw size={17} />
              </div>
              <div>
                <div className="text-sm font-bold text-white">无限刷新</div>
                <p className="text-xs text-slate-400 mt-0.5">升级三选一时重抽卡牌不再消耗刷新次数。</p>
              </div>
            </div>
            <button
              onClick={onToggleInfiniteReroll}
              className={`shrink-0 px-3.5 py-2 rounded-lg text-xs font-bold font-mono border transition-all cursor-pointer ${
                infiniteReroll
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/60'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              {infiniteReroll ? '已开启' : '已关闭'}
            </button>
          </div>

          {/* Debug Trace */}
          <div className="p-3.5 rounded-xl border bg-slate-950/60 border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-2 rounded-lg border bg-slate-900 border-slate-700 text-purple-300">
                <Activity size={17} />
              </div>
              <div>
                <div className="text-sm font-bold text-white">裂变追踪日志</div>
                <p className="text-xs text-slate-400 mt-0.5">在左上角实时显示子弹命中与裂变判定记录。</p>
              </div>
            </div>
            <button
              onClick={onToggleDebugTrace}
              className={`shrink-0 px-3.5 py-2 rounded-lg text-xs font-bold font-mono border transition-all cursor-pointer ${
                debugTrace
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              {debugTrace ? '已开启' : '已关闭'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};

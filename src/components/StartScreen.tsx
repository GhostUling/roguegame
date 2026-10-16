import React, { useState } from 'react';
import { sound } from '../game/audio';
import { GameMode } from '../game/types';
import { Play, Trophy, Crosshair, Sparkles, Volume2, VolumeX, Shield, Zap, Bookmark, Users } from 'lucide-react';

interface StartScreenProps {
  highScore: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onStart: (mode: GameMode) => void;
  onOpenCodex: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  highScore,
  isMuted,
  onToggleMute,
  onStart,
  onOpenCodex,
}) => {
  const [mode, setMode] = useState<GameMode>('standard');

  const handleStart = () => {
    sound.init();
    sound.resume();
    sound.playUpgrade();
    onStart(mode);
  };

  const handleOpenCodex = () => {
    sound.init();
    sound.resume();
    sound.playUpgrade();
    onOpenCodex();
  };

  const handlePickMode = (next: GameMode) => {
    sound.playClick(next === 'twin_link');
    setMode(next);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-gradient-to-b from-[#05070f] via-[#080d19] to-[#04060a]">
      {/* Background ambient geometric accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-500/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-purple-500/20 blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 w-full max-w-xl flex flex-col items-center text-center space-y-7">
        {/* Top Badging */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono-numbers uppercase tracking-widest text-cyan-400 font-semibold px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30">
            GEOMETRIC OVERLOAD v1.0
          </span>
          <button
            onClick={onToggleMute}
            className="p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-700/60 transition-colors"
            title={isMuted ? '取消静音' : '静音'}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        </div>

        {/* Main Title */}
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white drop-shadow-[0_0_35px_rgba(0,255,204,0.35)]">
            几何超载
          </h1>
          <p className="text-sm sm:text-base font-medium text-slate-400 max-w-md mx-auto">
            纯几何肉鸽割草动作生存 · 零资源纯数学矢量合成
          </p>
        </div>

        {/* High Score Banner */}
        {highScore > 0 && (
          <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-mono-numbers text-amber-300 border border-amber-500/30">
            <Trophy size={15} className="text-amber-400" />
            <span>历史最高战绩: {highScore.toLocaleString()} 分</span>
          </div>
        )}

        {/* Mode Selector */}
        <div className="w-full space-y-2">
          <div className="text-[11px] font-mono-numbers uppercase tracking-widest text-slate-500 text-left">
            作战模式 // BATTLE MODE
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={() => handlePickMode('standard')}
              className={`p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col gap-1.5 ${
                mode === 'standard'
                  ? 'bg-slate-900/90 border-cyan-400 shadow-[0_0_22px_rgba(0,255,204,0.22)]'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                <Crosshair size={14} />
                <span>标准出击</span>
                <span className="text-[10px] font-mono-numbers text-slate-500">SOLO</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                单机体独立作战，原有节奏与难度，标准肉鸽体验。
              </p>
            </button>

            <button
              onClick={() => handlePickMode('twin_link')}
              className={`p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col gap-1.5 ${
                mode === 'twin_link'
                  ? 'bg-slate-900/90 border-fuchsia-400 shadow-[0_0_22px_rgba(232,121,249,0.22)]'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-fuchsia-300">
                <Users size={14} />
                <span>双子共鸣</span>
                <span className="text-[10px] font-mono-numbers text-slate-500">TWIN LINK</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                双机同频编队，共用血条与强化，火力翻倍、怪潮也翻倍。
              </p>
            </button>
          </div>
        </div>

        {/* Core Mechanics Preview */}
        <div className="grid grid-cols-3 gap-2.5 w-full text-left">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold">
              <Crosshair size={14} />
              <span>自动索敌</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              无需繁琐瞄准，专注走位规避高密度敌方几何蜂群。
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
              <Sparkles size={14} />
              <span>晶体吸取</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              击杀掉落自转能量菱形，磁吸蓄能实现指数级成长。
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-purple-400 text-xs font-bold">
              <Zap size={14} />
              <span>三选一质变</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              散弹、超频、贯穿、共振棱镜与超新星冲击波。
            </p>
          </div>
        </div>

        {/* Controls Instructions */}
        <div className="w-full glass-panel p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2 font-mono-numbers">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-300 font-semibold">🖥️ 键盘操控:</span>
            <span>[W][A][S][D] 或 方向键移动</span>
          </div>
          <div className="hidden sm:block text-slate-600">|</div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-300 font-semibold">📱 触摸操控:</span>
            <span>屏幕任意位置触控摇杆</span>
          </div>
        </div>

        {/* Action Buttons: Start & Codex */}
        <div className="w-full flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleStart}
            className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black text-base sm:text-lg tracking-wider transition-all duration-200 transform hover:scale-[1.01] shadow-[0_0_35px_rgba(0,255,204,0.4)] flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Play size={20} className="fill-slate-950" />
            <span>
              {mode === 'twin_link'
                ? '开始超载启动 (双机编队 SELECT ×2)'
                : '开始超载启动 (START)'}
            </span>
          </button>

          <button
            onClick={handleOpenCodex}
            className="py-4 px-6 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white font-bold text-sm sm:text-base transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,255,204,0.15)]"
            title="查看全部 25 种强化图鉴与流派羁绊"
          >
            <Bookmark size={19} className="text-cyan-400" />
            <span>科技图鉴 (CODEX)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

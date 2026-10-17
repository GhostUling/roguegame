import React, { useState, useEffect, useRef } from 'react';
import { CHARACTERS, getCharacterDef } from '../game/characters';
import { CharacterId, GameMode } from '../game/core/types';
import { modeOf } from '../game/core/modes';
import { sound } from '../game/infra/audio';
import { drawCharacterShip } from '../game/characters';
import { drawResonanceArc } from '../game/render/resonanceArc';
import { Play, ChevronLeft, ChevronRight, Zap, Sparkles, ArrowLeft, Users, RefreshCw } from 'lucide-react';

interface CharacterSelectScreenProps {
  mode: GameMode;
  onSelectCharacter: (charId: CharacterId, twinPilotId?: CharacterId) => void;
  onBack: () => void;
}

export const CharacterSelectScreen: React.FC<CharacterSelectScreenProps> = ({
  mode,
  onSelectCharacter,
  onBack,
}) => {
  const isTwin = modeOf(mode).pilotSlots === 2;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeSlot, setActiveSlot] = useState<0 | 1>(0);
  const [pilotA, setPilotA] = useState<CharacterId>(CHARACTERS[0].id);
  const [pilotB, setPilotB] = useState<CharacterId>(CHARACTERS[1].id);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number>(0);

  const char = CHARACTERS[selectedIndex];
  const defA = getCharacterDef(pilotA);
  const defB = getCharacterDef(pilotB);

  const glowPrimary = isTwin ? defA : char;
  const glowSecondary = isTwin ? defB : char;

  // Render animated preview of the selected vessel(s) on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const render = () => {
      time += 0.02;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(w / 2, h / 2);

      const breath = 1.0 + Math.sin(time * 3) * 0.05;
      ctx.scale(breath, breath);

      if (isTwin) {
        const baseR = 26;
        const offset = 36;

        ctx.save();
        ctx.translate(-offset, 0);
        drawCharacterShip(ctx, pilotA, baseR, 0, time);
        ctx.restore();

        ctx.save();
        ctx.translate(offset, 0);
        drawCharacterShip(ctx, pilotB, baseR, 0, time);
        ctx.restore();

        drawResonanceArc(ctx, -offset, 0, offset, 0, time, baseR);
      } else {
        drawCharacterShip(ctx, char.id, 36, 0, time);
      }

      ctx.restore();
      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [isTwin, char.id, pilotA, pilotB]);

  const handlePrev = () => {
    sound.playClick(false);
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : CHARACTERS.length - 1));
  };

  const handleNext = () => {
    sound.playClick(false);
    setSelectedIndex((prev) => (prev < CHARACTERS.length - 1 ? prev + 1 : 0));
  };

  const handlePickCard = (idx: number) => {
    sound.playClick(true);
    setSelectedIndex(idx);
    if (!isTwin) return;
    // Fills whichever slot is armed and stays on it, so a pair can be re-rolled in place.
    if (activeSlot === 0) {
      setPilotA(CHARACTERS[idx].id);
    } else {
      setPilotB(CHARACTERS[idx].id);
    }
  };

  const handleSelectSlot = (slot: 0 | 1) => {
    sound.playClick(false);
    setActiveSlot(slot);
    const targetId = slot === 0 ? pilotA : pilotB;
    const idx = CHARACTERS.findIndex((c) => c.id === targetId);
    if (idx >= 0) setSelectedIndex(idx);
  };

  const handleSwap = () => {
    sound.playClick(true);
    setPilotA(pilotB);
    setPilotB(pilotA);
  };

  const handleDeploy = () => {
    sound.playUpgrade();
    if (isTwin) onSelectCharacter(pilotA, pilotB);
    else onSelectCharacter(char.id);
  };

  const renderSlot = (slot: 0 | 1) => {
    const def = slot === 0 ? defA : defB;
    const isActive = activeSlot === slot;
    return (
      <button
        key={slot}
        onClick={() => handleSelectSlot(slot)}
        className={`flex-1 p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex items-center gap-3 ${
          isActive
            ? 'bg-slate-900/90 shadow-[0_0_18px_rgba(232,121,249,0.18)]'
            : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/40'
        }`}
        style={{ borderColor: isActive ? def.color : 'rgba(255, 255, 255, 0.08)' }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-base font-black shrink-0"
          style={{
            backgroundColor: `${def.color}20`,
            border: `1px solid ${def.color}60`,
            color: def.color,
          }}
        >
          {def.nameZh.slice(0, 1)}
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-mono-numbers uppercase tracking-widest text-slate-500">
            {slot === 0 ? 'PILOT 1 // 主机' : 'PILOT 2 // 僚机'}
          </div>
          <div className="text-sm font-bold text-white truncate">{def.nameZh}</div>
        </div>
        {isActive && (
          <span className="ml-auto text-[10px] font-mono-numbers text-fuchsia-300 shrink-0">
            装填中
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-40 flex p-4 bg-gradient-to-b from-[#05070f] via-[#080d19] to-[#04060a] overflow-y-auto">
      {/* Background ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl transition-colors duration-500"
          style={{ backgroundColor: glowPrimary.color }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl transition-colors duration-500"
          style={{ backgroundColor: glowSecondary.accentColor }}
        />
      </div>

      <div className="relative z-10 w-full max-w-4xl m-auto flex flex-col space-y-5 py-4">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              sound.playClick(false);
              onBack();
            }}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>返回主界面</span>
          </button>

          <div
            className={`text-xs font-mono-numbers uppercase tracking-widest font-semibold px-3 py-1 rounded-full border ${
              isTwin
                ? 'text-fuchsia-300 bg-fuchsia-950/60 border-fuchsia-500/30'
                : 'text-cyan-400 bg-cyan-950/60 border-cyan-500/30'
            }`}
          >
            {isTwin ? 'TWIN LINK // 双子编队装配' : 'VESSEL MATRIX // 核心机体选配'}
          </div>
        </div>

        {/* Twin Link dual slot bay */}
        {isTwin && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {renderSlot(0)}
              <button
                onClick={handleSwap}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-fuchsia-300 transition-colors cursor-pointer shrink-0"
                title="互换主僚机"
              >
                <RefreshCw size={15} />
              </button>
              {renderSlot(1)}
            </div>
            <p className="text-[11px] text-slate-500 font-mono-numbers flex items-center gap-1.5">
              <Users size={12} />
              <span>
                点击下方机体卡牌装填至「装填中」的槽位 · 允许两台相同机体 · 血条合并，强化全共享
              </span>
            </p>
          </div>
        )}

        {/* Vessel Carousel Selector Cards */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {CHARACTERS.map((c, idx) => {
            const isSelected = idx === selectedIndex;
            const inSquad =
              isTwin && (c.id === pilotA || c.id === pilotB);
            return (
              <button
                key={c.id}
                onClick={() => handlePickCard(idx)}
                className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900/90 shadow-[0_0_20px_rgba(0,255,204,0.18)] scale-[1.02]'
                    : 'bg-slate-950/60 hover:bg-slate-900/40 border-slate-800/80 text-slate-400'
                }`}
                style={{
                  borderColor: isSelected ? c.color : 'rgba(255, 255, 255, 0.08)',
                }}
              >
                <div>
                  <div
                    className="text-xs font-black font-mono-numbers tracking-tight flex items-center gap-1"
                    style={{ color: isSelected ? c.color : '#94a3b8' }}
                  >
                    <span>{c.nameZh}</span>
                    {inSquad && (
                      <span className="text-[9px] font-mono-numbers text-fuchsia-300">●</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate font-mono-numbers">
                    {c.name}
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 mt-2 line-clamp-1">
                  {c.title.split('/')[0]}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Character Showcase Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left Canvas Preview */}
          <div className="md:col-span-5 flex flex-col items-center justify-center relative">
            <div className="w-56 h-56 rounded-2xl bg-slate-950/90 border border-slate-800/80 shadow-inner flex items-center justify-center relative overflow-hidden">
              {/* Radial background behind geometry */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  background: `radial-gradient(circle, ${char.color} 0%, transparent 70%)`,
                }}
              />
              <canvas
                ref={canvasRef}
                width={220}
                height={220}
                className="relative z-10 w-full h-full block"
              />
            </div>

            {/* Carousel navigation arrows */}
            <div className="flex items-center gap-4 mt-3">
              <button
                onClick={handlePrev}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="上一个机体"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-xs font-mono-numbers text-slate-400">
                {selectedIndex + 1} / {CHARACTERS.length}
              </span>
              <button
                onClick={handleNext}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="下一个机体"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Right Info & Skills Panel */}
          <div className="md:col-span-7 space-y-4">
            {/* Header info */}
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-mono-numbers font-semibold uppercase px-2 py-0.5 rounded border"
                  style={{
                    color: char.color,
                    borderColor: `${char.color}40`,
                    backgroundColor: `${char.color}15`,
                  }}
                >
                  {char.title}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
                {char.nameZh}
                <span className="text-sm font-normal text-slate-400 font-mono-numbers ml-2">
                  // {char.name}
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {char.desc}
              </p>
            </div>

            {/* Base Attributes Bar */}
            <div className="grid grid-cols-4 gap-2 text-xs font-mono-numbers p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div>
                <span className="text-slate-500 text-[10px] block">初始生命</span>
                <span className="text-rose-400 font-bold">{char.baseStats.hp} HP</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">机动速度</span>
                <span className="text-yellow-400 font-bold">{char.baseStats.speed.toFixed(1)}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">开火间隔</span>
                <span className="text-cyan-400 font-bold">{char.baseStats.fireRate}ms</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">初始暴击</span>
                <span className="text-amber-400 font-bold">{Math.round(char.baseStats.critChance * 100)}%</span>
              </div>
            </div>

            {/* Passive Skill Card */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <Sparkles size={14} className="text-emerald-400" />
                  <span>被动能力: {char.passive.nameZh}</span>
                </div>
                <span className="text-[10px] font-mono-numbers text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900/60">
                  PASSIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {char.passive.desc}
              </p>
            </div>

            {/* Active Skill Card */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <Zap size={14} style={{ color: char.color }} />
                  <span>主动技能: {char.activeSkill.nameZh}</span>
                  <span className="text-[10px] font-mono-numbers text-slate-400">
                    [冷却 {char.activeSkill.cooldown}s]
                  </span>
                </div>
                <span className="text-[10px] font-mono-numbers font-bold text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/40">
                  {isTwin ? 'SPACE 齐发' : 'SPACE / 空格'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {char.activeSkill.desc}
              </p>
            </div>
          </div>
        </div>

        {/* Deploy Action Button */}
        <button
          onClick={handleDeploy}
          className="w-full py-4 px-8 rounded-xl font-black text-lg tracking-wider text-slate-950 transition-all duration-200 transform hover:scale-[1.01] shadow-[0_0_30px_rgba(0,255,204,0.35)] flex items-center justify-center gap-3 cursor-pointer"
          style={{
            background: isTwin
              ? `linear-gradient(90deg, ${defA.color}, ${defB.color})`
              : `linear-gradient(90deg, ${char.color}, #38bdf8, ${char.color})`,
          }}
        >
          <Play size={20} className="fill-slate-950" />
          <span>
            {isTwin
              ? `确认双机接入并出击 (DEPLOY // ${defA.nameZh} + ${defB.nameZh})`
              : `确认接入机体并出击 (DEPLOY // ${char.nameZh})`}
          </span>
        </button>
      </div>
    </div>
  );
};

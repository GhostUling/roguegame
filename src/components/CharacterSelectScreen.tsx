import React, { useState, useEffect, useRef } from 'react';
import { CHARACTERS } from '../game/characters';
import { CharacterDef, CharacterId } from '../game/types';
import { sound } from '../game/audio';
import { Play, ChevronLeft, ChevronRight, Zap, Shield, Sparkles, Crosshair, ArrowLeft } from 'lucide-react';

interface CharacterSelectScreenProps {
  onSelectCharacter: (charId: CharacterId) => void;
  onBack: () => void;
}

export const CharacterSelectScreen: React.FC<CharacterSelectScreenProps> = ({
  onSelectCharacter,
  onBack,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number>(0);

  const char = CHARACTERS[selectedIndex];

  // Render animated preview of the selected character geometry on canvas
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

      const baseR = 36;

      if (char.id === 'alpha_prism') {
        // Octagram
        ctx.save();
        ctx.rotate(time * 1.2);
        ctx.strokeStyle = char.color;
        ctx.shadowColor = char.color;
        ctx.shadowBlur = 24;
        ctx.lineWidth = 3;

        ctx.beginPath();
        const points = 8;
        const outerR = baseR * 1.35;
        const innerR = baseR * 0.95;
        for (let i = 0; i < points * 2; i++) {
          const r = i % 2 === 0 ? outerR : innerR;
          const a = (i * Math.PI) / points;
          if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();

        // Inner Core
        ctx.fillStyle = '#0a1922';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.shadowColor = char.color;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(0, 0, baseR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, baseR * 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else if (char.id === 'beta_phalanx') {
        // Hexagon heavy armor
        ctx.save();
        ctx.rotate(time * 0.7);
        ctx.strokeStyle = char.color;
        ctx.shadowColor = char.color;
        ctx.shadowBlur = 24;
        ctx.lineWidth = 4.5;

        ctx.beginPath();
        for (let s = 0; s < 6; s++) {
          const a = (s * 2 * Math.PI) / 6;
          const px = Math.cos(a) * (baseR * 1.35);
          const py = Math.sin(a) * (baseR * 1.35);
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();

        // Inner Core
        ctx.fillStyle = '#170624';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(0, 0, baseR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, 0, baseR * 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (char.id === 'gamma_viper') {
        // Swept-wing triangle
        ctx.save();
        ctx.rotate(Math.sin(time * 1.5) * 0.2); // subtle banking
        ctx.fillStyle = '#1e1402';
        ctx.strokeStyle = char.color;
        ctx.shadowColor = char.color;
        ctx.shadowBlur = 25;
        ctx.lineWidth = 3.5;

        ctx.beginPath();
        ctx.moveTo(baseR * 1.5, 0);
        ctx.lineTo(-baseR * 1.1, -baseR * 1.2);
        ctx.lineTo(-baseR * 0.5, 0);
        ctx.lineTo(-baseR * 1.1, baseR * 1.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Twin thruster flame
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(-baseR * 0.9, -10, 6, 0, Math.PI * 2);
        ctx.arc(-baseR * 0.9, 10, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (char.id === 'delta_chronos') {
        // 12-point chronos star
        ctx.save();
        ctx.rotate(time * 1.4);
        ctx.strokeStyle = char.color;
        ctx.shadowColor = char.color;
        ctx.shadowBlur = 24;
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        const points = 12;
        for (let i = 0; i < points * 2; i++) {
          const r = i % 2 === 0 ? baseR * 1.4 : baseR * 0.85;
          const a = (i * Math.PI) / points;
          if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();

        // Counter-rotating ring
        ctx.save();
        ctx.rotate(-time * 1.8);
        ctx.strokeStyle = '#ec4899';
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 20;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, baseR * 0.75, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
      } else if (char.id === 'epsilon_carrier') {
        // 10-point nested decagram motherhive
        ctx.save();
        ctx.rotate(time * 0.9);
        ctx.strokeStyle = char.color;
        ctx.shadowColor = char.color;
        ctx.shadowBlur = 24;
        ctx.lineWidth = 3;

        ctx.beginPath();
        const points = 10;
        for (let i = 0; i < points * 2; i++) {
          const r = i % 2 === 0 ? baseR * 1.4 : baseR * 0.9;
          const a = (i * Math.PI) / points;
          if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();

        // Dual rotating docking satellites
        ctx.save();
        ctx.rotate(-time * 1.7);
        ctx.strokeStyle = '#f59e0b';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 18;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, baseR * 0.7, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        [-baseR * 0.7, baseR * 0.7].forEach((xPos) => {
          ctx.beginPath();
          ctx.arc(xPos, 0, 5, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();

        ctx.fillStyle = '#022c22';
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, baseR * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (char.id === 'zeta_aurora') {
        // 6-point crystalline snowflake geometry
        ctx.save();
        ctx.rotate(time * 1.2);
        ctx.strokeStyle = char.color;
        ctx.shadowColor = char.color;
        ctx.shadowBlur = 25;
        ctx.lineWidth = 2.8;

        ctx.beginPath();
        for (let s = 0; s < 6; s++) {
          const a = (s * Math.PI * 2) / 6;
          const ox = Math.cos(a) * (baseR * 1.45);
          const oy = Math.sin(a) * (baseR * 1.45);
          ctx.moveTo(0, 0);
          ctx.lineTo(ox, oy);

          const bx = Math.cos(a) * (baseR * 0.85);
          const by = Math.sin(a) * (baseR * 0.85);
          const pa1 = a + Math.PI / 3;
          const pa2 = a - Math.PI / 3;
          ctx.moveTo(bx, by);
          ctx.lineTo(bx + Math.cos(pa1) * 8, by + Math.sin(pa1) * 8);
          ctx.moveTo(bx, by);
          ctx.lineTo(bx + Math.cos(pa2) * 8, by + Math.sin(pa2) * 8);
        }
        ctx.stroke();
        ctx.restore();

        // Outer cyan-magenta dual frost halo
        ctx.save();
        ctx.rotate(-time * 1.9);
        ctx.strokeStyle = '#e879f9';
        ctx.shadowColor = '#e879f9';
        ctx.shadowBlur = 18;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, baseR * 0.65, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = '#083344';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, baseR * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [selectedIndex, char]);

  const handlePrev = () => {
    sound.playClick(false);
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : CHARACTERS.length - 1));
  };

  const handleNext = () => {
    sound.playClick(false);
    setSelectedIndex((prev) => (prev < CHARACTERS.length - 1 ? prev + 1 : 0));
  };

  const handleDeploy = () => {
    sound.playUpgrade();
    onSelectCharacter(char.id);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-gradient-to-b from-[#05070f] via-[#080d19] to-[#04060a]">
      {/* Background ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl transition-colors duration-500"
          style={{ backgroundColor: char.color }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl transition-colors duration-500"
          style={{ backgroundColor: char.accentColor }}
        />
      </div>

      <div className="relative z-10 w-full max-w-4xl flex flex-col space-y-5">
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

          <div className="text-xs font-mono-numbers uppercase tracking-widest text-cyan-400 font-semibold px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30">
            VESSEL MATRIX // 核心机体选配
          </div>
        </div>

        {/* Vessel Carousel Selector Cards */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {CHARACTERS.map((c, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={c.id}
                onClick={() => {
                  sound.playClick(true);
                  setSelectedIndex(idx);
                }}
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
                    className="text-xs font-black font-mono-numbers tracking-tight"
                    style={{ color: isSelected ? c.color : '#94a3b8' }}
                  >
                    {c.nameZh}
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
                  SPACE / 空格
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
            background: `linear-gradient(90deg, ${char.color}, #38bdf8, ${char.color})`,
          }}
        >
          <Play size={20} className="fill-slate-950" />
          <span>确认接入机体并出击 (DEPLOY // {char.nameZh})</span>
        </button>
      </div>
    </div>
  );
};

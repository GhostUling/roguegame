import React, { useState } from 'react';
import { EnemyType } from '../game/core/types';
import { ENEMY_TYPES } from '../game/core/enemyTypes';
import { ShieldCheck, ShieldOff, Trash2 } from 'lucide-react';

/** The order the panel lists them in: fodder first, boss last. */
const SANDBOX_TYPES: EnemyType[] = ['chaser', 'speeder', 'charger', 'sniper', 'tank', 'hive', 'boss'];
const COUNTS = [1, 5, 20];

interface SandboxPanelProps {
  invincible: boolean;
  onSpawn: (type: EnemyType, count: number) => void;
  onClear: () => void;
  onToggleInvincible: () => void;
}

export const SandboxPanel: React.FC<SandboxPanelProps> = ({
  invincible,
  onSpawn,
  onClear,
  onToggleInvincible,
}) => {
  const [count, setCount] = useState(5);

  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 pointer-events-auto w-48 rounded-xl border border-emerald-500/40 bg-slate-950/90 backdrop-blur-md p-3 shadow-[0_0_25px_rgba(16,185,129,0.15)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-mono-numbers uppercase tracking-widest text-emerald-300 font-bold">
          测试场 // SANDBOX
        </span>
        <span className="text-[10px] font-mono-numbers text-slate-500">DEV</span>
      </div>

      <div className="flex items-center h-7 rounded-lg bg-slate-900/80 border border-slate-700/60 overflow-hidden mb-2">
        <span className="px-2 text-[10px] font-mono-numbers text-slate-500">数量</span>
        {COUNTS.map((n) => (
          <button
            key={n}
            onClick={() => setCount(n)}
            className={`flex-1 h-full text-[11px] font-mono-numbers border-l border-slate-800 transition-colors cursor-pointer ${
              n === count ? 'bg-emerald-500/25 text-emerald-200 font-bold' : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        {SANDBOX_TYPES.map((type) => {
          const def = ENEMY_TYPES[type];
          return (
            <button
              key={type}
              onClick={() => onSpawn(type, count)}
              className="flex items-center justify-between px-2 py-1 rounded-md bg-slate-900/70 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer group"
            >
              <span className="flex items-center gap-1.5 text-[11px] text-slate-300 group-hover:text-white">
                <span
                  className="inline-block w-2 h-2 rounded-sm"
                  style={{ backgroundColor: def.strokeColor }}
                />
                {def.nameZh}
              </span>
              <span className="text-[10px] font-mono-numbers text-slate-500">×{count}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-1 mt-2 pt-2 border-t border-slate-800">
        <button
          onClick={onToggleInvincible}
          className={`flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-md border text-[11px] transition-colors cursor-pointer ${
            invincible
              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
              : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-100'
          }`}
        >
          {invincible ? <ShieldCheck size={12} /> : <ShieldOff size={12} />}
          无敌
        </button>
        <button
          onClick={onClear}
          className="flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-md bg-slate-900/70 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-500/50 text-[11px] text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
        >
          <Trash2 size={12} />
          清场
        </button>
      </div>

      <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
        敌人环绕机体 330px 生成；清场会一并移除敌弹与掉落。
      </p>
    </div>
  );
};

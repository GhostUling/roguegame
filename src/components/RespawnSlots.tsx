import React, { useState } from 'react';
import { EnemyType } from '../game/core/types';
import { ENEMY_TYPES } from '../game/core/enemyTypes';
import { bindableForms, formOf, pilotHpFor } from '../game/core/predatorForms';
import { sound } from '../game/infra/audio';
import { RotateCcw } from 'lucide-react';

interface RespawnSlotsProps {
  /** The three engine slots, in slot order; an empty slot is null. */
  slots: (EnemyType | null)[];
  elapsedSeconds: number;
  onBind: (index: number, form: EnemyType | null) => void;
}

/**
 * Predator's respawn panel. You bind up to three forms here once, and then death
 * is just a form change: the engine rolls one of them (never the one you lost)
 * without stopping the hunt.
 */
export const RespawnSlots: React.FC<RespawnSlotsProps> = ({
  slots,
  elapsedSeconds,
  onBind,
}) => {
  const [openSlot, setOpenSlot] = useState<number | null>(null);
  const roster = bindableForms(elapsedSeconds);

  const bind = (index: number, form: EnemyType | null) => {
    sound.playClick(form === null);
    onBind(index, form);
    setOpenSlot(null);
  };

  return (
    <div className="absolute right-4 top-4 z-20 pointer-events-auto w-44 rounded-xl border border-rose-500/40 bg-slate-950/90 backdrop-blur-md p-2.5 shadow-[0_0_25px_rgba(244,63,94,0.15)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-mono-numbers uppercase tracking-widest text-rose-300 font-bold">
          复活形态 // RESPAWN
        </span>
      </div>

      <div className="flex flex-col gap-1">
        {slots.map((bound, index) => {
          const def = bound ? ENEMY_TYPES[bound] : null;
          return (
            <button
              key={index}
              onClick={() => {
                sound.playClick(false);
                setOpenSlot(openSlot === index ? null : index);
              }}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md border text-[11px] transition-colors cursor-pointer text-left ${
                bound
                  ? 'bg-slate-900/80 border-rose-500/30 text-slate-100 hover:border-rose-400'
                  : 'bg-slate-900/40 border-dashed border-slate-700 text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className="text-[10px] font-mono-numbers text-slate-500 w-3 shrink-0">
                {index + 1}
              </span>
              {def && (
                <span
                  className="inline-block w-2 h-2 rounded-sm shrink-0"
                  style={{ backgroundColor: def.strokeColor }}
                />
              )}
              <span className="truncate">{def ? def.nameZh : '空槽 — 点击绑定'}</span>
            </button>
          );
        })}
      </div>

      {openSlot !== null && (
        <div className="mt-2 pt-2 border-t border-slate-800 flex flex-col gap-1 max-h-64 overflow-y-auto">
          {roster.map((type) => {
            const def = ENEMY_TYPES[type];
            const form = formOf(type);
            return (
              <button
                key={type}
                onClick={() => bind(openSlot, type)}
                className="px-2 py-1.5 rounded-md bg-slate-900/70 hover:bg-slate-800 border border-slate-800 hover:border-rose-400/60 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-2 h-2 rounded-sm"
                    style={{ backgroundColor: def.strokeColor }}
                  />
                  <span className="text-[11px] text-slate-100 font-bold">{def.nameZh}</span>
                  <span className="ml-auto text-[10px] font-mono-numbers text-slate-500">
                    {pilotHpFor(type, elapsedSeconds)} HP
                  </span>
                </div>
                <div className="text-[10px] font-mono-numbers text-rose-300 mt-0.5">
                  {form.ultNameZh} · {form.ultCooldown}s
                </div>
              </button>
            );
          })}

          {slots[openSlot] && (
            <button
              onClick={() => bind(openSlot, null)}
              className="flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-slate-900/70 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-500/50 text-[10px] text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
            >
              <RotateCcw size={11} />
              <span>清空此槽</span>
            </button>
          )}
        </div>
      )}

      <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
        死亡立刻从已绑定的形态里随机复活（不重复刚死的那个）。没绑定则随机取当前已解锁的怪。
      </p>
    </div>
  );
};

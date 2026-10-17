import React from 'react';
import { DebugEvent } from '../game/engine/debugTrace';

/** Overlay for the runtime trace switch; reads the engine's ring buffer. */
export const DebugTracePanel: React.FC<{ events: DebugEvent[] }> = ({ events }) => (
  <div className="absolute left-4 top-28 z-30 pointer-events-none w-80 rounded-lg border border-amber-500/40 bg-slate-950/85 backdrop-blur-sm p-2">
    <div className="text-[10px] font-mono-numbers uppercase tracking-widest text-amber-300 mb-1">
      裂变追踪 // SPAWNSHOT
    </div>
    {events.length === 0 ? (
      <div className="text-[10px] font-mono-numbers text-slate-500">等待玩家子弹命中…</div>
    ) : (
      <div className="flex flex-col gap-0.5 font-mono-numbers">
        {events.map((event, i) => (
          <div key={i} className="text-[10px] leading-tight text-slate-300 break-all">
            <span className="text-slate-500">{event.t.toFixed(1)}s</span>{' '}
            <span
              className={
                event.tag === 'spawn'
                  ? 'text-emerald-300'
                  : event.tag === 'card'
                    ? 'text-cyan-300'
                    : 'text-slate-400'
              }
            >
              [{event.tag}]
            </span>{' '}
            {event.detail}
          </div>
        ))}
      </div>
    )}
    <div className="mt-1 text-[9px] font-mono-numbers text-slate-500">
      sec=副弹(1 不裂) count=卡等级 n=同屏弹量 fuse=引信
    </div>
  </div>
);

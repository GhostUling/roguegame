import React, { useState } from 'react';
import { EnemyType } from '../game/core/types';
import { ENEMY_TYPES } from '../game/core/enemyTypes';
import { ShieldCheck, ShieldOff, Trash2 } from 'lucide-react';

/** The order the panel lists them in: fodder first, boss last. */
const SANDBOX_TYPES: EnemyType[] = ['chaser', 'speeder', 'charger', 'sniper', 'tank', 'hive', 'boss'];
const COUNTS = [1, 5, 20];

interface SandboxPanelProps {
  invincible: boolean;
  cardPool: 'standard' | 'overflow';
  onChangeCardPool: (pool: 'standard' | 'overflow') => void;
  onSpawn: (type: EnemyType, count: number) => void;
  onClear: () => void;
  onToggleInvincible: () => void;
  gasterLevel: number;
  voidIaijutsuLevel: number;
  babylonLevel: number;
  meteorLevel: number;
  ionLevel: number;
  aegisLevel: number;
  mirageLevel: number;
  onEquipGaster: () => void;
  onTriggerGaster: () => void;
  onEquipIaijutsu: () => void;
  onTriggerIaijutsu: () => void;
  onEquipBabylon: () => void;
  onTriggerBabylon: () => void;
  onEquipMeteor: () => void;
  onTriggerMeteor: () => void;
  onEquipIon: () => void;
  onTriggerIon: () => void;
  onEquipAegis: () => void;
  onTriggerAegis: () => void;
  onEquipMirage: () => void;
  onTriggerMirage: () => void;
}

export const SandboxPanel: React.FC<SandboxPanelProps> = ({
  invincible,
  cardPool,
  onChangeCardPool,
  onSpawn,
  onClear,
  onToggleInvincible,
  gasterLevel,
  voidIaijutsuLevel,
  babylonLevel,
  meteorLevel,
  ionLevel,
  aegisLevel,
  mirageLevel,
  onEquipGaster,
  onTriggerGaster,
  onEquipIaijutsu,
  onTriggerIaijutsu,
  onEquipBabylon,
  onTriggerBabylon,
  onEquipMeteor,
  onTriggerMeteor,
  onEquipIon,
  onTriggerIon,
  onEquipAegis,
  onTriggerAegis,
  onEquipMirage,
  onTriggerMirage,
}) => {
  const [count, setCount] = useState(5);

  const weapons = [
    {
      name: '龙骨炮',
      icon: '⚡',
      level: gasterLevel,
      color: 'sky',
      border: 'border-sky-500/40',
      bg: 'bg-sky-950/70 hover:bg-sky-900/80',
      text: 'text-sky-200',
      accent: 'text-sky-300',
      btnBg: 'bg-sky-900/60 hover:bg-sky-800 border-sky-400/50',
      btnText: '试射',
      title: '发射 8 门龙骨炮围圈集火',
      onEquip: onEquipGaster,
      onTrigger: onTriggerGaster,
    },
    {
      name: '次元居合',
      icon: '⚔️',
      level: voidIaijutsuLevel,
      color: 'purple',
      border: 'border-purple-500/40',
      bg: 'bg-purple-950/70 hover:bg-purple-900/80',
      text: 'text-purple-200',
      accent: 'text-purple-300',
      btnBg: 'bg-purple-900/60 hover:bg-purple-800 border-purple-400/50',
      btnText: '瞬斩',
      title: '空间撕裂瞬切冲刺',
      onEquip: onEquipIaijutsu,
      onTrigger: onTriggerIaijutsu,
    },
    {
      name: '万象剑阵',
      icon: '👑',
      level: babylonLevel,
      color: 'amber',
      border: 'border-amber-500/40',
      bg: 'bg-amber-950/70 hover:bg-amber-900/80',
      text: 'text-amber-200',
      accent: 'text-amber-300',
      btnBg: 'bg-amber-900/60 hover:bg-amber-800 border-amber-400/50',
      btnText: '剑雨',
      title: '召唤王之财宝几何光剑',
      onEquip: onEquipBabylon,
      onTrigger: onTriggerBabylon,
    },
    {
      name: '坍缩陨星',
      icon: '☄️',
      level: meteorLevel,
      color: 'orange',
      border: 'border-orange-500/40',
      bg: 'bg-orange-950/70 hover:bg-orange-900/80',
      text: 'text-orange-200',
      accent: 'text-orange-300',
      btnBg: 'bg-orange-900/60 hover:bg-orange-800 border-orange-400/50',
      btnText: '落星',
      title: '引力黑洞牵引与天动爆裂',
      onEquip: onEquipMeteor,
      onTrigger: onTriggerMeteor,
    },
    {
      name: '离子天罚',
      icon: '⚡',
      level: ionLevel,
      color: 'cyan',
      border: 'border-cyan-500/40',
      bg: 'bg-cyan-950/70 hover:bg-cyan-900/80',
      text: 'text-cyan-200',
      accent: 'text-cyan-300',
      btnBg: 'bg-cyan-900/60 hover:bg-cyan-800 border-cyan-400/50',
      btnText: '天罚',
      title: '轨道离子光柱与持续熔岩地表',
      onEquip: onEquipIon,
      onTrigger: onTriggerIon,
    },
    {
      name: '棱镜圣域',
      icon: '🛡️',
      level: aegisLevel,
      color: 'emerald',
      border: 'border-teal-500/40',
      bg: 'bg-teal-950/70 hover:bg-teal-900/80',
      text: 'text-teal-200',
      accent: 'text-teal-300',
      btnBg: 'bg-teal-900/60 hover:bg-teal-800 border-teal-400/50',
      btnText: '震波',
      title: '绝对领域偏折偏转与冲击退敌',
      onEquip: onEquipAegis,
      onTrigger: onTriggerAegis,
    },
    {
      name: '幻影剑雨',
      icon: '🌸',
      level: mirageLevel,
      color: 'pink',
      border: 'border-pink-500/40',
      bg: 'bg-pink-950/70 hover:bg-pink-900/80',
      text: 'text-pink-200',
      accent: 'text-pink-300',
      btnBg: 'bg-pink-900/60 hover:bg-pink-800 border-pink-400/50',
      btnText: '散华',
      title: '月华螺旋环绕与全弹自导齐射',
      onEquip: onEquipMirage,
      onTrigger: onTriggerMirage,
    },
  ];

  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 pointer-events-auto w-64 max-h-[94vh] overflow-y-auto rounded-xl border border-emerald-500/40 bg-slate-950/95 backdrop-blur-md p-3 shadow-[0_0_25px_rgba(16,185,129,0.15)]">
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

      <div className="flex items-center h-7 rounded-lg bg-slate-900/80 border border-slate-700/60 overflow-hidden mb-2">
        <span className="px-2 text-[10px] font-mono-numbers text-slate-500">卡池</span>
        {(['standard', 'overflow'] as const).map((pool) => (
          <button
            key={pool}
            onClick={() => onChangeCardPool(pool)}
            className={`flex-1 h-full text-[11px] font-mono-numbers border-l border-slate-800 transition-colors cursor-pointer ${
              pool === cardPool
                ? 'bg-emerald-500/25 text-emerald-200 font-bold'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            {pool === 'standard' ? '标准' : '溢流'}
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

      {/* 超载共鸣测试 / RESONANCE TEST */}
      <div className="mt-2 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-mono-numbers text-sky-400 font-bold tracking-wider">
            超阶共鸣测试 // RESONANCE
          </span>
          <span className="text-[9px] font-mono-numbers text-slate-500">7 WEAPONS</span>
        </div>

        <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-0.5">
          {weapons.map((w) => (
            <div key={w.name} className="flex gap-1">
              <button
                onClick={w.onEquip}
                className={`flex-1 flex items-center justify-between px-2 py-1 rounded border text-[10px] transition-colors cursor-pointer group ${w.bg} ${w.border} ${w.text}`}
                title={`获得/提升【${w.name}】强化等级`}
              >
                <span className="flex items-center gap-1 font-semibold truncate">
                  <span>{w.icon}</span> {w.name}
                </span>
                <span className={`font-mono-numbers font-bold shrink-0 ml-1 ${w.accent}`}>
                  {w.level > 0 ? `Lv.${w.level}` : '未装备'}
                </span>
              </button>
              <button
                onClick={w.onTrigger}
                className={`px-2 py-1 rounded border text-[10px] text-white font-bold transition-colors cursor-pointer shrink-0 ${w.btnBg}`}
                title={w.title}
              >
                {w.btnText}
              </button>
            </div>
          ))}
        </div>
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
        敌人环绕机体 330px 生成；清场会一并移除敌弹与掉落。卡池决定升级三选一抽哪张表。
      </p>
    </div>
  );
};

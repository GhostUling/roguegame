import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ALL_UPGRADES, UpgradeDefinition } from '../game/upgrades';
import { CODEX_DETAILS, CodexDetail, synergyLabel } from '../game/codexData';
import { sound } from '../game/audio';
import {
  X,
  Search,
  Crosshair,
  Zap,
  Bot,
  Shield,
  Layers,
  Sparkles,
  ChevronRight,
  Flame,
  CheckCircle2,
  Bookmark,
  Compass,
  ArrowRight,
  Info,
  Sliders,
  Filter,
} from 'lucide-react';

interface CodexModalProps {
  isOpen: boolean;
  onClose: () => void;
  // If opened during run, current player upgrades can be passed
  currentUpgradeLevels?: Record<string, number>;
  initialSelectedKey?: string;
}

type CategoryTab = 'all' | 'ballistic' | 'energy' | 'summon' | 'defense' | 'tactical';

export const CodexModal: React.FC<CodexModalProps> = ({
  isOpen,
  onClose,
  currentUpgradeLevels = {},
  initialSelectedKey,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKey, setSelectedKey] = useState<string>(
    initialSelectedKey || ALL_UPGRADES[0]?.key || 'fire_rate'
  );

  const detailContainerRef = useRef<HTMLDivElement>(null);

  // Sync initialSelectedKey if provided
  useEffect(() => {
    if (initialSelectedKey) {
      setSelectedKey(initialSelectedKey);
      const def = ALL_UPGRADES.find((u) => u.key === initialSelectedKey);
      if (def && selectedCategory !== 'all' && def.category !== selectedCategory) {
        setSelectedCategory('all');
      }
    }
  }, [initialSelectedKey]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        sound.playUpgrade();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter upgrades based on category and search query
  const filteredUpgrades = useMemo(() => {
    return ALL_UPGRADES.filter((u) => {
      // Category match
      if (selectedCategory !== 'all' && u.category !== selectedCategory) {
        return false;
      }
      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const detail = CODEX_DETAILS[u.key];
        const matchName = u.nameZh.toLowerCase().includes(query) || u.name.toLowerCase().includes(query);
        const matchDesc = u.desc.toLowerCase().includes(query);
        const matchRole = detail?.primaryRole.toLowerCase().includes(query) || false;
        const matchArchetype = detail?.recommendedArchetype.toLowerCase().includes(query) || false;
        const matchTip = detail?.tacticalTip.toLowerCase().includes(query) || false;
        const matchSynergy = detail?.synergies.some(s => synergyLabel(s.targetKey).toLowerCase().includes(query) || s.synergyTitle.toLowerCase().includes(query)) || false;
        return matchName || matchDesc || matchRole || matchArchetype || matchTip || matchSynergy;
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  // Active selected upgrade
  const selectedUpgrade = useMemo(() => {
    return ALL_UPGRADES.find((u) => u.key === selectedKey) || filteredUpgrades[0] || ALL_UPGRADES[0];
  }, [selectedKey, filteredUpgrades]);

  const selectedDetail: CodexDetail | undefined = useMemo(() => {
    return CODEX_DETAILS[selectedUpgrade?.key || ''];
  }, [selectedUpgrade]);

  if (!isOpen) return null;

  const getCategoryMeta = (cat: string) => {
    switch (cat) {
      case 'ballistic':
        return {
          label: '弹道工程',
          text: 'text-cyan-400',
          bg: 'bg-cyan-950/60',
          border: 'border-cyan-500/40',
          activeBg: 'bg-cyan-500 text-slate-950',
          glow: 'shadow-[0_0_15px_rgba(0,255,204,0.3)]',
          badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
          icon: Crosshair,
        };
      case 'energy':
        return {
          label: '高维能量',
          text: 'text-purple-400',
          bg: 'bg-purple-950/60',
          border: 'border-purple-500/40',
          activeBg: 'bg-purple-500 text-white',
          glow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]',
          badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
          icon: Zap,
        };
      case 'summon':
        return {
          label: '智械机群',
          text: 'text-emerald-400',
          bg: 'bg-emerald-950/60',
          border: 'border-emerald-500/40',
          activeBg: 'bg-emerald-500 text-slate-950',
          glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]',
          badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          icon: Bot,
        };
      case 'defense':
        return {
          label: '装甲防卫',
          text: 'text-amber-400',
          bg: 'bg-amber-950/60',
          border: 'border-amber-500/40',
          activeBg: 'bg-amber-500 text-slate-950',
          glow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]',
          badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          icon: Shield,
        };
      case 'tactical':
        return {
          label: '战术战律',
          text: 'text-rose-400',
          bg: 'bg-rose-950/60',
          border: 'border-rose-500/40',
          activeBg: 'bg-rose-500 text-white',
          glow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]',
          badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
          icon: Layers,
        };
      default:
        return {
          label: '全部流派',
          text: 'text-slate-300',
          bg: 'bg-slate-900',
          border: 'border-slate-700',
          activeBg: 'bg-cyan-400 text-slate-950',
          glow: 'shadow-none',
          badge: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: Sparkles,
        };
    }
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return { label: '普通', color: 'text-slate-300 bg-slate-800 border-slate-700' };
      case 'rare':
        return { label: '稀有', color: 'text-cyan-300 bg-cyan-950/60 border-cyan-500/40' };
      case 'epic':
        return { label: '史诗', color: 'text-purple-300 bg-purple-950/60 border-purple-500/40' };
      case 'legendary':
        return { label: '传说', color: 'text-amber-300 bg-amber-950/60 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.3)]' };
      default:
        return { label: '强化', color: 'text-slate-300 bg-slate-800 border-slate-700' };
    }
  };

  const handleSelectCard = (key: string) => {
    sound.playUpgrade();
    setSelectedKey(key);
    if (detailContainerRef.current) {
      detailContainerRef.current.scrollTop = 0;
    }
  };

  const handleJumpToSynergy = (targetKey: string) => {
    sound.playUpgrade();
    setSelectedKey(targetKey);
    // If the target key is not in current category filter, reset to all
    const targetDef = ALL_UPGRADES.find((u) => u.key === targetKey);
    if (targetDef && selectedCategory !== 'all' && targetDef.category !== selectedCategory) {
      setSelectedCategory('all');
    }
    if (detailContainerRef.current) {
      detailContainerRef.current.scrollTop = 0;
    }
  };

  const handleTabChange = (tab: CategoryTab) => {
    sound.playUpgrade();
    setSelectedCategory(tab);
  };

  const currentLvlInRun = selectedUpgrade ? (currentUpgradeLevels[selectedUpgrade.key] || 0) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Outer Shell */}
      <div className="relative w-full max-w-6xl h-[92vh] flex flex-col rounded-2xl bg-gradient-to-b from-[#080d1a] via-[#05070e] to-[#030408] border border-cyan-500/30 shadow-[0_0_50px_rgba(0,255,204,0.15)] overflow-hidden">
        {/* Top Decorative Border Light */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(0,255,204,0.3)]">
              <Bookmark size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                  科技档案全维图鉴
                </h2>
                <span className="text-[10px] font-mono-numbers px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold">
                  CODEX ARCHIVES
                </span>
              </div>
              <p className="text-xs text-slate-400">
                全 25 项几何度规科技模块 · 等级阶梯与协同羁绊全息透视
              </p>
            </div>
          </div>

          {/* Search Bar & Close */}
          <div className="flex items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
              />
              <input
                type="text"
                placeholder="检索模块、流派或词条..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-0.5"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <button
              onClick={() => {
                sound.playUpgrade();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="关闭图鉴 (ESC)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Category Tabs Filter */}
        <div className="px-4 sm:px-6 py-2 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(
            [
              { key: 'all', label: '全部收录 (25)', icon: Sparkles },
              { key: 'ballistic', label: '弹道工程 (7)', icon: Crosshair },
              { key: 'energy', label: '高维能量 (4)', icon: Zap },
              { key: 'summon', label: '智械机群 (5)', icon: Bot },
              { key: 'defense', label: '装甲防卫 (5)', icon: Shield },
              { key: 'tactical', label: '战术战律 (4)', icon: Layers },
            ] as const
          ).map((tab) => {
            const isActive = selectedCategory === tab.key;
            const Icon = tab.icon;
            const meta = getCategoryMeta(tab.key);
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer border ${
                  isActive
                    ? `${meta.activeBg} ${meta.border} font-bold shadow-md`
                    : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800'
                }`}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content: Split Grid + Detailed Inspector */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Left Column: Upgrade Card Grid */}
          <div className="md:col-span-5 lg:col-span-5 border-r border-slate-800/80 flex flex-col min-h-0 bg-slate-950/20">
            {/* Header info */}
            <div className="px-4 py-2 border-b border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono-numbers">
              <span>匹配到 {filteredUpgrades.length} 个科技模块</span>
              <span>点击卡片查看阶梯与羁绊</span>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredUpgrades.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-500 gap-2">
                  <Filter size={32} className="opacity-40" />
                  <span className="text-xs">未找到匹配的科技模块</span>
                </div>
              ) : (
                filteredUpgrades.map((u) => {
                  const isSelected = selectedUpgrade?.key === u.key;
                  const meta = getCategoryMeta(u.category);
                  const rarity = getRarityBadge(u.rarity);
                  const Icon = meta.icon;
                  const lvlInRun = currentUpgradeLevels[u.key] || 0;

                  return (
                    <div
                      key={u.key}
                      onClick={() => handleSelectCard(u.key)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${
                        isSelected
                          ? `${meta.bg} ${meta.border} ${meta.glow} ring-1 ring-cyan-400/50`
                          : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`p-2 rounded-lg ${meta.badge} border flex items-center justify-center`}
                          >
                            <Icon size={16} className={meta.text} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                                {u.nameZh}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded border font-mono-numbers ${rarity.color}`}
                              >
                                {rarity.label}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono tracking-tight block">
                              {u.name}
                            </span>
                          </div>
                        </div>

                        {/* Level badge */}
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-mono-numbers text-slate-400">
                            最高 Lv.{u.maxLevel}
                          </span>
                          {lvlInRun > 0 && (
                            <span className="text-[10px] font-mono-numbers text-emerald-400 font-semibold">
                              已选 Lv.{lvlInRun}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {u.desc}
                      </p>

                      <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800/60">
                        <span className={`text-[10px] font-medium ${meta.text}`}>
                          {meta.label}
                        </span>
                        <span className="text-slate-500 flex items-center gap-0.5 text-[10px]">
                          查看档案 <ChevronRight size={11} />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Deep Inspection Dossier */}
          <div
            ref={detailContainerRef}
            className="md:col-span-7 lg:col-span-7 flex flex-col min-h-0 overflow-y-auto p-4 sm:p-6 bg-slate-900/30 space-y-6"
          >
            {selectedUpgrade && selectedDetail && (
              <>
                {/* Dossier Header */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3 relative overflow-hidden">
                  {/* Subtle category glow in corner */}
                  <div
                    className={`absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${
                      selectedUpgrade.category === 'ballistic'
                        ? 'bg-cyan-400'
                        : selectedUpgrade.category === 'energy'
                        ? 'bg-purple-400'
                        : selectedUpgrade.category === 'summon'
                        ? 'bg-emerald-400'
                        : selectedUpgrade.category === 'defense'
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                  />

                  <div className="flex items-start justify-between gap-3 relative z-10">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-3 rounded-xl border ${
                          getCategoryMeta(selectedUpgrade.category).badge
                        } flex items-center justify-center`}
                      >
                        {React.createElement(getCategoryMeta(selectedUpgrade.category).icon, {
                          size: 24,
                          className: getCategoryMeta(selectedUpgrade.category).text,
                        })}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-2xl font-black text-white tracking-wide">
                            {selectedUpgrade.nameZh}
                          </h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border font-mono-numbers ${
                              getRarityBadge(selectedUpgrade.rarity).color
                            }`}
                          >
                            {getRarityBadge(selectedUpgrade.rarity).label}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${
                              getCategoryMeta(selectedUpgrade.category).badge
                            }`}
                          >
                            {getCategoryMeta(selectedUpgrade.category).label}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">
                          {selectedUpgrade.name} // KEY: {selectedUpgrade.key}
                        </span>
                      </div>
                    </div>

                    {/* Run status */}
                    <div className="text-right shrink-0">
                      <div className="text-xs text-slate-400 font-mono-numbers">
                        上限: <span className="text-white font-bold">Lv.{selectedUpgrade.maxLevel}</span>
                      </div>
                      {currentLvlInRun > 0 ? (
                        <div className="text-xs font-mono-numbers text-emerald-400 font-bold flex items-center justify-end gap-1 mt-0.5">
                          <CheckCircle2 size={13} />
                          <span>本局已装载 Lv.{currentLvlInRun}</span>
                        </div>
                      ) : (
                        <div className="text-[11px] font-mono-numbers text-slate-500 mt-0.5">
                          本局未装载
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Flavor Quote */}
                  <blockquote className="text-xs italic text-slate-400 border-l-2 border-cyan-500/50 pl-3 py-1 bg-slate-950/40 rounded-r-lg font-serif">
                    “{selectedDetail.quote}”
                  </blockquote>

                  {/* Role & Archetype Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono-numbers">
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2">
                      <Sliders size={14} className="text-cyan-400 shrink-0" />
                      <div>
                        <span className="text-slate-500 block text-[10px]">战略定位 (ROLE)</span>
                        <span className="text-slate-200 font-semibold font-sans">{selectedDetail.primaryRole}</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2">
                      <Compass size={14} className="text-purple-400 shrink-0" />
                      <div>
                        <span className="text-slate-500 block text-[10px]">推荐核心流派 (ARCHETYPE)</span>
                        <span className="text-slate-200 font-semibold font-sans">{selectedDetail.recommendedArchetype}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Level-by-Level Progression Ladder */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      <Layers size={16} className="text-cyan-400" />
                      <span>等级阶梯全息透视 (LEVEL PROGRESSION)</span>
                    </div>
                    <span className="text-xs font-mono-numbers text-slate-400">
                      共 {selectedDetail.levels.length} 个等级阶段
                    </span>
                  </div>

                  <div className="space-y-2 font-sans">
                    {selectedDetail.levels.map((lvl, idx) => {
                      // Level number and the MAX flag are derived from the upgrade's
                      // own maxLevel, so the ladder can never disagree with the data table.
                      const level = idx + 1;
                      const isMax = level >= selectedUpgrade.maxLevel;
                      const isCurrent = currentLvlInRun === level;
                      const isReached = currentLvlInRun >= level;
                      return (
                        <div
                          key={level}
                          className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                            isMax
                              ? 'bg-amber-950/20 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                              : isCurrent
                              ? 'bg-cyan-950/30 border-cyan-500/50 ring-1 ring-cyan-500/40'
                              : 'bg-slate-900/60 border-slate-800/80'
                          }`}
                        >
                          {/* Level badge number */}
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono-numbers font-black text-xs shrink-0 ${
                              isMax
                                ? 'bg-amber-500 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                                : isReached
                                ? 'bg-cyan-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {isMax ? 'MAX' : `Lv.${level}`}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`text-xs font-bold ${
                                  isMax ? 'text-amber-300' : 'text-slate-200'
                                }`}
                              >
                                {lvl.title}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono-numbers border border-cyan-500/40 font-semibold">
                                  ● 当前阶段
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                              {lvl.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Synergies & Combos */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      <Sparkles size={16} className="text-purple-400" />
                      <span>流派协同与羁绊连携 (SYNERGIES & COMBOS)</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      点击羁绊卡可直接跳转对应模块
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedDetail.synergies.map((syn) => {
                      const synUpgrade = ALL_UPGRADES.find((u) => u.key === syn.targetKey);
                      const synMeta = getCategoryMeta(synUpgrade?.category || 'ballistic');
                      return (
                        <div
                          key={syn.targetKey}
                          onClick={() => handleJumpToSynergy(syn.targetKey)}
                          className="p-3 rounded-xl bg-slate-900/70 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer group flex flex-col justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                                  {synergyLabel(syn.targetKey)}
                                </span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${synMeta.badge}`}
                                >
                                  {synMeta.label}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono-numbers text-purple-400 font-semibold">
                                [{syn.synergyTitle}]
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                              {syn.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-end text-[10px] text-cyan-400 font-mono-numbers group-hover:translate-x-0.5 transition-transform">
                            <span>查阅此强化</span>
                            <ArrowRight size={10} className="ml-1" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tactical Pro-Tip */}
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                    <Info size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-300 block">
                      战术心法 (TACTICAL PRO-TIP)
                    </span>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {selectedDetail.tacticalTip}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-2.5 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-slate-300">
              提示：局内每次升级将从上述 25 种模块中按流派倾向智能加权抽取
            </span>
          </div>
          <button
            onClick={() => {
              sound.playUpgrade();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            返回
          </button>
        </div>
      </div>
    </div>
  );
};

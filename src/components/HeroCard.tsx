import React, { useState } from 'react';
import {
  Shield,
  Sword,
  BookOpen,
  Heart,
  Zap,
  Sparkles,
  Plus,
  Flame,
  Award,
  ArrowUpCircle,
  Clock,
  Compass,
} from 'lucide-react';
import { Character, CharacterStats, InventoryItem } from '../types.js';
import { soundEngine } from '../utils/soundEngine.js';

interface HeroCardProps {
  character: Character;
  stats: CharacterStats | null;
  equippedItems: InventoryItem[];
  onAllocatePoints: (points: {
    strength?: number;
    intellect?: number;
    vitality?: number;
    spirit?: number;
    agility?: number;
  }) => Promise<void>;
}

export const HeroCard: React.FC<HeroCardProps> = ({
  character,
  stats,
  equippedItems,
  onAllocatePoints,
}) => {
  const [allocating, setAllocating] = useState(false);
  const [pendingPoints, setPendingPoints] = useState({
    strength: 0,
    intellect: 0,
    vitality: 0,
    spirit: 0,
    agility: 0,
  });

  const availablePoints = (stats?.stat_points_available || 0) -
    (pendingPoints.strength +
      pendingPoints.intellect +
      pendingPoints.vitality +
      pendingPoints.spirit +
      pendingPoints.agility);

  const handlePointChange = (attr: keyof typeof pendingPoints, delta: number) => {
    if (delta > 0 && availablePoints <= 0) return;
    if (delta < 0 && pendingPoints[attr] <= 0) return;

    soundEngine.playClick();
    setPendingPoints((prev) => ({
      ...prev,
      [attr]: prev[attr] + delta,
    }));
  };

  const handleCommitAllocation = async () => {
    const totalPending =
      pendingPoints.strength +
      pendingPoints.intellect +
      pendingPoints.vitality +
      pendingPoints.spirit +
      pendingPoints.agility;
    if (totalPending <= 0) return;

    soundEngine.playLevelUp();
    await onAllocatePoints(pendingPoints);
    setPendingPoints({ strength: 0, intellect: 0, vitality: 0, spirit: 0, agility: 0 });
    setAllocating(false);
  };

  // Attribute definitions with thematic real-world pairing
  const attributes = [
    {
      key: 'intellect',
      name: 'Intellect',
      base: stats?.intellect || 10,
      icon: BookOpen,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/30',
      taskExample: 'Coding, Books, Problem Solving',
    },
    {
      key: 'strength',
      name: 'Strength',
      base: stats?.strength || 10,
      icon: Sword,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/30',
      taskExample: 'Gym, Resistance Training, Sports',
    },
    {
      key: 'vitality',
      name: 'Vitality',
      base: stats?.vitality || 10,
      icon: Heart,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/30',
      taskExample: 'Pristine Sleep, 2.5L Water, Clean Food',
    },
    {
      key: 'spirit',
      name: 'Spirit',
      base: stats?.spirit || 10,
      icon: Sparkles,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      taskExample: 'Meditation, Journaling, Gratitude',
    },
    {
      key: 'agility',
      name: 'Agility',
      base: stats?.agility || 10,
      icon: Clock,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/30',
      taskExample: 'Quick Chores, Inbox Zero, Errands',
    },
  ];

  // Equipped gear lookup
  const weapon = equippedItems.find((i) => i.type === 'weapon');
  const armor = equippedItems.find((i) => i.type === 'armor');
  const accessory = equippedItems.find((i) => i.type === 'accessory');

  return (
    <div className="bg-[#0f172a]/90 border border-slate-800/90 rounded-2xl p-5 lg:p-6 shadow-xl backdrop-blur-md relative">
      {/* Top Banner: Avatar & Class */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-5 border-b border-slate-800">
        {/* Crest Frame */}
        <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-indigo-900/40 border-2 border-amber-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.25)] shrink-0">
          <Shield className="w-10 h-10 text-amber-400" />
          <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold font-mono text-[10px] shadow-md">
            Lvl {character.level}
          </div>
        </div>

        {/* Character Title & Vitals */}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-xl font-bold font-serif text-amber-100" style={{ fontFamily: 'Cinzel, serif' }}>
              {character.name}
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono">
              {character.class}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center justify-center sm:justify-start gap-1">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Title: {character.avatar_badge}</span>
          </p>

          {/* Quick Metrics */}
          <div className="mt-3 grid grid-cols-3 gap-2 text-center max-w-sm">
            <div className="px-2 py-1 rounded-xl bg-slate-900/70 border border-slate-800">
              <span className="block text-[10px] text-slate-400 uppercase font-mono">Health</span>
              <span className="text-xs font-bold text-rose-400 font-mono">
                {character.hp}/{character.max_hp}
              </span>
            </div>
            <div className="px-2 py-1 rounded-xl bg-slate-900/70 border border-slate-800">
              <span className="block text-[10px] text-slate-400 uppercase font-mono">Mana</span>
              <span className="text-xs font-bold text-cyan-400 font-mono">
                {character.mana}/{character.max_mana}
              </span>
            </div>
            <div className="px-2 py-1 rounded-xl bg-slate-900/70 border border-slate-800">
              <span className="block text-[10px] text-slate-400 uppercase font-mono">Streak Bonus</span>
              <span className="text-xs font-bold text-orange-400 font-mono">
                +{Math.min(50, character.streak_days * 5)}%
              </span>
            </div>
          </div>
        </div>

        {/* Level Up Point Notification Badge */}
        {(stats?.stat_points_available || 0) > 0 && !allocating && (
          <button
            id="open-stat-allocation-btn"
            onClick={() => {
              soundEngine.playClick();
              setAllocating(true);
            }}
            className="sm:self-center px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(245,158,11,0.4)] animate-pulse flex items-center gap-1.5"
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>+{stats?.stat_points_available} Stat Points Available</span>
          </button>
        )}
      </div>

      {/* Point Allocation Sub-Panel (if active) */}
      {allocating && (
        <div className="my-4 p-4 rounded-xl bg-amber-950/25 border border-amber-500/40 animate-fadeIn">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold font-mono text-amber-300 uppercase tracking-wider">
              Allocate Training Points (Unassigned: {availablePoints})
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setAllocating(false);
                  setPendingPoints({ strength: 0, intellect: 0, vitality: 0, spirit: 0, agility: 0 });
                }}
                className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1"
              >
                Cancel
              </button>
              <button
                id="confirm-stat-allocation-btn"
                onClick={handleCommitAllocation}
                disabled={
                  pendingPoints.strength +
                    pendingPoints.intellect +
                    pendingPoints.vitality +
                    pendingPoints.spirit +
                    pendingPoints.agility ===
                  0
                }
                className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs disabled:opacity-40"
              >
                Inscribe Stats
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {attributes.map((attr) => {
              const key = attr.key as keyof typeof pendingPoints;
              return (
                <div key={attr.key} className="p-2 rounded-lg bg-slate-900 border border-slate-700/80 text-center">
                  <span className="text-[11px] text-slate-300 font-semibold block">{attr.name}</span>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <button
                      onClick={() => handlePointChange(key, -1)}
                      disabled={pendingPoints[key] <= 0}
                      className="w-6 h-6 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 text-xs font-bold"
                    >
                      -
                    </button>
                    <span className="font-mono text-xs text-amber-300 font-bold">
                      +{pendingPoints[key]}
                    </span>
                    <button
                      onClick={() => handlePointChange(key, 1)}
                      disabled={availablePoints <= 0}
                      className="w-6 h-6 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 disabled:opacity-30 text-xs font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Core RPG Attributes Grid */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Discipline Attributes (Auto-leveled by real tasks)
          </span>
          <span className="text-[10px] text-slate-400">
            Total Discipline: {attributes.reduce((acc, a) => acc + a.base, 0)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {attributes.map((attr) => {
            const Icon = attr.icon;
            return (
              <div
                key={attr.key}
                className={`p-3 rounded-xl border ${attr.bg} flex flex-col justify-between transition-all hover:scale-[1.01]`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-4 h-4 ${attr.color}`} />
                    <span className="text-xs font-bold text-slate-200">{attr.name}</span>
                  </div>
                  <span className="font-mono text-base font-black text-amber-300">
                    {attr.base}
                  </span>
                </div>
                <div className="mt-2 text-[10px] text-slate-400 line-clamp-1" title={attr.taskExample}>
                  {attr.taskExample}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Equipped Relics & Gear Strip */}
      <div className="mt-5 pt-4 border-t border-slate-800">
        <span className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
          Active Equipment & Relics
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Weapon Slot */}
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Sword className="w-4 h-4 text-amber-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Weapon</span>
              <span className="text-xs font-semibold text-slate-200 truncate block">
                {weapon ? weapon.name : 'Empty (Visit Bazaar)'}
              </span>
              {weapon && (
                <span className="text-[10px] text-amber-400 font-mono">
                  +{weapon.stat_boost_val} {weapon.stat_boost_type}
                </span>
              )}
            </div>
          </div>

          {/* Armor Slot */}
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Armor</span>
              <span className="text-xs font-semibold text-slate-200 truncate block">
                {armor ? armor.name : 'Empty (Visit Bazaar)'}
              </span>
              {armor && (
                <span className="text-[10px] text-indigo-400 font-mono">
                  +{armor.stat_boost_val} {armor.stat_boost_type}
                </span>
              )}
            </div>
          </div>

          {/* Accessory Slot */}
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Accessory</span>
              <span className="text-xs font-semibold text-slate-200 truncate block">
                {accessory ? accessory.name : 'Empty (Visit Bazaar)'}
              </span>
              {accessory && (
                <span className="text-[10px] text-purple-400 font-mono">
                  +{accessory.stat_boost_val} {accessory.stat_boost_type}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

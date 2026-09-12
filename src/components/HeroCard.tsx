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
    soundEngine.playLevelUp();
    await onAllocatePoints(pendingPoints);
    setPendingPoints({
      strength: 0,
      intellect: 0,
      vitality: 0,
      spirit: 0,
      agility: 0,
    });
    setAllocating(false);
  };

  const attributes = [
    {
      key: 'intellect',
      name: 'Intellect',
      base: stats?.intellect || 10,
      icon: BookOpen,
      color: 'text-indigo-400',
      bg: 'bg-indigo-950/40 border-indigo-500/30',
      taskExample: 'Reading, coding, studying, deep work',
    },
    {
      key: 'strength',
      name: 'Strength',
      base: stats?.strength || 10,
      icon: Sword,
      color: 'text-amber-400',
      bg: 'bg-amber-950/40 border-amber-500/30',
      taskExample: 'Gym, calisthenics, manual labor, pushups',
    },
    {
      key: 'vitality',
      name: 'Vitality',
      base: stats?.vitality || 10,
      icon: Heart,
      color: 'text-rose-400',
      bg: 'bg-rose-950/40 border-rose-500/30',
      taskExample: 'Hydration, clean nutrition, 8h sleep',
    },
    {
      key: 'spirit',
      name: 'Spirit',
      base: stats?.spirit || 10,
      icon: Sparkles,
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/40 border-emerald-500/30',
      taskExample: 'Meditation, journaling, gratitude',
    },
    {
      key: 'agility',
      name: 'Agility',
      base: stats?.agility || 10,
      icon: Clock,
      color: 'text-cyan-400',
      bg: 'bg-cyan-950/40 border-cyan-500/30',
      taskExample: 'Quick chores, replying to emails, errands',
    },
  ];

  // Equipped gear lookup
  const weapon = equippedItems.find((i) => i.type === 'weapon');
  const armor = equippedItems.find((i) => i.type === 'armor');
  const accessory = equippedItems.find((i) => i.type === 'accessory');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 lg:p-6 shadow-xl relative transition-colors text-slate-100">
      {/* Top Banner: Avatar & Class */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-5 border-b border-slate-800">
        {/* Crest Frame */}
        <div className="relative w-20 h-20 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 flex items-center justify-center shadow-md shrink-0">
          <Shield className="w-10 h-10 text-amber-400" />
          <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold font-mono text-[10px] shadow-sm">
            Lvl {character.level}
          </div>
        </div>

        {/* Character Title & Vitals */}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-xl font-bold font-serif text-white" style={{ fontFamily: 'Cinzel, serif' }}>
              {character.name}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono font-semibold">
              {character.class}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center justify-center sm:justify-start gap-1">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Title: {character.avatar_badge}</span>
          </p>

          {/* Quick Metrics */}
          <div className="mt-3 grid grid-cols-3 gap-2 text-center max-w-sm">
            <div className="px-2 py-1.5 rounded-xl bg-slate-800 border border-slate-700">
              <span className="block text-[10px] text-slate-400 uppercase font-mono font-medium">Health</span>
              <span className="text-xs font-bold text-rose-400 font-mono">
                {character.hp}/{character.max_hp}
              </span>
            </div>
            <div className="px-2 py-1.5 rounded-xl bg-slate-800 border border-slate-700">
              <span className="block text-[10px] text-slate-400 uppercase font-mono font-medium">Mana</span>
              <span className="text-xs font-bold text-cyan-400 font-mono">
                {character.mana}/{character.max_mana}
              </span>
            </div>
            <div className="px-2 py-1.5 rounded-xl bg-slate-800 border border-slate-700">
              <span className="block text-[10px] text-slate-400 uppercase font-mono font-medium">Streak Bonus</span>
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
            className="sm:self-center px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md animate-pulse flex items-center gap-1.5 transition-colors"
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>+{stats?.stat_points_available} Stat Points Available</span>
          </button>
        )}
      </div>

      {/* Point Allocation Sub-Panel (if active) */}
      {allocating && (
        <div className="my-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 animate-fadeIn">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold font-mono text-amber-300 uppercase tracking-wider">
              Upgrade Your Stats ({availablePoints} points left)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setAllocating(false);
                  setPendingPoints({ strength: 0, intellect: 0, vitality: 0, spirit: 0, agility: 0 });
                }}
                className="text-xs text-slate-400 hover:text-white px-2 py-1"
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
                className="px-3.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs disabled:opacity-40"
              >
                Save Upgrades
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {attributes.map((attr) => {
              const key = attr.key as keyof typeof pendingPoints;
              return (
                <div key={attr.key} className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-center shadow-xs">
                  <span className="text-[11px] text-slate-200 font-bold block">{attr.name}</span>
                  <div className="flex items-center justify-center gap-2 mt-1.5">
                    <button
                      onClick={() => handlePointChange(key, -1)}
                      disabled={pendingPoints[key] <= 0}
                      className="w-6 h-6 rounded bg-slate-700 text-slate-200 hover:bg-slate-600 disabled:opacity-30 text-xs font-bold"
                    >
                      -
                    </button>
                    <span className="font-mono text-xs text-amber-400 font-bold">
                      +{pendingPoints[key]}
                    </span>
                    <button
                      onClick={() => handlePointChange(key, 1)}
                      disabled={availablePoints <= 0}
                      className="w-6 h-6 rounded bg-amber-500/30 border border-amber-500/50 text-amber-300 hover:bg-amber-500/50 disabled:opacity-30 text-xs font-bold"
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
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Hero Attributes (Grows as you complete tasks)
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            Total Stats Score: {attributes.reduce((acc, a) => acc + a.base, 0)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {attributes.map((attr) => {
            const Icon = attr.icon;
            return (
              <div
                key={attr.key}
                className={`p-3.5 rounded-xl border ${attr.bg} flex flex-col justify-between transition-all hover:border-slate-600`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-4 h-4 ${attr.color}`} />
                    <span className="text-xs font-bold text-white">{attr.name}</span>
                  </div>
                  <span className="font-mono text-base font-black text-white">
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
        <span className="block text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2">
          Equipped Gear
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Weapon Slot */}
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Sword className="w-4 h-4 text-amber-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-slate-400 block uppercase font-medium">Weapon</span>
              <span className="text-xs font-bold text-white truncate block">
                {weapon ? weapon.name : 'Empty (Buy in Shop)'}
              </span>
              {weapon && (
                <span className="text-[10px] text-amber-400 font-mono font-medium">
                  +{weapon.stat_boost_val} {weapon.stat_boost_type}
                </span>
              )}
            </div>
          </div>

          {/* Armor Slot */}
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-slate-400 block uppercase font-medium">Armor</span>
              <span className="text-xs font-bold text-white truncate block">
                {armor ? armor.name : 'Empty (Buy in Shop)'}
              </span>
              {armor && (
                <span className="text-[10px] text-indigo-400 font-mono font-medium">
                  +{armor.stat_boost_val} {armor.stat_boost_type}
                </span>
              )}
            </div>
          </div>

          {/* Accessory Slot */}
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-slate-400 block uppercase font-medium">Accessory</span>
              <span className="text-xs font-bold text-white truncate block">
                {accessory ? accessory.name : 'Empty (Buy in Shop)'}
              </span>
              {accessory && (
                <span className="text-[10px] text-purple-400 font-mono font-medium">
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

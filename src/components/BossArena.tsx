import React, { useState, useEffect } from 'react';
import { Shield, Sword, Skull, Flame, Sparkles, Award } from 'lucide-react';
import { BossEncounter } from '../types.js';
import { api } from '../utils/api.js';

interface BossArenaProps {
  onRefreshHero: () => Promise<void>;
}

export const BossArena: React.FC<BossArenaProps> = ({ onRefreshHero }) => {
  const [boss, setBoss] = useState<BossEncounter | null>(null);
  const [defeatedCount, setDefeatedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadBoss = async () => {
    try {
      setLoading(true);
      const data = await api.getBoss();
      setBoss(data.boss);
      setDefeatedCount(data.defeatedBossesCount);
    } catch (err) {
      console.error('Failed to load boss:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoss();
  }, []);

  if (loading || !boss) {
    return (
      <div className="p-8 text-center text-slate-400 font-mono text-xs">
        Loading boss encounter...
      </div>
    );
  }

  const hpPercent = Math.max(0, Math.min(100, (boss.current_hp / boss.max_hp) * 100));

  return (
    <div className="bg-slate-900 border border-rose-900/40 rounded-2xl p-6 shadow-xl relative overflow-hidden transition-colors text-slate-100">
      {/* Ambient Boss Glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-rose-900/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3.5 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-sm shrink-0">
            <Skull className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                Level {boss.level} Boss Battle
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {defeatedCount} Defeated
              </span>
            </div>
            <h2
              className="text-2xl font-black font-serif text-white tracking-wide mt-0.5"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              {boss.boss_name}
            </h2>
            <p className="text-xs text-slate-400 font-mono italic">{boss.boss_title}</p>
          </div>
        </div>

        {/* Boss Rewards Box */}
        <div className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-right text-xs">
          <span className="text-[10px] uppercase font-mono text-slate-400 font-medium block mb-0.5">
            Victory Reward
          </span>
          <div className="flex items-center gap-3 font-mono font-bold text-amber-400">
            <span>+{boss.reward_xp} XP</span>
            <span>+{boss.reward_gold} Coins</span>
          </div>
          <span className="text-[10px] text-purple-300 font-semibold flex items-center justify-end gap-1 mt-0.5">
            <Award className="w-3 h-3 text-purple-400" />
            Title: {boss.reward_badge}
          </span>
        </div>
      </div>

      {/* Main Boss Health Gauge & Visuals */}
      <div className="py-6">
        <div className="flex justify-between items-end mb-2">
          <div className="flex items-center gap-1.5 text-xs font-mono text-rose-400">
            <Flame className="w-4 h-4 text-rose-500 animate-bounce" />
            <span className="font-bold uppercase tracking-wider">Boss Health</span>
          </div>
          <span className="font-mono text-sm font-bold text-white">
            {boss.current_hp} / {boss.max_hp} HP ({Math.round(hpPercent)}%)
          </span>
        </div>

        {/* Outer Health Gauge */}
        <div className="h-5 w-full bg-slate-800 rounded-xl overflow-hidden p-0.5 border border-slate-700 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 rounded-lg transition-all duration-500 shadow-sm"
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      {/* Mechanics Explanation */}
      <div className="mt-2 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
          <Sword className="w-5 h-5" />
        </div>
        <div className="text-center sm:text-left">
          <h3 className="text-xs font-bold text-amber-300 uppercase font-mono">
            How Boss Fights Work
          </h3>
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
            Whenever you complete tasks and habits in real life, you automatically deal damage to the boss equal to the XP earned. Defeating the boss grants big bonus rewards and special titles!
          </p>
        </div>
      </div>
    </div>
  );
};

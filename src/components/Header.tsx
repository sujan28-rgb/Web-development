import React from 'react';
import { Sparkles, Flame, Coins, Heart, Zap, LogOut, Shield } from 'lucide-react';
import { Character } from '../types.js';
import { SoundToggle } from './SoundToggle.js';
import { soundEngine } from '../utils/soundEngine.js';

interface HeaderProps {
  character: Character | null;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ character, onLogout, activeTab, setActiveTab }) => {
  const hpPercent = character ? Math.min(100, Math.max(0, (character.hp / character.max_hp) * 100)) : 100;
  const manaPercent = character ? Math.min(100, Math.max(0, (character.mana / character.max_mana) * 100)) : 100;
  const xpPercent = character ? Math.min(100, Math.max(0, (character.current_xp / character.next_level_xp) * 100)) : 0;

  return (
    <header className="sticky top-0 z-40 bg-[#0c111d]/90 backdrop-blur-md border-b border-slate-800/80 shadow-lg px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Hero Identity */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 via-indigo-500/20 to-amber-700/30 border border-amber-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif font-black tracking-wider text-lg lg:text-xl text-amber-100 uppercase" style={{ fontFamily: 'Cinzel, serif' }}>
                  Chronocraft
                </h1>
                <span className="text-[10px] tracking-widest font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
                  Life RPG
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans hidden sm:block">
                Forge discipline into digital legend
              </p>
            </div>
          </div>

          {/* Quick controls for small screens */}
          <div className="flex md:hidden items-center gap-2">
            <SoundToggle />
            <button
              onClick={() => {
                soundEngine.playClick();
                onLogout();
              }}
              aria-label="Depart Realm"
              title="Depart Realm"
              className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-red-400"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Character Vitality & Currency Strip */}
        {character && (
          <div className="flex flex-wrap items-center justify-center gap-3 lg:gap-5 w-full md:w-auto">
            {/* Level & Class */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-amber-500/30 shadow-inner">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/50 flex items-center justify-center font-serif font-bold text-amber-300 text-xs">
                {character.level}
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-200 leading-none">
                  {character.name}
                </div>
                <div className="text-[10px] text-amber-400/80 font-mono tracking-wide leading-tight mt-0.5">
                  {character.class}
                </div>
              </div>
            </div>

            {/* HP Bar */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800" title={`Health Points: ${character.hp}/${character.max_hp}`}>
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500/30 shrink-0" />
              <div className="w-20 lg:w-28">
                <div className="flex justify-between text-[10px] text-slate-400 mb-0.5 font-mono">
                  <span>HP</span>
                  <span>{character.hp}/{character.max_hp}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full transition-all duration-300"
                    style={{ width: `${hpPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Mana Bar */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800" title={`Arcane Mana: ${character.mana}/${character.max_mana}`}>
              <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400/30 shrink-0" />
              <div className="w-16 lg:w-24">
                <div className="flex justify-between text-[10px] text-slate-400 mb-0.5 font-mono">
                  <span>MP</span>
                  <span>{character.mana}/{character.max_mana}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-300"
                    style={{ width: `${manaPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Currencies & Streaks */}
            <div className="flex items-center gap-2">
              {/* Gold */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-semibold shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>{character.gold}</span>
              </div>

              {/* Streak */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-300 font-mono text-xs font-semibold shadow-[0_0_10px_rgba(249,115,22,0.1)]" title={`${character.streak_days} Day Consecutive Streak! +${Math.min(50, character.streak_days * 5)}% Reward Multiplier`}>
                <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse fill-orange-400/40" />
                <span>{character.streak_days}d</span>
              </div>
            </div>

            {/* Desktop audio & logout */}
            <div className="hidden md:flex items-center gap-2 border-l border-slate-800 pl-3">
              <SoundToggle />
              <button
                id="logout-button"
                onClick={() => {
                  soundEngine.playClick();
                  onLogout();
                }}
                aria-label="Depart Realm (Logout)"
                title="Depart Realm (Logout)"
                className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-rose-400 hover:border-rose-500/40 hover:bg-slate-700/80 transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Global XP Progression Rail under Header */}
      {character && (
        <div className="mt-2.5 max-w-7xl mx-auto flex items-center gap-3">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider shrink-0">
            Lvl {character.level} Progress
          </span>
          <div className="h-1.5 flex-1 bg-slate-800/90 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-all duration-500"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-amber-300 shrink-0">
            {character.current_xp} / {character.next_level_xp} XP ({Math.round(xpPercent)}%)
          </span>
        </div>
      )}
    </header>
  );
};

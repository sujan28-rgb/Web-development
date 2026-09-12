import React from 'react';
import { Sparkles, Flame, Coins, Heart, Zap, LogOut, Sun, Moon } from 'lucide-react';
import { Character } from '../types.js';
import { SoundToggle } from './SoundToggle.js';
import { soundEngine } from '../utils/soundEngine.js';

interface HeaderProps {
  character: Character | null;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  character,
  onLogout,
  activeTab,
  setActiveTab,
  theme = 'dark',
  onToggleTheme,
}) => {
  const hpPercent = character ? Math.min(100, Math.max(0, (character.hp / character.max_hp) * 100)) : 100;
  const manaPercent = character ? Math.min(100, Math.max(0, (character.mana / character.max_mana) * 100)) : 100;
  const xpPercent = character ? Math.min(100, Math.max(0, (character.current_xp / character.next_level_xp) * 100)) : 0;

  const isDark = theme === 'dark';

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-md px-4 lg:px-8 py-3 transition-colors text-slate-100">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Hero Identity */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif font-black tracking-wider text-xl text-white uppercase" style={{ fontFamily: 'Cinzel, serif' }}>
                  LifeQuest
                </h1>
                <span className="text-[10px] tracking-widest font-mono uppercase px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold">
                  RPG
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans hidden sm:block">
                Level up your real life with RPG quests & AI proof verification
              </p>
            </div>
          </div>

          {/* Quick controls for small screens */}
          <div className="flex md:hidden items-center gap-2">
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                aria-label="Toggle Theme"
                title={`Switch to ${isDark ? 'Light' : 'Dark'} theme`}
                className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-amber-400 transition-colors"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}
            <SoundToggle />
            <button
              onClick={() => {
                soundEngine.playClick();
                onLogout();
              }}
              aria-label="Log Out"
              title="Log Out"
              className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Character Vitality & Currency Strip */}
        {character && (
          <div className="flex flex-wrap items-center justify-center gap-2.5 lg:gap-4 w-full md:w-auto">
            {/* Level & Class */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-serif font-bold text-xs flex items-center justify-center shadow-xs">
                {character.level}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-200 leading-none">
                  {character.name}
                </div>
                <div className="text-[10px] text-amber-400 font-mono font-medium tracking-wide leading-tight mt-0.5">
                  {character.class}
                </div>
              </div>
            </div>

            {/* HP Bar */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 shadow-xs" title={`Health: ${character.hp}/${character.max_hp}`}>
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20 shrink-0" />
              <div className="w-20 lg:w-28">
                <div className="flex justify-between text-[10px] text-slate-400 mb-0.5 font-mono font-medium">
                  <span>HP</span>
                  <span>{character.hp}/{character.max_hp}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-300"
                    style={{ width: `${hpPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Mana Bar */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 shadow-xs" title={`Mana: ${character.mana}/${character.max_mana}`}>
              <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400/20 shrink-0" />
              <div className="w-16 lg:w-24">
                <div className="flex justify-between text-[10px] text-slate-400 mb-0.5 font-mono font-medium">
                  <span>MP</span>
                  <span>{character.mana}/{character.max_mana}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                    style={{ width: `${manaPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Currencies & Streaks */}
            <div className="flex items-center gap-2">
              {/* Gold */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold shadow-xs" title="Coins earned from completing tasks">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>{character.gold}</span>
              </div>

              {/* Streak */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-300 font-mono text-xs font-bold shadow-xs" title={`${character.streak_days}-day streak! Gives a +${Math.min(50, character.streak_days * 5)}% bonus reward on tasks`}>
                <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-500/20" />
                <span>{character.streak_days}d</span>
              </div>
            </div>

            {/* Desktop controls & logout */}
            <div className="hidden md:flex items-center gap-2 border-l border-slate-800 pl-3">
              {onToggleTheme && (
                <button
                  onClick={onToggleTheme}
                  aria-label="Toggle Theme"
                  title={`Switch to ${isDark ? 'Light' : 'Dark'} theme`}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition-colors"
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              )}
              <SoundToggle />
              <button
                id="logout-button"
                onClick={() => {
                  soundEngine.playClick();
                  onLogout();
                }}
                aria-label="Log Out"
                title="Log Out"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-colors"
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
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold shrink-0">
            Lvl {character.level} Progress
          </span>
          <div className="h-2 flex-1 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
          <span className="text-[10px] font-mono font-semibold text-slate-300 shrink-0">
            {character.current_xp} / {character.next_level_xp} XP ({Math.round(xpPercent)}%)
          </span>
        </div>
      )}
    </header>
  );
};

import React, { useEffect } from 'react';
import { Trophy, Sparkles, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEngine } from '../utils/soundEngine.js';

interface LevelUpModalProps {
  newLevel: number;
  onClose: () => void;
  onOpenStatAllocation: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  newLevel,
  onClose,
  onOpenStatAllocation,
}) => {
  useEffect(() => {
    soundEngine.playLevelUp();
    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#6366f1', '#10b981', '#ffffff'],
      });
    } catch (_) {}
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md bg-white border-2 border-amber-400 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
        {/* Background Sunburst */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-200/40 via-transparent to-transparent pointer-events-none" />

        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-md flex items-center justify-center mb-5 animate-bounce">
          <div className="w-full h-full bg-amber-50 rounded-[22px] flex items-center justify-center">
            <Trophy className="w-10 h-10 text-amber-600" />
          </div>
        </div>

        <span className="inline-block px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-900 font-mono text-xs uppercase tracking-widest font-bold mb-2">
          Level Up!
        </span>

        <h2
          className="text-3xl font-black font-serif text-slate-900 uppercase tracking-wide"
          style={{ fontFamily: 'Cinzel, serif' }}
        >
          You Reached Level {newLevel}!
        </h2>

        <p className="mt-2 text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
          Great work on completing your tasks! Your health and mana have been fully restored.
        </p>

        <div className="my-5 p-3 rounded-xl bg-amber-50 border border-amber-300 font-mono text-xs text-amber-900 font-bold flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>+3 Stat Points Available to Assign</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
              onOpenStatAllocation();
            }}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xs flex items-center justify-center gap-2 transition-colors"
          >
            <span>Assign Points</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-full sm:w-auto px-4 py-3 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
};

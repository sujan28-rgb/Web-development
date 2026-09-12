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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-[#0f172a] border-2 border-amber-500 rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(245,158,11,0.4)] relative overflow-hidden">
        {/* Arcane Background Sunburst */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent pointer-events-none" />

        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 shadow-[0_0_30px_rgba(245,158,11,0.6)] flex items-center justify-center mb-5 animate-bounce">
          <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
            <Trophy className="w-10 h-10 text-amber-400" />
          </div>
        </div>

        <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs uppercase tracking-widest font-bold mb-2">
          Transcendence Achieved
        </span>

        <h2
          className="text-3xl font-black font-serif text-amber-100 uppercase tracking-wide"
          style={{ fontFamily: 'Cinzel, serif' }}
        >
          Level {newLevel} Attained!
        </h2>

        <p className="mt-2 text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
          Your sustained dedication has unlocked new thresholds of power. Health & Mana fully restored!
        </p>

        <div className="my-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 font-mono text-xs text-amber-300 font-semibold flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>+3 Attribute Points Ready to Inscribe</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
              onOpenStatAllocation();
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-950/50 flex items-center justify-center gap-2"
          >
            <span>Assign Attribute Points</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-full sm:w-auto px-4 py-3 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-semibold"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
};

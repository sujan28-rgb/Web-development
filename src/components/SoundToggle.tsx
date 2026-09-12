import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine.js';

export const SoundToggle: React.FC = () => {
  const [muted, setMuted] = useState(soundEngine.getIsMuted());

  const handleToggle = () => {
    const nextMuted = soundEngine.toggleMute();
    setMuted(nextMuted);
    if (!nextMuted) {
      soundEngine.playClick();
    }
  };

  return (
    <button
      id="sound-toggle-btn"
      onClick={handleToggle}
      aria-label={muted ? 'Unmute Sound' : 'Mute Sound'}
      title={muted ? 'Unmute Sound FX' : 'Mute Sound FX'}
      className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-amber-400 hover:border-amber-500/50 hover:bg-slate-700/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
    >
      {muted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
    </button>
  );
};

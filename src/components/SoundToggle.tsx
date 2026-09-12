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
      className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-amber-700 hover:border-amber-300 hover:bg-amber-50 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/40"
    >
      {muted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-amber-600" />}
    </button>
  );
};

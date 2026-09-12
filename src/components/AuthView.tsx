import React, { useState } from 'react';
import { Sparkles, Shield, Sword, BookOpen, Clock, Heart, ArrowRight, Play, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../utils/api.js';
import { soundEngine } from '../utils/soundEngine.js';

interface AuthViewProps {
  onAuthSuccess: () => void;
}

const CHARACTER_CLASSES = [
  {
    id: 'Iron Paladin',
    title: 'Iron Paladin',
    desc: 'Unshakable discipline, heavy lifts, and physical grit.',
    perk: '+4 Strength, +3 Vitality',
    icon: Shield,
    accent: 'from-amber-600/30 to-red-600/20 text-amber-300 border-amber-500/40',
  },
  {
    id: 'Arcane Scholar',
    title: 'Arcane Scholar',
    desc: 'Deep work, algorithmic problem solving, and intellectual mastery.',
    perk: '+5 Intellect, +2 Spirit',
    icon: BookOpen,
    accent: 'from-indigo-600/30 to-cyan-600/20 text-cyan-300 border-cyan-500/40',
  },
  {
    id: 'Chronomancer',
    title: 'Chronomancer',
    desc: 'Time blocking, agile sprints, and relentless task velocity.',
    perk: '+4 Intellect, +3 Agility',
    icon: Clock,
    accent: 'from-emerald-600/30 to-teal-600/20 text-emerald-300 border-emerald-500/40',
  },
  {
    id: 'Verdant Druid',
    title: 'Verdant Druid',
    desc: 'Mindfulness, sleep hygiene, recovery, and spiritual peace.',
    perk: '+4 Spirit, +3 Vitality',
    icon: Heart,
    accent: 'from-green-600/30 to-emerald-600/20 text-green-300 border-green-500/40',
  },
  {
    id: 'Shadow Rogue',
    title: 'Shadow Rogue',
    desc: 'Rapid execution, inbox zero, and swift chore eradication.',
    perk: '+5 Agility, +2 Intellect',
    icon: Sword,
    accent: 'from-purple-600/30 to-fuchsia-600/20 text-purple-300 border-purple-500/40',
  },
];

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loginIdentifier, setLoginIdentifier] = useState('hero@chronocraft.io');
  const [password, setPassword] = useState('rpghero2026');
  
  // Register fields
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [charName, setCharName] = useState('');
  const [selectedClass, setSelectedClass] = useState('Arcane Scholar');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDemoPlay = async () => {
    setError(null);
    setLoading(true);
    soundEngine.playClick();
    try {
      await api.demoLogin();
      soundEngine.playLevelUp();
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to start demo hero');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    soundEngine.playClick();
    try {
      await api.login(loginIdentifier, password);
      soundEngine.playQuestComplete();
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed. Verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    soundEngine.playClick();
    try {
      await api.register(regUsername, regEmail, regPassword, charName, selectedClass);
      soundEngine.playLevelUp();
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Arcane Rune Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-amber-600/10 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-2xl z-10">
        {/* Title Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Full-Stack Life Progression Engine
          </div>
          <h1
            className="text-4xl sm:text-5xl font-extrabold tracking-tight text-amber-100 font-serif"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            CHRONOCRAFT
          </h1>
          <p className="mt-2 text-slate-400 max-w-md mx-auto text-sm sm:text-base">
            Mundane tasks become heroic triumphs. Level up your character, conquer dungeon bosses, and forge lifelong habits.
          </p>
        </div>

        {/* Demo Fast Track Callout */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
                Instant Evaluation Demo
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Test immediately as <strong>Sir Alden (Level 3 Iron Paladin)</strong> with active quests, boss raid, and bazaar gear pre-loaded.
            </p>
          </div>
          <button
            id="quick-demo-login-btn"
            onClick={handleDemoPlay}
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Play Demo Hero</span>
          </button>
        </div>

        {/* Auth Card */}
        <div className="bg-[#0f172a]/95 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Tabs */}
          <div className="flex border-b border-slate-800 mb-6">
            <button
              id="tab-login"
              onClick={() => {
                soundEngine.playClick();
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-3 text-center text-sm font-semibold transition-all border-b-2 ${
                mode === 'login'
                  ? 'border-amber-500 text-amber-300 bg-amber-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Summon Champion (Login)
            </button>
            <button
              id="tab-register"
              onClick={() => {
                soundEngine.playClick();
                setMode('register');
                setError(null);
              }}
              className={`flex-1 py-3 text-center text-sm font-semibold transition-all border-b-2 ${
                mode === 'register'
                  ? 'border-amber-500 text-amber-300 bg-amber-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Inscribe New Hero (Sign Up)
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-950/50 border border-rose-600/60 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Hero Username or Email
                </label>
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="e.g. hero@chronocraft.io"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Secret Passphrase
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-amber-50 font-bold text-sm tracking-wide shadow-lg shadow-amber-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Entering Realm...' : 'Awaken Hero'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="Vanguard"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="vanguard@realm.com"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Character Name
                  </label>
                  <input
                    type="text"
                    value={charName}
                    onChange={(e) => setCharName(e.target.value)}
                    placeholder="e.g. Elyas the Swift"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Passphrase (min 6 chars)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Class Selection */}
              <div className="pt-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-amber-400 mb-2">
                  Choose Hero Archetype & Starting Affinity
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {CHARACTER_CLASSES.map((cls) => {
                    const Icon = cls.icon;
                    const isSelected = selectedClass === cls.id;
                    return (
                      <div
                        key={cls.id}
                        onClick={() => {
                          soundEngine.playClick();
                          setSelectedClass(cls.id);
                        }}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400/80 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                          <span className="text-xs font-bold text-slate-200">{cls.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{cls.desc}</p>
                        <span className="text-[10px] font-mono text-amber-300/90 mt-1 block">
                          {cls.perk}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-amber-50 font-bold text-sm tracking-wide shadow-lg shadow-amber-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Forging Champion...' : 'Inscribe Grimoire & Begin Quest'}
                <Sparkles className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* SQLite Relational DB Integrity Badge */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Server-side SQLite Persistence • Anti-Cheat XP Engine • Cross-Device Auth</span>
          </div>
        </div>
      </div>
    </div>
  );
};

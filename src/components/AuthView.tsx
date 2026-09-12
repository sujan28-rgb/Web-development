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
    desc: 'Focus on workouts, fitness, and building physical strength.',
    perk: '+4 Strength, +3 Health',
    icon: Shield,
    accent: 'from-amber-600/30 to-red-600/20 text-amber-300 border-amber-500/40',
  },
  {
    id: 'Arcane Scholar',
    title: 'Arcane Scholar',
    desc: 'Focus on studying, deep work, reading, and problem solving.',
    perk: '+5 Intellect, +2 Spirit',
    icon: BookOpen,
    accent: 'from-indigo-600/30 to-cyan-600/20 text-cyan-300 border-cyan-500/40',
  },
  {
    id: 'Chronomancer',
    title: 'Chronomancer',
    desc: 'Focus on time management, productivity, and getting things done fast.',
    perk: '+4 Intellect, +3 Agility',
    icon: Clock,
    accent: 'from-emerald-600/30 to-teal-600/20 text-emerald-300 border-emerald-500/40',
  },
  {
    id: 'Verdant Druid',
    title: 'Verdant Druid',
    desc: 'Focus on wellness, good sleep, hydration, and mindfulness.',
    perk: '+4 Spirit, +3 Health',
    icon: Heart,
    accent: 'from-green-600/30 to-emerald-600/20 text-green-300 border-green-500/40',
  },
  {
    id: 'Shadow Rogue',
    title: 'Shadow Rogue',
    desc: 'Focus on quick daily tasks, organizing chores, and clearing your inbox.',
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden transition-colors">
      {/* Background Soft Warm Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-2xl z-10">
        {/* Title Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono uppercase tracking-widest mb-3 font-semibold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Turn Tasks Into an RPG Adventure
          </div>
          <h1
            className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 font-serif uppercase"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            LIFEQUEST
          </h1>
          <p className="mt-2 text-slate-600 max-w-md mx-auto text-sm sm:text-base leading-relaxed">
            Turn your daily to-dos and habits into an exciting game. Level up your hero, fight bosses, and build better habits every day.
          </p>
        </div>

        {/* Demo Fast Track Callout */}
        <div className="mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-mono font-bold text-amber-900 uppercase tracking-wider">
                Try Instant Demo
              </span>
            </div>
            <p className="text-xs text-slate-700 mt-1 leading-normal">
              Jump straight in as <strong>Sir Alden (Level 3 Paladin)</strong> with pre-loaded tasks, shop gear, and an active boss battle!
            </p>
          </div>
          <button
            id="quick-demo-login-btn"
            onClick={handleDemoPlay}
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm tracking-wide shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Play Demo Hero</span>
          </button>
        </div>

        {/* Auth Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              id="tab-login"
              onClick={() => {
                soundEngine.playClick();
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-3 text-center text-sm font-semibold transition-all border-b-2 ${
                mode === 'login'
                  ? 'border-amber-600 text-amber-900 bg-amber-50/50 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Log In
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
                  ? 'border-amber-600 text-amber-900 bg-amber-50/50 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 font-semibold mb-1">
                  Username or Email
                </label>
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="e.g. hero@lifequest.io"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 font-semibold mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm tracking-wide shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Log In & Continue'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 font-semibold mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="e.g. hero_user"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 font-semibold mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 font-semibold mb-1">
                    Hero Name
                  </label>
                  <input
                    type="text"
                    value={charName}
                    onChange={(e) => setCharName(e.target.value)}
                    placeholder="e.g. Elyas the Swift"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 font-semibold mb-1">
                    Password (at least 6 characters)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Class Selection */}
              <div className="pt-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-amber-900 font-bold mb-2">
                  Choose Your Starting Class
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
                            ? 'bg-amber-50 border-amber-400 shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-600' : 'text-slate-500'}`} />
                          <span className="text-xs font-bold text-slate-900">{cls.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">{cls.desc}</p>
                        <span className="text-[10px] font-mono text-amber-800 font-semibold mt-1 block">
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
                className="w-full mt-3 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm tracking-wide shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Creating Hero...' : 'Create Hero & Start Playing'}
                <Sparkles className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* User-friendly reliability note */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Automatic Save • Earn XP & Rewards • Offline & Cloud Sync</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { X, Sparkles, BookOpen, Sword, Heart, Clock, Compass } from 'lucide-react';
import { Task, TaskCategory, TaskType, TaskDifficulty } from '../types.js';
import { soundEngine } from '../utils/soundEngine.js';

interface NewQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    category: TaskCategory;
    type: TaskType;
    difficulty: TaskDifficulty;
    due_date?: string;
  }) => Promise<void>;
  editTask?: Task | null;
  streakDays: number;
}

const CATEGORIES: { id: TaskCategory; label: string; icon: any; hint: string }[] = [
  { id: 'intellect', label: 'Intellect', icon: BookOpen, hint: 'Coding, studying, deep reading' },
  { id: 'strength', label: 'Strength', icon: Sword, hint: 'Gym, workouts, heavy lifts' },
  { id: 'vitality', label: 'Vitality', icon: Heart, hint: 'Hydration, recovery, clean sleep' },
  { id: 'spirit', label: 'Spirit', icon: Sparkles, hint: 'Meditation, mindfulness, journaling' },
  { id: 'agility', label: 'Agility', icon: Clock, hint: 'Fast chores, inbox zero, errands' },
];

const DIFFICULTIES: { id: TaskDifficulty; label: string; baseXp: number; baseGold: number }[] = [
  { id: 'trivial', label: 'Trivial', baseXp: 15, baseGold: 10 },
  { id: 'easy', label: 'Easy', baseXp: 30, baseGold: 20 },
  { id: 'medium', label: 'Medium', baseXp: 60, baseGold: 45 },
  { id: 'hard', label: 'Hard', baseXp: 120, baseGold: 90 },
  { id: 'legendary', label: 'Legendary', baseXp: 250, baseGold: 200 },
];

export const NewQuestModal: React.FC<NewQuestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editTask,
  streakDays,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('intellect');
  const [type, setType] = useState<TaskType>('daily');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('medium');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description || '');
      setCategory(editTask.category);
      setType(editTask.type);
      setDifficulty(editTask.difficulty);
      setDueDate(editTask.due_date || new Date().toISOString().split('T')[0]);
    } else {
      setTitle('');
      setDescription('');
      setCategory('intellect');
      setType('daily');
      setDifficulty('medium');
      setDueDate(new Date().toISOString().split('T')[0]);
    }
  }, [editTask, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculate projected rewards
  const selectedDiff = DIFFICULTIES.find((d) => d.id === difficulty) || DIFFICULTIES[2];
  const streakBonus = Math.min(0.5, streakDays * 0.05);
  const projectedXp = Math.round(selectedDiff.baseXp * (1 + streakBonus));
  const projectedGold = Math.round(selectedDiff.baseGold * (1 + streakBonus));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;

    setSubmitting(true);
    soundEngine.playClick();
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category,
        type,
        difficulty,
        due_date: dueDate,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-xl bg-[#0e1424] border border-slate-700/80 rounded-2xl shadow-2xl p-6 relative overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2
              className="text-lg font-serif font-bold text-amber-100"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              {editTask ? 'Modify Inscribed Quest' : 'Inscribe New Quest'}
            </h2>
          </div>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
              Quest Title *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Write 500 lines of clean TypeScript code"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
              Grimoire Details / Sub-tasks (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Context, requirements, or focus conditions..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-amber-400 mb-2">
              Discipline Attribute (Which stat levels up?)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setCategory(cat.id);
                    }}
                    className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px] font-semibold">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quest Type & Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Cadence / Type
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['daily', 'habit', 'epic_quest'] as TaskType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setType(t);
                    }}
                    className={`py-2 px-1 rounded-lg border text-center text-xs font-semibold capitalize transition-all ${
                      type === t
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {t === 'epic_quest' ? 'Epic Bounty' : t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Difficulty Tier
              </label>
              <select
                value={difficulty}
                onChange={(e) => {
                  soundEngine.playClick();
                  setDifficulty(e.target.value as TaskDifficulty);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label} (Base {d.baseXp} XP)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Projected Rewards Preview */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Calculated Server Rewards:</span>
            <div className="flex items-center gap-3">
              <span className="text-amber-300 font-bold">+{projectedXp} XP</span>
              <span className="text-amber-400 font-bold">+{projectedGold} Gold</span>
              {streakDays > 0 && (
                <span className="text-orange-400 text-[10px]">
                  (+{Math.round(streakBonus * 100)}% streak bonus applied)
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-semibold"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs tracking-wider uppercase shadow-lg shadow-amber-950/50 disabled:opacity-40"
            >
              {submitting ? 'Inscribing...' : editTask ? 'Save Changes' : 'Inscribe Quest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

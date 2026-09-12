import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  Sword,
  Heart,
  Clock,
  Camera,
  ShieldCheck,
  RefreshCw,
  FileImage,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Task, TaskCategory, TaskType, TaskDifficulty, ProofRequirementType } from '../types.js';
import { soundEngine } from '../utils/soundEngine.js';
import { api } from '../utils/api.js';

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
    requires_proof?: boolean;
    proof_type?: ProofRequirementType;
    proof_criteria?: string;
  }) => Promise<void>;
  editTask?: Task | null;
  streakDays: number;
}

const CATEGORIES: { id: TaskCategory; label: string; icon: any; hint: string }[] = [
  { id: 'intellect', label: 'Intellect', icon: BookOpen, hint: 'Studying, reading, coding, focus' },
  { id: 'strength', label: 'Strength', icon: Sword, hint: 'Workouts, gym, physical exertion' },
  { id: 'vitality', label: 'Vitality', icon: Heart, hint: 'Hydration, nutrition, sleep, health' },
  { id: 'spirit', label: 'Spirit', icon: Sparkles, hint: 'Meditation, mindfulness, journaling' },
  { id: 'agility', label: 'Agility', icon: Clock, hint: 'Errands, inbox zero, organization' },
];

const DIFFICULTIES: { id: TaskDifficulty; label: string; baseXp: number; baseGold: number }[] = [
  { id: 'trivial', label: 'Trivial', baseXp: 15, baseGold: 10 },
  { id: 'easy', label: 'Easy', baseXp: 30, baseGold: 20 },
  { id: 'medium', label: 'Medium', baseXp: 60, baseGold: 45 },
  { id: 'hard', label: 'Hard', baseXp: 120, baseGold: 90 },
  { id: 'legendary', label: 'Legendary', baseXp: 250, baseGold: 200 },
];

const PROOF_TEMPLATES = [
  {
    title: 'Hydrate 2.5 Liters of Water',
    category: 'vitality' as TaskCategory,
    type: 'habit' as TaskType,
    difficulty: 'easy' as TaskDifficulty,
    requires_proof: true,
    proof_type: 'before_after_photo' as ProofRequirementType,
    proof_criteria: 'Upload a photo of your full water bottle before drinking, and a photo of your empty bottle after finishing it!',
    label: '💧 Hydration (Before/After)',
  },
  {
    title: 'Clean & Organize Workspace',
    category: 'agility' as TaskCategory,
    type: 'daily' as TaskType,
    difficulty: 'medium' as TaskDifficulty,
    requires_proof: true,
    proof_type: 'before_after_photo' as ProofRequirementType,
    proof_criteria: 'Upload a before photo of your cluttered workspace, and an after photo showing it clean and organized!',
    label: '🧹 Clean Desk (Before/After)',
  },
  {
    title: 'Read 25 Pages of Book',
    category: 'intellect' as TaskCategory,
    type: 'daily' as TaskType,
    difficulty: 'medium' as TaskDifficulty,
    requires_proof: true,
    proof_type: 'single_photo' as ProofRequirementType,
    proof_criteria: 'Take a photo of your book and today’s chapter or notes.',
    label: '📖 Reading (Photo)',
  },
  {
    title: '30-Minute Gym Workout',
    category: 'strength' as TaskCategory,
    type: 'daily' as TaskType,
    difficulty: 'hard' as TaskDifficulty,
    requires_proof: true,
    proof_type: 'single_photo' as ProofRequirementType,
    proof_criteria: 'Upload a photo of your gym station, weights, or workout summary screen.',
    label: '🏋️ Workout (Photo)',
  },
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
  const [category, setCategory] = useState<TaskCategory>('vitality');
  const [type, setType] = useState<TaskType>('daily');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('medium');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);

  // Proof requirement states
  const [requiresProof, setRequiresProof] = useState<boolean>(false);
  const [proofType, setProofType] = useState<ProofRequirementType>('before_after_photo');
  const [proofCriteria, setProofCriteria] = useState<string>('');

  // AI assistant loading & notice states
  const [isAiSuggesting, setIsAiSuggesting] = useState<boolean>(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description || '');
      setCategory(editTask.category);
      setType(editTask.type);
      setDifficulty(editTask.difficulty);
      setDueDate(editTask.due_date || new Date().toISOString().split('T')[0]);
      setRequiresProof(Boolean(editTask.requires_proof));
      setProofType(editTask.proof_type || 'none');
      setProofCriteria(editTask.proof_criteria || '');
    } else {
      setTitle('');
      setDescription('');
      setCategory('vitality');
      setType('daily');
      setDifficulty('medium');
      setDueDate(new Date().toISOString().split('T')[0]);
      setRequiresProof(false);
      setProofType('before_after_photo');
      setProofCriteria('');
    }
    setAiNotice(null);
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

  // AI Suggestion Handler: automatically configure proof criteria & task details
  const handleAiSuggestProof = async () => {
    if (!title.trim()) {
      setAiNotice('Please enter a task title first (e.g., "Hydrate 2.5 Liters of Water").');
      return;
    }

    setIsAiSuggesting(true);
    setAiNotice(null);
    soundEngine.playClick();

    try {
      const suggestion = await api.aiSuggestProof(title.trim(), category, description);
      setRequiresProof(true);
      setProofType(suggestion.proof_type);
      setProofCriteria(suggestion.proof_criteria);
      if (suggestion.recommended_difficulty) {
        setDifficulty(suggestion.recommended_difficulty);
      }
      setAiNotice(suggestion.encouraging_note || 'AI successfully generated proof guidelines!');
    } catch (err: any) {
      console.error('AI suggestion failed:', err);
      // Fallback
      setRequiresProof(true);
      if (title.toLowerCase().includes('water') || title.toLowerCase().includes('drink')) {
        setProofType('before_after_photo');
        setProofCriteria('Upload a photo of your full water bottle before drinking, and a photo of your empty bottle after finishing it!');
      } else {
        setProofType('single_photo');
        setProofCriteria('Upload a photo demonstrating your completed achievement.');
      }
      setAiNotice('Proof criteria suggested for your quest!');
    } finally {
      setIsAiSuggesting(false);
    }
  };

  const handleApplyTemplate = (tmpl: typeof PROOF_TEMPLATES[0]) => {
    soundEngine.playClick();
    setTitle(tmpl.title);
    setCategory(tmpl.category);
    setType(tmpl.type);
    setDifficulty(tmpl.difficulty);
    setRequiresProof(tmpl.requires_proof);
    setProofType(tmpl.proof_type);
    setProofCriteria(tmpl.proof_criteria);
    setAiNotice(`Loaded template: ${tmpl.title}`);
  };

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
        requires_proof: requiresProof,
        proof_type: requiresProof ? proofType : 'none',
        proof_criteria: requiresProof ? proofCriteria.trim() : '',
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="new-quest-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) {
          onClose();
        }
      }}
    >
      <div
        id="new-quest-modal-card"
        className="w-full max-w-xl my-8 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl p-6 relative overflow-hidden text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-sky-500 to-emerald-500" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {editTask ? 'Edit Quest' : 'Create New Quest'}
              </h2>
              <p className="text-xs text-slate-400">Set task goals and optional AI proof requirements</p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Example Templates Strip */}
        <div className="mt-4 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-400">Quick Habit Templates:</span>
            <span className="text-[10px] text-amber-400">Click to fill</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PROOF_TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyTemplate(tmpl)}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-700/60 hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 border border-slate-600 transition-colors"
              >
                {tmpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Title with Inbuilt AI Button */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Quest Title *
              </label>
              <button
                id="ai-suggest-proof-btn"
                type="button"
                onClick={handleAiSuggestProof}
                disabled={isAiSuggesting || !title.trim()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-sky-300 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                title="Automatically configure proof requirements and details using Gemini AI"
              >
                {isAiSuggesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                    <span>AI Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                    <span>Inbuilt AI: Generate Proof</span>
                  </>
                )}
              </button>
            </div>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Hydrate 2.5 Liters of Water, Morning Workout, Read Chapter 3"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 placeholder:text-slate-500 shadow-sm"
            />
          </div>

          {/* AI Banner feedback if present */}
          {aiNotice && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs">
              <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
              <span>{aiNotice}</span>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Quest Details & Tips (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add checklist, notes, or helpful steps..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 placeholder:text-slate-500 resize-none shadow-sm"
            />
          </div>

          {/* Proof of Completion Section */}
          <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Proof of Completion
                </span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300">
                <input
                  type="checkbox"
                  checked={requiresProof}
                  onChange={(e) => {
                    setRequiresProof(e.target.checked);
                    if (e.target.checked && !proofCriteria) {
                      if (title.toLowerCase().includes('water')) {
                        setProofType('before_after_photo');
                        setProofCriteria('Upload a photo of your full water bottle before drinking, and a photo of your empty bottle after finishing it!');
                      } else {
                        setProofType('single_photo');
                        setProofCriteria('Upload a photo showing proof of completion.');
                      }
                    }
                  }}
                  className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-600 focus:ring-amber-500 focus:ring-offset-slate-900"
                />
                <span>Require Player Proof</span>
              </label>
            </div>

            {requiresProof && (
              <div className="space-y-3 pt-2 border-t border-slate-700/60 animate-fadeIn">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                    Proof Verification Method
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setProofType('before_after_photo')}
                      className={`p-2 rounded-xl border text-center font-medium flex flex-col items-center gap-1 transition-all ${
                        proofType === 'before_after_photo'
                          ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <Camera className="w-4 h-4" />
                      <span className="text-[11px]">Before & After</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setProofType('single_photo')}
                      className={`p-2 rounded-xl border text-center font-medium flex flex-col items-center gap-1 transition-all ${
                        proofType === 'single_photo'
                          ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <FileImage className="w-4 h-4" />
                      <span className="text-[11px]">Single Photo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setProofType('note_only')}
                      className={`p-2 rounded-xl border text-center font-medium flex flex-col items-center gap-1 transition-all ${
                        proofType === 'note_only'
                          ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <Info className="w-4 h-4" />
                      <span className="text-[11px]">Written Note</span>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-300">
                      Proof Criteria Instructions
                    </label>
                    <button
                      type="button"
                      onClick={handleAiSuggestProof}
                      className="text-[11px] text-sky-400 hover:text-sky-300 underline"
                    >
                      Regenerate with AI
                    </button>
                  </div>
                  <input
                    type="text"
                    value={proofCriteria}
                    onChange={(e) => setProofCriteria(e.target.value)}
                    placeholder="e.g. Upload a photo of your water bottle before drinking, and a photo of your empty bottle after finishing it!"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-sky-500 placeholder:text-slate-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
              Hero Stat to Level Up
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
                    title={cat.hint}
                    className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-xs font-bold'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px] font-medium">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quest Type & Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Task Type
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'daily', label: 'Daily' },
                  { id: 'habit', label: 'Habit' },
                  { id: 'epic_quest', label: 'Project' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setType(item.id as TaskType);
                    }}
                    className={`py-2 px-1 rounded-lg border text-center text-xs font-semibold transition-all ${
                      type === item.id
                        ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300 shadow-xs'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Difficulty (Reward Tier)
              </label>
              <select
                value={difficulty}
                onChange={(e) => {
                  soundEngine.playClick();
                  setDifficulty(e.target.value as TaskDifficulty);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-500 shadow-sm"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label} (+{d.baseXp} XP, +{d.baseGold} Coins)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Projected Rewards Preview */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 font-medium">Estimated Completion Rewards:</span>
            <div className="flex items-center gap-3">
              <span className="text-amber-400 font-bold">+{projectedXp} XP</span>
              <span className="text-amber-300 font-bold">+{projectedGold} Coins</span>
              {streakDays > 0 && (
                <span className="text-orange-400 text-[10px] font-semibold">
                  (+{Math.round(streakBonus * 100)}% streak bonus)
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs tracking-wider uppercase shadow-md disabled:opacity-40 transition-all flex items-center gap-1.5"
            >
              {submitting ? (
                'Saving...'
              ) : (
                <>
                  <span>{editTask ? 'Save Changes' : 'Create Quest'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

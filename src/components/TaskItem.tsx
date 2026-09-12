import React, { useState } from 'react';
import {
  Check,
  Flame,
  Coins,
  Sparkles,
  BookOpen,
  Sword,
  Heart,
  Clock,
  MoreVertical,
  Trash2,
  Edit2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Task, TaskCategory, CompleteTaskResponse } from '../types.js';
import { soundEngine } from '../utils/soundEngine.js';

interface TaskItemProps {
  task: Task;
  onComplete: (taskId: string) => Promise<CompleteTaskResponse | void>;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const CATEGORY_META: Record<
  TaskCategory,
  { label: string; icon: any; color: string; bg: string; border: string }
> = {
  intellect: {
    label: 'Intellect',
    icon: BookOpen,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
  },
  strength: {
    label: 'Strength',
    icon: Sword,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  vitality: {
    label: 'Vitality',
    icon: Heart,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
  },
  spirit: {
    label: 'Spirit',
    icon: Sparkles,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
  agility: {
    label: 'Agility',
    icon: Clock,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
  },
};

const DIFFICULTY_LABELS: Record<string, { label: string; color: string }> = {
  trivial: { label: 'Trivial', color: 'text-slate-400 border-slate-700 bg-slate-800/40' },
  easy: { label: 'Easy', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  medium: { label: 'Medium', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  hard: { label: 'Hard', color: 'text-rose-400 border-rose-500/30 bg-rose-500/10' },
  legendary: { label: 'Legendary', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
};

export const TaskItem: React.FC<TaskItemProps> = ({ task, onComplete, onEdit, onDelete }) => {
  const [completing, setCompleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [floatingBonus, setFloatingBonus] = useState<{ xp: number; gold: number } | null>(null);

  const meta = CATEGORY_META[task.category] || CATEGORY_META.intellect;
  const CategoryIcon = meta.icon;
  const diffMeta = DIFFICULTY_LABELS[task.difficulty] || DIFFICULTY_LABELS.medium;
  const isCompleted = task.completed === 1;

  const handleCheck = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (isCompleted || completing) return;

    setCompleting(true);
    soundEngine.playQuestComplete();

    // Trigger celebratory particle fireworks
    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.75 },
        colors: ['#f59e0b', '#10b981', '#6366f1', '#ec4899'],
      });
    } catch (_) {}

    try {
      const res = await onComplete(task.id);
      if (res && res.earnedXp) {
        setFloatingBonus({ xp: res.earnedXp, gold: res.earnedGold });
        setTimeout(() => setFloatingBonus(null), 2500);
      }
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div
      tabIndex={0}
      role="article"
      aria-label={`Quest: ${task.title}, category ${task.category}, ${isCompleted ? 'completed' : 'pending'}`}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isCompleted && !menuOpen) {
          e.preventDefault();
          handleCheck(e);
        }
      }}
      className={`group relative p-4 rounded-2xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
        isCompleted
          ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
          : 'bg-[#111827]/90 border-slate-800 hover:border-slate-700 shadow-md hover:shadow-xl hover:translate-y-[-1px]'
      }`}
    >
      {/* Floating XP & Gold Floater */}
      {floatingBonus && (
        <div className="absolute -top-3 right-6 z-20 pointer-events-none animate-bounce bg-slate-950 border border-amber-400 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)] flex items-center gap-2 text-xs font-mono font-bold text-amber-300">
          <span>+{floatingBonus.xp} XP</span>
          <span>•</span>
          <span>+{floatingBonus.gold} Gold</span>
        </div>
      )}

      <div className="flex items-start gap-3.5">
        {/* Arcane Checkbox Seal */}
        <button
          id={`complete-task-${task.id}`}
          onClick={handleCheck}
          disabled={isCompleted || completing}
          aria-label={isCompleted ? 'Quest Conquered' : 'Conquer Quest'}
          title={isCompleted ? 'Quest Conquered' : 'Conquer Quest'}
          className={`mt-0.5 w-7 h-7 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
            isCompleted
              ? 'bg-amber-500/20 border-amber-500/80 text-amber-400'
              : 'border-slate-600 bg-slate-900 hover:border-amber-400 hover:scale-110 shadow-inner'
          }`}
        >
          {isCompleted ? (
            <Check className="w-4 h-4 stroke-[3]" />
          ) : completing ? (
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
          ) : (
            <div className="w-2 h-2 rounded-sm bg-transparent group-hover:bg-amber-400/50 transition-colors" />
          )}
        </button>

        {/* Quest Information */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {/* Category Pill */}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono uppercase font-semibold border ${meta.bg} ${meta.color} ${meta.border}`}
            >
              <CategoryIcon className="w-3 h-3" />
              {meta.label}
            </span>

            {/* Type badge */}
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 uppercase">
              {task.type === 'epic_quest' ? 'Epic Bounty' : task.type}
            </span>

            {/* Difficulty badge */}
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-md border uppercase font-medium ${diffMeta.color}`}
            >
              {diffMeta.label}
            </span>

            {/* Streak Counter */}
            {task.streak_count > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/30 text-orange-300">
                <Flame className="w-3 h-3 text-orange-400" />
                {task.streak_count} streak
              </span>
            )}
          </div>

          <h3
            className={`text-sm sm:text-base font-semibold leading-snug break-words ${
              isCompleted ? 'line-through text-slate-400' : 'text-slate-100'
            }`}
          >
            {task.title}
          </h3>

          {task.description && (
            <p className="mt-1 text-xs text-slate-400 leading-relaxed break-words line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Rewards footer strip */}
          <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="text-amber-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                +{task.xp_reward} XP
              </span>
              <span className="text-amber-300/90 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                +{task.gold_reward} Gold
              </span>
            </div>

            {/* Actions Menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  soundEngine.playClick();
                  setMenuOpen(!menuOpen);
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                aria-label="Quest Options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 bottom-full mb-1 w-32 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-30 py-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(task);
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Modify Quest
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(task.id);
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs text-rose-400 hover:bg-rose-950/40 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Quest
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  Camera,
  ShieldCheck,
  FileImage,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Task, TaskCategory, CompleteTaskResponse } from '../types.js';
import { soundEngine } from '../utils/soundEngine.js';
import { ProofVerificationModal } from './ProofVerificationModal.js';

interface TaskItemProps {
  task: Task;
  onComplete: (taskId: string) => Promise<CompleteTaskResponse | void>;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onTaskUpdated?: (result: CompleteTaskResponse) => void;
}

const CATEGORY_META: Record<
  TaskCategory,
  { label: string; icon: any; color: string; bg: string; border: string }
> = {
  intellect: {
    label: 'Intellect',
    icon: BookOpen,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/15',
    border: 'border-indigo-500/30',
  },
  strength: {
    label: 'Strength',
    icon: Sword,
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
  },
  vitality: {
    label: 'Vitality',
    icon: Heart,
    color: 'text-rose-400',
    bg: 'bg-rose-500/15',
    border: 'border-rose-500/30',
  },
  spirit: {
    label: 'Spirit',
    icon: Sparkles,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
  },
  agility: {
    label: 'Agility',
    icon: Clock,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-500/30',
  },
};

const DIFFICULTY_LABELS: Record<string, { label: string; color: string }> = {
  trivial: { label: 'Trivial', color: 'text-slate-400 border-slate-700 bg-slate-800' },
  easy: { label: 'Easy', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  medium: { label: 'Medium', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  hard: { label: 'Hard', color: 'text-rose-400 border-rose-500/30 bg-rose-500/10' },
  legendary: { label: 'Legendary', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
};

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onComplete,
  onEdit,
  onDelete,
  onTaskUpdated,
}) => {
  const [completing, setCompleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [floatingBonus, setFloatingBonus] = useState<{ xp: number; gold: number } | null>(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [showProofDetails, setShowProofDetails] = useState(false);

  const meta = CATEGORY_META[task.category] || CATEGORY_META.intellect;
  const CategoryIcon = meta.icon;
  const diffMeta = DIFFICULTY_LABELS[task.difficulty] || DIFFICULTY_LABELS.medium;
  const isCompleted = task.completed === 1;
  const hasProofRequirement = Boolean(task.requires_proof && task.proof_type && task.proof_type !== 'none');

  const handleCheck = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (isCompleted || completing) return;

    // If this quest requires photo or note verification, pop up the AI proof modal!
    if (hasProofRequirement) {
      soundEngine.playClick();
      setIsProofModalOpen(true);
      return;
    }

    // Standard task direct completion
    setCompleting(true);
    soundEngine.playQuestComplete();

    try {
      confetti({
        particleCount: 40,
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

  const handleProofSuccess = (result: CompleteTaskResponse) => {
    soundEngine.playQuestComplete();
    try {
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#f59e0b', '#10b981'],
      });
    } catch (_) {}

    setFloatingBonus({ xp: result.earnedXp, gold: result.earnedGold });
    setTimeout(() => setFloatingBonus(null), 2500);

    if (onTaskUpdated) {
      onTaskUpdated(result);
    }
  };

  return (
    <>
      <div
        tabIndex={0}
        role="article"
        aria-label={`Task: ${task.title}, category ${task.category}, ${isCompleted ? 'completed' : 'pending'}`}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !isCompleted && !menuOpen) {
            e.preventDefault();
            handleCheck(e);
          }
        }}
        className={`group relative p-4 rounded-2xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${
          isCompleted
            ? 'bg-slate-900/60 border-slate-800 opacity-75'
            : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-md hover:shadow-lg'
        }`}
      >
        {/* Floating XP & Gold Floater */}
        {floatingBonus && (
          <div className="absolute -top-3 right-6 z-20 pointer-events-none animate-bounce bg-slate-950 border border-amber-400 px-3 py-1 rounded-full shadow-lg flex items-center gap-2 text-xs font-mono font-bold text-amber-300">
            <span>+{floatingBonus.xp} XP</span>
            <span>•</span>
            <span>+{floatingBonus.gold} Coins</span>
          </div>
        )}

        <div className="flex items-start gap-3.5">
          {/* Checkbox Seal */}
          <button
            id={`complete-task-${task.id}`}
            onClick={handleCheck}
            disabled={isCompleted || completing}
            aria-label={isCompleted ? 'Task completed' : 'Mark task complete'}
            title={
              isCompleted
                ? 'Task completed'
                : hasProofRequirement
                ? 'Click to submit proof of completion'
                : 'Mark task complete'
            }
            className={`mt-0.5 w-7 h-7 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
              isCompleted
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : hasProofRequirement
                ? 'border-sky-500/50 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 shadow-xs'
                : 'border-slate-700 bg-slate-800 hover:border-amber-500 hover:bg-amber-500/10'
            }`}
          >
            {isCompleted ? (
              <Check className="w-4 h-4 stroke-[3]" />
            ) : completing ? (
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            ) : hasProofRequirement ? (
              <Camera className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
            ) : (
              <div className="w-2 h-2 rounded-sm bg-transparent group-hover:bg-amber-400 transition-colors" />
            )}
          </button>

          {/* Quest Information */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              {/* Category Pill */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono uppercase font-semibold border ${meta.bg} ${meta.color} ${meta.border}`}
              >
                <CategoryIcon className="w-3 h-3" />
                {meta.label}
              </span>

              {/* Type badge */}
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 uppercase font-medium">
                {task.type === 'epic_quest' ? 'Project' : task.type === 'daily' ? 'Daily' : 'Habit'}
              </span>

              {/* Difficulty badge */}
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-md border uppercase font-medium ${diffMeta.color}`}
              >
                {diffMeta.label}
              </span>

              {/* Proof Requirement Tag */}
              {hasProofRequirement && !isCompleted && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-300 font-semibold">
                  <Camera className="w-3 h-3 text-sky-400" />
                  {task.proof_type === 'before_after_photo' ? 'Before & After Photo' : 'Photo Proof'}
                </span>
              )}

              {/* Verified Badge if already verified */}
              {task.last_proof && (
                <button
                  type="button"
                  onClick={() => setShowProofDetails(!showProofDetails)}
                  className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold hover:bg-emerald-500/25 transition-colors"
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  AI Verified
                </button>
              )}

              {/* Streak Counter */}
              {task.streak_count > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-orange-500/15 border border-orange-500/30 text-orange-400 font-semibold">
                  <Flame className="w-3 h-3 text-orange-500" />
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

            {/* Proof criteria instructions preview if not completed */}
            {hasProofRequirement && !isCompleted && task.proof_criteria && (
              <div className="mt-2 text-xs flex items-center gap-1.5 text-sky-300 bg-sky-950/40 border border-sky-800/40 px-2.5 py-1.5 rounded-lg">
                <Camera className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="truncate">{task.proof_criteria}</span>
              </div>
            )}

            {/* If verified proof exists, collapsible details card */}
            {showProofDetails && task.last_proof && (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between text-emerald-400 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    AI Proof Verification: Verified
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(task.last_proof.verified_at).toLocaleDateString()}
                  </span>
                </div>
                {task.last_proof.feedback && (
                  <p className="text-slate-300 italic bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    "{task.last_proof.feedback}"
                  </p>
                )}
                {/* Thumbnails */}
                <div className="flex items-center gap-2 pt-1">
                  {task.last_proof.before_image_url && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-slate-400">Before:</span>
                      <img
                        src={task.last_proof.before_image_url}
                        alt="Before proof"
                        className="w-16 h-12 object-cover rounded-lg border border-slate-700"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  {task.last_proof.after_image_url && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-slate-400">After:</span>
                      <img
                        src={task.last_proof.after_image_url}
                        alt="After proof"
                        className="w-16 h-12 object-cover rounded-lg border border-slate-700"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rewards footer strip */}
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  +{task.xp_reward} XP
                </span>
                <span className="text-amber-300 font-semibold flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  +{task.gold_reward} Coins
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {hasProofRequirement && !isCompleted && (
                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      setIsProofModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Camera className="w-3 h-3" />
                    <span>Submit Proof</span>
                  </button>
                )}

                {/* Options Menu */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      soundEngine.playClick();
                      setMenuOpen(!menuOpen);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    aria-label="Task Options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {menuOpen && (
                    <div
                      className="absolute right-0 bottom-full mb-1 w-34 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-30 py-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onEdit(task);
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit Quest
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onDelete(task.id);
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
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
      </div>

      {/* Proof Verification Modal */}
      {isProofModalOpen && (
        <ProofVerificationModal
          task={task}
          isOpen={isProofModalOpen}
          onClose={() => setIsProofModalOpen(false)}
          onSuccess={handleProofSuccess}
        />
      )}
    </>
  );
};

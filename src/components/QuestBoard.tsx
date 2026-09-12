import React, { useState } from 'react';
import { Plus, Search, Filter, Sparkles, CheckCircle2 } from 'lucide-react';
import { Task, TaskCategory, TaskType, CompleteTaskResponse } from '../types.js';
import { TaskItem } from './TaskItem.js';
import { soundEngine } from '../utils/soundEngine.js';

interface QuestBoardProps {
  tasks: Task[];
  onCompleteTask: (taskId: string) => Promise<CompleteTaskResponse | void>;
  onOpenNewQuest: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export const QuestBoard: React.FC<QuestBoardProps> = ({
  tasks,
  onCompleteTask,
  onOpenNewQuest,
  onEditTask,
  onDeleteTask,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'daily' | 'habit' | 'epic_quest'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (activeTab !== 'all' && t.type !== activeTab) return false;
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });

  const completedCount = tasks.filter((t) => t.completed === 1).length;
  const pendingCount = tasks.length - completedCount;

  return (
    <div className="space-y-5">
      {/* Top Controls Bar */}
      <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Type Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'all', label: 'All Quests' },
            { id: 'daily', label: 'Daily Quests' },
            { id: 'habit', label: 'Habits' },
            { id: 'epic_quest', label: 'Epic Bounties' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                soundEngine.playClick();
                setActiveTab(tab.id as any);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-950/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action Button & Search */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Search box */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search grimoire..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Inscribe Quest Button */}
          <button
            id="inscribe-quest-btn"
            onClick={() => {
              soundEngine.playClick();
              onOpenNewQuest();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.3)] shrink-0 transition-all"
            title="Press 'N' key to inscribe anytime"
          >
            <Plus className="w-4 h-4" />
            <span>Inscribe Quest</span>
            <kbd className="hidden lg:inline px-1 py-0.2 bg-amber-700/40 rounded text-[9px] font-mono text-slate-950">
              N
            </kbd>
          </button>
        </div>
      </div>

      {/* Category Sub-filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-mono uppercase text-slate-500 mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3" />
          Filter:
        </span>
        {[
          { id: 'all', label: 'All Attributes' },
          { id: 'intellect', label: '🧠 Intellect' },
          { id: 'strength', label: '⚔️ Strength' },
          { id: 'vitality', label: '❤️ Vitality' },
          { id: 'spirit', label: '✨ Spirit' },
          { id: 'agility', label: '⚡ Agility' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              soundEngine.playClick();
              setSelectedCategory(cat.id);
            }}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] whitespace-nowrap transition-all border ${
              selectedCategory === cat.id
                ? 'bg-slate-800 text-amber-300 border-amber-500/50'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            {cat.label}
          </button>
        ))}

        <div className="ml-auto text-[11px] font-mono text-slate-400 whitespace-nowrap">
          {pendingCount} Active • {completedCount} Conquered
        </div>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800">
          <Sparkles className="w-10 h-10 text-amber-500/40 mx-auto mb-3" />
          <h3
            className="text-base font-serif font-bold text-slate-300"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            No Quests Found in this Ledger
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Your grimoire is ready for glory. Inscribe a daily habit or challenging task to earn XP and damage the world boss!
          </p>
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenNewQuest();
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Inscribe First Quest
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onComplete={onCompleteTask}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))}
        </div>
      )}
    </div>
  );
};

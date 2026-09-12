import React, { useState } from 'react';
import { Plus, Search, Filter, Sparkles } from 'lucide-react';
import { Task, TaskCategory, TaskType, CompleteTaskResponse } from '../types.js';
import { TaskItem } from './TaskItem.js';
import { soundEngine } from '../utils/soundEngine.js';

interface QuestBoardProps {
  tasks: Task[];
  onCompleteTask: (taskId: string) => Promise<CompleteTaskResponse | void>;
  onOpenNewQuest: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onTaskUpdated?: (result: CompleteTaskResponse) => void;
}

export const QuestBoard: React.FC<QuestBoardProps> = ({
  tasks,
  onCompleteTask,
  onOpenNewQuest,
  onEditTask,
  onDeleteTask,
  onTaskUpdated,
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col md:flex-row items-center justify-between gap-3 transition-colors">
        {/* Type Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'all', label: 'All Quests' },
            { id: 'daily', label: 'Dailies' },
            { id: 'habit', label: 'Habits' },
            { id: 'epic_quest', label: 'Projects & Goals' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                soundEngine.playClick();
                setActiveTab(tab.id as any);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search quests..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder-slate-400 focus:bg-slate-800/90 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Inscribe Quest Button */}
          <button
            id="inscribe-quest-btn"
            onClick={() => {
              soundEngine.playClick();
              onOpenNewQuest();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm shrink-0 transition-all"
            title="Press 'N' key to add a quest anytime"
          >
            <Plus className="w-4 h-4" />
            <span>Add Quest</span>
            <kbd className="hidden lg:inline px-1 py-0.2 bg-amber-600/30 rounded text-[9px] font-mono text-slate-950">
              N
            </kbd>
          </button>
        </div>
      </div>

      {/* Category Sub-filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-mono uppercase text-slate-400 mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3" />
          Category:
        </span>
        {[
          { id: 'all', label: 'All Categories' },
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
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}

        <div className="ml-auto text-[11px] font-mono text-slate-400 whitespace-nowrap">
          {pendingCount} Pending • {completedCount} Done
        </div>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-slate-900 border border-dashed border-slate-800">
          <Sparkles className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3
            className="text-base font-bold text-white"
          >
            No Quests Found
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            You don't have any quests matching this view. Add a daily habit or project quest to start leveling up and earning rewards!
          </p>
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenNewQuest();
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Your First Quest
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
              onTaskUpdated={onTaskUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
};

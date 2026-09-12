import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Sword,
  Shield,
  Coins,
  Scroll,
  Skull,
  Plus,
  Flame,
  Volume2,
  RefreshCw,
  LogOut,
  HelpCircle,
} from 'lucide-react';
import { User, Character, CharacterStats, InventoryItem, Task, CompleteTaskResponse } from './types.js';
import { api, getStoredToken } from './utils/api.js';
import { soundEngine } from './utils/soundEngine.js';
import { Header } from './components/Header.js';
import { AuthView } from './components/AuthView.js';
import { HeroCard } from './components/HeroCard.js';
import { QuestBoard } from './components/QuestBoard.js';
import { NewQuestModal } from './components/NewQuestModal.js';
import { ShopBazaar } from './components/ShopBazaar.js';
import { BossArena } from './components/BossArena.js';
import { ChroniclesHistory } from './components/ChroniclesHistory.js';
import { LevelUpModal } from './components/LevelUpModal.js';

export default function App() {
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [user, setUser] = useState<User | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [stats, setStats] = useState<CharacterStats | null>(null);
  const [equippedItems, setEquippedItems] = useState<InventoryItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Active navigation view tab: 'quests' | 'character' | 'shop' | 'boss' | 'chronicles'
  const [activeTab, setActiveTab] = useState<'quests' | 'character' | 'shop' | 'boss' | 'chronicles'>('quests');

  // Modals state
  const [isNewQuestOpen, setIsNewQuestOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [levelUpData, setLevelUpData] = useState<{ newLevel: number } | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Refresh character & tasks from SQLite backend or local persistence
  const loadAppState = useCallback(async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [meData, tasksData] = await Promise.all([
        api.getMe(),
        api.getTasks(),
      ]);

      setUser(meData.user);
      setCharacter(meData.character);
      setStats(meData.stats);
      setEquippedItems(meData.equippedItems);
      setTasks(tasksData.tasks);
    } catch (err: any) {
      console.error('Failed to load character state:', err);
      // If token expired or invalid, reset
      if (err.message?.includes('401') || err.message?.includes('token')) {
        api.logout();
        setToken(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppState();
  }, [loadAppState, token]);

  // Global Keyboard Navigation & Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger hotkeys if user is actively typing in an input
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setEditingTask(null);
        setIsNewQuestOpen(true);
      } else if (e.key === '1') {
        setActiveTab('quests');
      } else if (e.key === '2') {
        setActiveTab('character');
      } else if (e.key === '3') {
        setActiveTab('shop');
      } else if (e.key === '4') {
        setActiveTab('boss');
      } else if (e.key === '5') {
        setActiveTab('chronicles');
      } else if (e.key === 'm' || e.key === 'M') {
        soundEngine.toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle Quest Completion
  const handleCompleteTask = async (taskId: string): Promise<CompleteTaskResponse | void> => {
    try {
      const res = await api.completeTask(taskId);
      
      // Update local task
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completed: 1, streak_count: t.streak_count + 1 } : t))
      );

      // Update character & stats
      setCharacter(res.character);
      setStats(res.stats);

      // Show level up celebration if threshold reached
      if (res.leveledUp) {
        setLevelUpData({ newLevel: res.newLevel });
      }

      // If boss damaged, show notice
      if (res.bossResult) {
        if (res.bossResult.defeated) {
          setStatusNotice(`🎉 Victory! You defeated ${res.bossResult.bossName} and earned +${res.bossResult.rewardGold} Coins!`);
        } else {
          setStatusNotice(`💥 You dealt ${res.bossResult.damageDealt} damage to ${res.bossResult.bossName}! (${res.bossResult.remainingHp} HP left)`);
        }
        setTimeout(() => setStatusNotice(null), 4000);
      }

      return res;
    } catch (err: any) {
      console.error('Complete task error:', err);
      setStatusNotice(err.message || 'Failed to complete task');
      setTimeout(() => setStatusNotice(null), 3000);
    }
  };

  // Create or update task
  const handleSubmitTask = async (data: any) => {
    if (editingTask) {
      const res = await api.updateTask(editingTask.id, data);
      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? res.task : t)));
      setStatusNotice('Task updated successfully!');
    } else {
      const res = await api.createTask(data);
      setTasks((prev) => [res.task, ...prev]);
      setStatusNotice('New task created!');
    }
    setTimeout(() => setStatusNotice(null), 3000);
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      soundEngine.playClick();
      setStatusNotice('Task deleted');
      setTimeout(() => setStatusNotice(null), 2500);
    } catch (err: any) {
      setStatusNotice(err.message || 'Failed to delete task');
    }
  };

  // Allocate stat points
  const handleAllocatePoints = async (points: any) => {
    try {
      const res = await api.allocateStats(points);
      setCharacter(res.character);
      setStats(res.stats);
      setStatusNotice('Stat points assigned successfully!');
      setTimeout(() => setStatusNotice(null), 3000);
    } catch (err: any) {
      setStatusNotice(err.message || 'Failed to allocate points');
      setTimeout(() => setStatusNotice(null), 3000);
    }
  };

  const handleLogout = () => {
    api.logout();
    setToken(null);
    setUser(null);
    setCharacter(null);
  };

  // If not logged in, display Auth View
  if (!token) {
    return (
      <AuthView
        onAuthSuccess={() => {
          const active = getStoredToken();
          setToken(active);
          loadAppState();
        }}
      />
    );
  }

  // Loading state
  if (loading && !character) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center text-slate-700 font-mono text-xs">
        <RefreshCw className="w-8 h-8 text-amber-600 animate-spin mb-3" />
        <span>Loading your hero profile...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-900">
      {/* Header */}
      <Header
        character={character}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={(t) => setActiveTab(t as any)}
      />

      {/* Ephemeral Status Notification Bar */}
      {statusNotice && (
        <div className="bg-amber-50 border-b border-amber-300 text-amber-900 text-xs py-2 px-4 text-center font-mono animate-fadeIn flex items-center justify-center gap-2 font-semibold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6 overflow-x-auto">
          <nav className="flex items-center gap-2">
            {[
              { id: 'quests', label: 'Tasks & Quests', icon: Scroll, shortcut: '1' },
              { id: 'character', label: 'Hero Profile', icon: Shield, shortcut: '2' },
              { id: 'shop', label: 'Shop & Gear', icon: Coins, shortcut: '3' },
              { id: 'boss', label: 'Boss Battle', icon: Skull, shortcut: '4' },
              { id: 'chronicles', label: 'History & Logs', icon: Sparkles, shortcut: '5' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={() => {
                    soundEngine.playClick();
                    setActiveTab(tab.id as any);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-50 border border-amber-300 text-amber-900 shadow-xs font-bold'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-600' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  <span className="hidden xl:inline text-[9px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                    {tab.shortcut}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Quick Info Chip */}
          <div className="hidden lg:flex items-center gap-3 text-xs font-mono text-slate-600">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Auto-Saved & Synced
            </span>
          </div>
        </div>

        {/* Tab Views */}
        {activeTab === 'quests' && (
          <div className="space-y-6">
            {/* Quick Hero Glance on Quests Page */}
            {character && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <QuestBoard
                    tasks={tasks}
                    onCompleteTask={handleCompleteTask}
                    onOpenNewQuest={() => {
                      setEditingTask(null);
                      setIsNewQuestOpen(true);
                    }}
                    onEditTask={(task) => {
                      setEditingTask(task);
                      setIsNewQuestOpen(true);
                    }}
                    onDeleteTask={handleDeleteTask}
                  />
                </div>

                {/* Side Summary Panel */}
                <div className="space-y-4">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                      <span className="text-xs font-mono font-bold text-amber-900 uppercase">
                        Hero Stats
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Level {character.level}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-slate-700">
                        <span className="flex items-center gap-1 text-slate-500">🧠 Intellect:</span>
                        <span className="font-mono font-bold text-indigo-700">{stats?.intellect}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span className="flex items-center gap-1 text-slate-500">⚔️ Strength:</span>
                        <span className="font-mono font-bold text-amber-800">{stats?.strength}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span className="flex items-center gap-1 text-slate-500">❤️ Vitality:</span>
                        <span className="font-mono font-bold text-rose-700">{stats?.vitality}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span className="flex items-center gap-1 text-slate-500">✨ Spirit:</span>
                        <span className="font-mono font-bold text-emerald-700">{stats?.spirit}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span className="flex items-center gap-1 text-slate-500">⚡ Agility:</span>
                        <span className="font-mono font-bold text-cyan-700">{stats?.agility}</span>
                      </div>
                    </div>

                    {(stats?.stat_points_available || 0) > 0 && (
                      <button
                        onClick={() => setActiveTab('character')}
                        className="w-full mt-4 py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Spend {stats?.stat_points_available} Stat Points</span>
                      </button>
                    )}
                  </div>

                  {/* Hotkeys Legend */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs font-mono text-slate-600 space-y-1.5 shadow-xs">
                    <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2">
                      Keyboard Shortcuts
                    </div>
                    <div className="flex justify-between items-center">
                      <span>New Task:</span>
                      <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-700 shadow-2xs">N</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Switch Tabs:</span>
                      <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-700 shadow-2xs">1 - 5</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Mute / Unmute Sound:</span>
                      <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-700 shadow-2xs">M</kbd>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'character' && character && (
          <HeroCard
            character={character}
            stats={stats}
            equippedItems={equippedItems}
            onAllocatePoints={handleAllocatePoints}
          />
        )}

        {activeTab === 'shop' && character && (
          <ShopBazaar
            character={character}
            onRefreshCharacter={loadAppState}
          />
        )}

        {activeTab === 'boss' && (
          <BossArena onRefreshHero={loadAppState} />
        )}

        {activeTab === 'chronicles' && (
          <ChroniclesHistory />
        )}
      </main>

      {/* Floating Action Button on Mobile */}
      <div className="fixed bottom-6 right-6 md:hidden z-40">
        <button
          onClick={() => {
            soundEngine.playClick();
            setEditingTask(null);
            setIsNewQuestOpen(true);
          }}
          className="w-14 h-14 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg border-2 border-amber-300 hover:bg-amber-600 transition-all"
          aria-label="Create New Task"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Inscribe / Modify Quest Modal */}
      <NewQuestModal
        isOpen={isNewQuestOpen}
        onClose={() => setIsNewQuestOpen(false)}
        onSubmit={handleSubmitTask}
        editTask={editingTask}
        streakDays={character?.streak_days || 0}
      />

      {/* Level Up Celebration Fanfare Modal */}
      {levelUpData && (
        <LevelUpModal
          newLevel={levelUpData.newLevel}
          onClose={() => setLevelUpData(null)}
          onOpenStatAllocation={() => {
            setLevelUpData(null);
            setActiveTab('character');
          }}
        />
      )}
    </div>
  );
}

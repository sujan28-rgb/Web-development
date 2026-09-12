import React, { useState, useEffect } from 'react';
import { Scroll, Sparkles, Coins, CheckCircle2, Clock } from 'lucide-react';
import { TaskHistoryLog } from '../types.js';
import { api } from '../utils/api.js';

export const ChroniclesHistory: React.FC = () => {
  const [logs, setLogs] = useState<TaskHistoryLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getLogs();
      setLogs(data.logs);
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="bg-[#0f172a]/95 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Scroll className="w-5 h-5" />
          </div>
          <div>
            <h2
              className="text-lg font-bold font-serif text-amber-100"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              The Heroic Chronicles
            </h2>
            <p className="text-xs text-slate-400">
              Immutable historical logs persisted in SQLite relational database.
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-xl border border-slate-800">
          {logs.length} Recorded Triumphs
        </span>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs font-mono text-slate-500">
          Unrolling parchment from SQLite archives...
        </div>
      ) : logs.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">
          No entries yet. Conquer your first quest to inscribe history!
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
          {logs.map((log) => {
            const formattedDate = new Date(log.completed_at).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-200 block truncate">
                      {log.task_title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      Category: {log.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 font-mono text-[11px]">
                  <span className="text-amber-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    +{log.xp_earned} XP
                  </span>
                  <span className="text-amber-400 flex items-center gap-1">
                    <Coins className="w-3 h-3 text-amber-400" />
                    +{log.gold_earned} Gold
                  </span>
                  <span className="text-slate-500 hidden sm:flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formattedDate}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

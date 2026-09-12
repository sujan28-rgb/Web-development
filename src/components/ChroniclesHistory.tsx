import React, { useState, useEffect } from 'react';
import { Scroll, Sparkles, Coins, CheckCircle2, Clock, ShieldCheck, Camera, Image as ImageIcon } from 'lucide-react';
import { TaskHistoryLog } from '../types.js';
import { api } from '../utils/api.js';

export const ChroniclesHistory: React.FC = () => {
  const [logs, setLogs] = useState<TaskHistoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProofLog, setSelectedProofLog] = useState<TaskHistoryLog | null>(null);

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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4 transition-colors text-slate-100">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xs">
            <Scroll className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Activity & Proof History
            </h2>
            <p className="text-xs text-slate-400">
              Your record of completed quests, habits, and AI-verified proof submissions.
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-slate-300 bg-slate-800 px-3 py-1 rounded-xl border border-slate-700 font-medium">
          {logs.length} Completed Quests
        </span>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs font-mono text-slate-400">
          Loading history logs...
        </div>
      ) : logs.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">
          No activity yet. Complete your first quest to build your legendary history!
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
          {logs.map((log) => {
            const formattedDate = new Date(log.completed_at).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            const hasProof = Boolean(log.verified_proof || log.proof_before_url || log.proof_after_url);

            return (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white truncate">
                        {log.task_title}
                      </span>
                      {hasProof && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          <ShieldCheck className="w-3 h-3 text-sky-400" />
                          AI Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      <span className="font-mono capitalize text-amber-400/80">{log.category}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono text-[10px]">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {formattedDate}
                      </span>
                    </div>

                    {/* Proof note or summary if present */}
                    {log.proof_feedback && (
                      <p className="mt-1 text-[11px] text-slate-300 italic line-clamp-1">
                        "{log.proof_feedback}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 font-mono text-[11px] pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-700/50">
                  <div className="flex items-center gap-2.5">
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      +{log.xp_earned} XP
                    </span>
                    <span className="text-amber-300 font-semibold flex items-center gap-1">
                      <Coins className="w-3 h-3 text-amber-500" />
                      +{log.gold_earned} Coins
                    </span>
                  </div>

                  {/* Proof preview trigger */}
                  {hasProof && (
                    <button
                      onClick={() => setSelectedProofLog(selectedProofLog?.id === log.id ? null : log)}
                      className="px-2 py-1 rounded bg-slate-700/80 hover:bg-slate-700 text-sky-300 hover:text-sky-200 border border-slate-600 text-[10px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Camera className="w-3 h-3" />
                      <span>{selectedProofLog?.id === log.id ? 'Hide Proof' : 'View Proof'}</span>
                    </button>
                  )}
                </div>

                {/* Expanded Proof Details */}
                {selectedProofLog?.id === log.id && (
                  <div className="w-full mt-2 pt-2 border-t border-slate-700/60 flex flex-wrap items-center gap-3 animate-fadeIn">
                    {log.proof_before_url && (
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">Before photo:</span>
                        <img
                          src={log.proof_before_url}
                          alt="Before photo"
                          className="w-20 h-16 object-cover rounded-lg border border-slate-600"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    {log.proof_after_url && (
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">After photo:</span>
                        <img
                          src={log.proof_after_url}
                          alt="After photo"
                          className="w-20 h-16 object-cover rounded-lg border border-slate-600"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    {log.proof_feedback && (
                      <div className="flex-1 min-w-[180px] bg-slate-900 p-2 rounded-lg border border-slate-700 text-xs">
                        <span className="text-[10px] font-mono text-emerald-400 block font-semibold mb-0.5">
                          AI Verification Verdict
                        </span>
                        <p className="text-slate-300 italic">{log.proof_feedback}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

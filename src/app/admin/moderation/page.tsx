'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flag, ArrowLeft, Check, ShieldAlert, X } from 'lucide-react';

export default function ModerationQueuePage() {
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlags = async () => {
    try {
      const res = await fetch('/api/admin/moderation');
      const data = await res.json();
      if (data.flags) setFlags(data.flags);
    } catch {}
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const handleAction = async (flagId: string, action: 'DISMISS' | 'WARN_USER' | 'REMOVE_CONTENT') => {
    try {
      const res = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flagId, action }),
      });
      if (res.ok) {
        await fetchFlags();
      }
    } catch {}
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="p-2 rounded-xl bg-surfaceLight border border-surfaceBorder hover:border-gray-600 text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Flag className="w-6 h-6 text-red-400" />
            <span>Content Moderation Queue</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Review reported streams, flagged chat messages, and community safety flags</p>
        </div>
      </div>

      <div className="p-6 rounded-2xl glass-panel border border-surfaceBorder">
        {loading ? (
          <p className="text-xs text-gray-400">Loading moderation queue...</p>
        ) : flags.length === 0 ? (
          <div className="text-center py-10">
            <ShieldAlert className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white">All Clear!</h3>
            <p className="text-xs text-gray-400 mt-1">No pending flagged content in the moderation queue.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="text-[11px] text-gray-400 uppercase border-b border-surfaceBorder">
                <tr>
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Target</th>
                  <th className="py-2.5">Reason</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surfaceBorder/60">
                {flags.map((f) => (
                  <tr key={f.id}>
                    <td className="py-3 font-mono text-[11px]">{new Date(f.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 font-bold text-white">
                      {f.targetType} <span className="text-gray-400 font-mono text-[10px]">({f.targetId.substring(0, 8)})</span>
                    </td>
                    <td className="py-3 text-red-300 font-medium">{f.reason}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        f.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' : 'bg-surfaceLight text-gray-400'
                      }`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {f.status === 'PENDING' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAction(f.id, 'DISMISS')}
                            className="px-2.5 py-1 rounded-lg bg-surfaceLight hover:bg-surface text-gray-300 text-[11px] font-semibold transition"
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => handleAction(f.id, 'REMOVE_CONTENT')}
                            className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold transition"
                          >
                            Action Flag
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

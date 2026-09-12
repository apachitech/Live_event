'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft, RefreshCw, FileText, Database, Filter } from 'lucide-react';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url = entityFilter
        ? `/api/admin/audit-logs?entityType=${encodeURIComponent(entityFilter)}`
        : '/api/admin/audit-logs';
      const res = await fetch(url);
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
        setTotalCount(data.totalCount || 0);
      }
    } catch (e) {
      console.error('Failed to load audit logs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surfaceBorder">
        <div className="space-y-1">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-brandPurple" />
            <span>Hard-Copied Change Data & Audit Trail</span>
          </h1>
          <p className="text-xs text-gray-400">
            Persistent immutable logs of stream state changes, moderation, financial transactions, and configuration changes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-white font-medium focus:outline-none focus:border-brandPurple"
            >
              <option value="">All Entities</option>
              <option value="Stream">Stream</option>
              <option value="ChatMessage">Chat Message</option>
              <option value="Wallet">Wallet / Transactions</option>
              <option value="PrivateSession">Private Session</option>
              <option value="TipGoal">Tip Goal</option>
              <option value="Poll">Poll</option>
              <option value="Payout">Payout</option>
              <option value="ModerationFlag">Moderation Flag</option>
            </select>
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-surfaceLight border border-surfaceBorder hover:border-gray-500 text-xs font-bold text-gray-300 flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl glass-panel border border-surfaceBorder overflow-hidden">
        <div className="px-5 py-3 border-b border-surfaceBorder bg-surfaceLight/50 flex items-center justify-between">
          <div className="text-xs font-bold text-gray-300">
            Total Logged Events: <span className="text-white font-mono">{totalCount}</span>
          </div>
          <span className="text-[11px] text-gray-400">Hard-copied directly to Prisma DB</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brandPurple" />
            Loading change data logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-500">
            No audit or change data logs found for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surfaceBorder text-gray-400 text-[11px] uppercase tracking-wider font-semibold bg-surfaceLight/20">
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Entity</th>
                  <th className="px-5 py-3">Entity ID</th>
                  <th className="px-5 py-3">Actor</th>
                  <th className="px-5 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surfaceBorder/60">
                {logs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  let parsedPayload = null;
                  try {
                    if (log.payload) parsedPayload = JSON.parse(log.payload);
                  } catch {}

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-surfaceLight/30 transition">
                        <td className="px-5 py-3.5 font-mono text-gray-400 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2.5 py-1 rounded-lg bg-brandPurple/10 border border-brandPurple/20 text-brandPurple text-[11px] font-bold font-mono">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-gray-200">
                          {log.entityType}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-gray-400 text-[11px] max-w-[150px] truncate" title={log.entityId}>
                          {log.entityId}
                        </td>
                        <td className="px-5 py-3.5 text-gray-300">
                          {log.actor?.username || (log.actorUserId ? 'User ' + log.actorUserId.slice(0, 6) : 'System')}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="text-[11px] font-bold text-brandPurple hover:underline"
                          >
                            {isExpanded ? 'Hide Payload' : 'View Payload'}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-surfaceLight/10 border-b border-surfaceBorder/40">
                          <td colSpan={6} className="px-5 py-3">
                            <div className="p-3 rounded-xl bg-black/60 border border-white/5 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                              <pre>{JSON.stringify(parsedPayload || log.payload || {}, null, 2)}</pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

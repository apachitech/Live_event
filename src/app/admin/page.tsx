'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Shield, DollarSign, Users, Video, Clock, Check, X, AlertCircle, Settings, Flag } from 'lucide-react';

export default function AdminOverviewPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      const [statsRes, payoutsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/payouts'),
      ]);

      const statsData = await statsRes.json();
      const payoutsData = await payoutsRes.json();

      if (statsData.stats) setStats(statsData.stats);
      if (payoutsData.payouts) setPayouts(payoutsData.payouts);
    } catch {}
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handlePayoutAction = async (payoutId: string, action: 'APPROVE' | 'REJECT') => {
    setActionLoading(payoutId);
    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId, action }),
      });
      if (res.ok) {
        await fetchAdminData();
      } else {
        const d = await res.json();
        alert(d.error || 'Action failed');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surfaceBorder">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-400" />
            <span>Platform Administration</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Global metrics, streamer payout approvals, compliance, and platform settings.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/admin/audit"
            className="px-3.5 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder hover:border-gray-600 text-xs font-bold text-gray-300 flex items-center gap-1.5 transition"
          >
            <Shield className="w-3.5 h-3.5 text-brandPurple" />
            <span>Change Data Logs</span>
          </Link>
          <Link
            href="/admin/moderation"
            className="px-3.5 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder hover:border-gray-600 text-xs font-bold text-gray-300 flex items-center gap-1.5 transition"
          >
            <Flag className="w-3.5 h-3.5 text-red-400" />
            <span>Moderation Queue</span>
          </Link>
          <Link
            href="/admin/settings"
            className="btn-glow-purple px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition shadow"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Platform Settings</span>
          </Link>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl glass-panel border border-surfaceBorder">
          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-2">
            <span>Total Gross Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">
            ${((stats?.totalRevenueCents || 0) / 100).toFixed(2)}
          </div>
          <p className="text-[11px] text-gray-400 mt-2">All token purchases to date</p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-surfaceBorder">
          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-2">
            <span>Total Registered Users</span>
            <Users className="w-4 h-4 text-brandPurple" />
          </div>
          <div className="text-3xl font-black text-white">{stats?.totalUsers || 0}</div>
          <p className="text-[11px] text-gray-400 mt-2">18+ verified platform members</p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-surfaceBorder">
          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-2">
            <span>Active Streamers</span>
            <Video className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-3xl font-black text-white">{stats?.totalStreamers || 0}</div>
          <p className="text-[11px] text-gray-400 mt-2">Registered broadcaster profiles</p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-surfaceBorder">
          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-2">
            <span>Currently Live Rooms</span>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          </div>
          <div className="text-3xl font-black text-red-400">{stats?.liveStreams || 0}</div>
          <p className="text-[11px] text-gray-400 mt-2">Public & private active streams</p>
        </div>
      </div>

      {/* Payout Approval Queue */}
      <div className="p-6 rounded-2xl glass-panel border border-surfaceBorder">
        <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
          <Clock className="w-4 h-4 text-tokenGold" />
          <span>Streamer Payout Approval Queue</span>
        </h2>
        <p className="text-xs text-gray-400 mb-5">
          Review cashout requests submitted by streamers. Approving triggers payout via the configured payment gateway.
        </p>

        {payouts.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No pending payout requests.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="text-[11px] text-gray-400 uppercase border-b border-surfaceBorder">
                <tr>
                  <th className="py-2.5">Streamer</th>
                  <th className="py-2.5">Requested At</th>
                  <th className="py-2.5">Tokens</th>
                  <th className="py-2.5">Amount (USD)</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surfaceBorder/60">
                {payouts.map((p) => {
                  const isPending = p.status === 'REQUESTED';
                  const isBusy = actionLoading === p.id;
                  return (
                    <tr key={p.id}>
                      <td className="py-3 font-bold text-white">
                        {p.streamer?.displayName || 'Streamer'}
                        <span className="block text-[10px] text-gray-400 font-normal">
                          {p.streamer?.user?.email}
                        </span>
                      </td>
                      <td className="py-3 text-gray-400 font-mono">
                        {new Date(p.requestedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 font-bold text-tokenGold">{p.tokensDeducted} 🪙</td>
                      <td className="py-3 font-bold text-emerald-400">
                        ${(p.payoutAmountCents / 100).toFixed(2)}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          p.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : p.status === 'REJECTED'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handlePayoutAction(p.id, 'APPROVE')}
                              disabled={isBusy}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 transition"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handlePayoutAction(p.id, 'REJECT')}
                              disabled={isBusy}
                              className="px-2.5 py-1 rounded-lg bg-surfaceLight hover:bg-red-500/20 text-red-400 text-[11px] font-semibold transition"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-500 font-mono">
                            {p.paymentReference || 'Resolved'}
                          </span>
                        )}
                      </td>
                    </tr>
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

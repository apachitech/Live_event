'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Building2,
  Users,
  Video,
  DollarSign,
  Coins,
  Plus,
  Search,
  ExternalLink,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export default function AgencyDashboardPage() {
  const { user } = useAuth();
  const [agencyData, setAgencyData] = useState<any>(null);
  const [talent, setTalent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Recruit modal
  const [recruitModalOpen, setRecruitModalOpen] = useState(false);
  const [recruitInput, setRecruitInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAgency = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/agency');
      const data = await res.json();
      if (data.success) {
        setAgencyData(data.agency);
        setTalent(data.talent);
      } else {
        setNotice({ type: 'error', text: data.error || 'Failed to load agency data' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgency();
  }, []);

  const handleRecruitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recruitInput.trim()) return;
    setActionLoading(true);
    setNotice(null);

    try {
      const res = await fetch('/api/agency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail: recruitInput }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setNotice({ type: 'success', text: data.message });
        setRecruitModalOpen(false);
        setRecruitInput('');
        await fetchAgency();
      } else {
        setNotice({ type: 'error', text: data.error || 'Failed to link talent' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredTalent = talent.filter(
    (t) =>
      t.username.toLowerCase().includes(search.toLowerCase()) ||
      (t.displayName && t.displayName.toLowerCase().includes(search.toLowerCase())) ||
      t.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surfaceBorder">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] font-extrabold uppercase tracking-wider">
              AGENCY MANAGEMENT
            </span>
          </div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-cyan-400" />
            <span>{agencyData?.name || 'Agency Portal'}</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Recruit talent, monitor live broadcasts, review KYC compliance statuses, and manage commissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAgency()}
            className="p-2.5 rounded-xl bg-surfaceLight hover:bg-surfaceLight/80 text-gray-300 transition border border-surfaceBorder"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setRecruitModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-cyan-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Recruit Streamer / Talent</span>
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-2 border ${
            notice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{notice.text}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-gray-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-panel border border-surfaceBorder">
          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-2">
            <span>Managed Talent Roster</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-white">{agencyData?.talentCount ?? 0}</div>
          <p className="text-[11px] text-gray-400 mt-2">Active signed broadcasters</p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-surfaceBorder">
          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-2">
            <span>Broadcasters Live Now</span>
            <Video className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-3xl font-black text-pink-400 flex items-center gap-2">
            <span>{agencyData?.liveNowCount ?? 0}</span>
            {agencyData?.liveNowCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />}
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Currently streaming talent</p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-surfaceBorder">
          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-2">
            <span>Combined Talent Earnings</span>
            <Coins className="w-4 h-4 text-tokenGold" />
          </div>
          <div className="text-3xl font-black text-tokenGold">
            {agencyData?.combinedEarnedTokens ?? 0}
            <span className="text-xs font-semibold text-gray-400 ml-1">Tokens</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Total gross token tips & shows</p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-surfaceBorder">
          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-2">
            <span>Est. Agency Commission (10%)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">
            ${agencyData?.estimatedCommissionUsd ?? '0.00'}
            <span className="text-xs font-semibold text-gray-400 ml-1">USD</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Commission on talent payouts</p>
        </div>
      </div>

      {/* Talent Roster Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Agency Broadcaster Roster</span>
            </h2>
            <span className="text-xs font-bold text-gray-400">({filteredTalent.length})</span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search talent..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-surfaceBorder">
          {loading ? (
            <div className="py-12 text-center text-xs text-gray-400">Loading agency roster...</div>
          ) : filteredTalent.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400 space-y-2">
              <p className="italic">No talent linked to your agency yet.</p>
              <button
                onClick={() => setRecruitModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Recruit Your First Broadcaster</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="text-[11px] text-gray-400 uppercase border-b border-surfaceBorder">
                  <tr>
                    <th className="py-3 px-3">Talent / Broadcaster</th>
                    <th className="py-3 px-3">Live Status</th>
                    <th className="py-3 px-3">KYC Compliance</th>
                    <th className="py-3 px-3">Earned Tokens</th>
                    <th className="py-3 px-3">Broadcasts</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surfaceBorder/60">
                  {filteredTalent.map((t) => (
                    <tr key={t.id} className="hover:bg-surfaceLight/40 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center font-bold text-white text-xs shrink-0">
                            {(t.displayName || t.username).substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{t.displayName || `@${t.username}`}</span>
                            <span className="text-[10px] text-gray-400 font-mono">@{t.username}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {t.isLive ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                            <span>LIVE</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-gray-400 bg-surfaceLight border border-surfaceBorder">
                            Offline
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            t.kycStatus === 'VERIFIED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : t.kycStatus === 'PENDING'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-surfaceLight text-gray-400 border border-surfaceBorder'
                          }`}
                        >
                          {t.kycStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-tokenGold flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5" />
                          {t.earnedTokens}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-300">
                        {t.totalStreams} streams • {t.totalVods} VODs
                      </td>
                      <td className="py-3 px-3 text-right">
                        {t.isLive && t.activeStream ? (
                          <Link
                            href={`/watch/${t.activeStream.id}`}
                            target="_blank"
                            className="px-2.5 py-1 rounded-lg bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/30 text-xs font-bold inline-flex items-center gap-1 transition"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Watch Live</span>
                          </Link>
                        ) : (
                          <span className="text-[10px] text-gray-500 font-mono">—</span>
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

      {/* RECRUIT TALENT MODAL */}
      {recruitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl glass-panel border border-surfaceBorder p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surfaceBorder">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>Recruit Broadcaster to Agency</span>
              </h3>
              <button onClick={() => setRecruitModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Enter the username or registered email of the streamer you wish to add to your agency roster. Once linked, their broadcast statistics and commission tracking will appear in your portal.
            </p>

            <form onSubmit={handleRecruitSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">
                  Streamer Username or Email
                </label>
                <input
                  type="text"
                  required
                  value={recruitInput}
                  onChange={(e) => setRecruitInput(e.target.value)}
                  placeholder="e.g. streamer_jane or jane@streamer.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-white font-semibold focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRecruitModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surfaceLight text-xs text-gray-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-lg shadow-cyan-600/20 transition"
                >
                  {actionLoading ? 'Linking...' : 'Add to Roster'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

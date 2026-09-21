'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Video,
  Search,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Check,
  X,
  AlertCircle,
  ArrowLeft,
  Coins,
  Building2,
  Edit2,
  Trash2,
  FileText,
  UserCheck,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export default function AdminStreamersPage() {
  const [streamers, setStreamers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState('ALL');

  // Modals
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedStreamer, setSelectedStreamer] = useState<any>(null);

  // KYC Reject Form
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  // Edit Streamer Form
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    payoutMethod: '',
    agencyId: '',
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStreamers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/streamers?search=${encodeURIComponent(search)}&kyc=${kycFilter}`);
      const data = await res.json();
      if (data.streamers) {
        setStreamers(data.streamers);
        setStats(data.stats);
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreamers();
  }, [kycFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStreamers();
  };

  const openKycModal = (streamer: any) => {
    setSelectedStreamer(streamer);
    setShowRejectInput(false);
    setRejectionReason('');
    setKycModalOpen(true);
  };

  const handleKycAction = async (action: 'APPROVE_KYC' | 'REJECT_KYC') => {
    if (!selectedStreamer) return;
    setActionLoading(true);
    setNotice(null);

    try {
      const res = await fetch('/api/admin/streamers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamerId: selectedStreamer.id,
          action,
          rejectionReason: action === 'REJECT_KYC' ? rejectionReason : undefined,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setNotice({ type: 'success', text: data.message });
        setKycModalOpen(false);
        await fetchStreamers();
      } else {
        setNotice({ type: 'error', text: data.error || 'Failed to update KYC status' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (streamer: any) => {
    setSelectedStreamer(streamer);
    setEditForm({
      displayName: streamer.displayName || '',
      bio: streamer.bio || '',
      payoutMethod: streamer.payoutMethod || '',
      agencyId: streamer.agencyId || '',
    });
    setEditModalOpen(true);
  };

  const handleEditStreamer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStreamer) return;
    setActionLoading(true);
    setNotice(null);

    try {
      const res = await fetch('/api/admin/streamers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamerId: selectedStreamer.id,
          ...editForm,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setNotice({ type: 'success', text: 'Broadcaster profile updated successfully!' });
        setEditModalOpen(false);
        await fetchStreamers();
      } else {
        setNotice({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStreamer = async () => {
    if (!selectedStreamer) return;
    setActionLoading(true);
    setNotice(null);

    try {
      const res = await fetch(`/api/admin/streamers?id=${selectedStreamer.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setNotice({ type: 'success', text: data.message });
        setDeleteModalOpen(false);
        await fetchStreamers();
      } else {
        setNotice({ type: 'error', text: data.error || 'Failed to delete streamer profile' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surfaceBorder">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 rounded-xl bg-surfaceLight hover:bg-surfaceLight/80 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Video className="w-6 h-6 text-pink-400" />
              <span>Streamers & KYC Verification Center</span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Review mandatory KYC compliance submissions, approve/reject cashout eligibility, and manage broadcaster profiles.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchStreamers()}
            className="p-2.5 rounded-xl bg-surfaceLight hover:bg-surfaceLight/80 text-gray-300 transition border border-surfaceBorder"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
            {notice.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{notice.text}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-gray-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl glass-panel border border-surfaceBorder">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Total Streamers</span>
          <div className="text-xl font-black text-white mt-1">{stats?.total ?? '—'}</div>
        </div>
        <div
          onClick={() => setKycFilter('PENDING')}
          className={`p-3.5 rounded-xl border cursor-pointer transition ${
            stats?.pendingKyc > 0
              ? 'bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/20'
              : 'glass-panel border-surfaceBorder'
          }`}
        >
          <span className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1.5">
            <span>Pending KYC</span>
            {stats?.pendingKyc > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
          </span>
          <div className="text-xl font-black text-amber-400 mt-1">{stats?.pendingKyc ?? '—'}</div>
        </div>
        <div
          onClick={() => setKycFilter('VERIFIED')}
          className="p-3.5 rounded-xl glass-panel border border-surfaceBorder cursor-pointer hover:border-emerald-500/40 transition"
        >
          <span className="text-[10px] font-bold text-emerald-400 uppercase">Verified & Compliant</span>
          <div className="text-xl font-black text-emerald-400 mt-1">{stats?.verifiedKyc ?? '—'}</div>
        </div>
        <div
          onClick={() => setKycFilter('NOT_SUBMITTED')}
          className="p-3.5 rounded-xl glass-panel border border-surfaceBorder cursor-pointer hover:border-gray-500 transition"
        >
          <span className="text-[10px] font-bold text-gray-400 uppercase">Not Submitted</span>
          <div className="text-xl font-black text-gray-300 mt-1">{stats?.notSubmittedKyc ?? '—'}</div>
        </div>
        <div
          onClick={() => setKycFilter('REJECTED')}
          className="p-3.5 rounded-xl glass-panel border border-surfaceBorder cursor-pointer hover:border-red-500/40 transition"
        >
          <span className="text-[10px] font-bold text-red-400 uppercase">Rejected</span>
          <div className="text-xl font-black text-red-400 mt-1">{stats?.rejectedKyc ?? '—'}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* KYC Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Broadcasters' },
            { id: 'PENDING', label: `Pending Review (${stats?.pendingKyc ?? 0})` },
            { id: 'VERIFIED', label: 'Verified (Unlocked)' },
            { id: 'NOT_SUBMITTED', label: 'Not Submitted' },
            { id: 'REJECTED', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setKycFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                kycFilter === tab.id
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'bg-surfaceLight/60 text-gray-400 hover:text-white border border-surfaceBorder'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search streamer or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-white focus:outline-none focus:border-brandPurple"
          />
        </form>
      </div>

      {/* Streamers Table */}
      <div className="p-5 rounded-2xl glass-panel border border-surfaceBorder">
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-400">Loading broadcaster registry...</div>
        ) : streamers.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400 italic">No streamers found in this view.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="text-[11px] text-gray-400 uppercase border-b border-surfaceBorder">
                <tr>
                  <th className="py-3 px-3">Broadcaster</th>
                  <th className="py-3 px-3">KYC Status</th>
                  <th className="py-3 px-3">Earned Tokens</th>
                  <th className="py-3 px-3">Streams & VODs</th>
                  <th className="py-3 px-3">KYC Submitted</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surfaceBorder/60">
                {streamers.map((s) => {
                  const isPending = s.kycStatus === 'PENDING';
                  const isVerified = s.kycStatus === 'VERIFIED';
                  const isRejected = s.kycStatus === 'REJECTED';

                  return (
                    <tr key={s.id} className="hover:bg-surfaceLight/40 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-600 to-purple-600 flex items-center justify-center font-bold text-white text-xs shrink-0">
                            {(s.displayName || s.user?.username || 'ST').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-white block">
                              {s.displayName || `@${s.user?.username}`}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              @{s.user?.username} • {s.user?.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isVerified
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : isPending
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                              : isRejected
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-surfaceLight text-gray-400 border border-surfaceBorder'
                          }`}
                        >
                          {s.kycStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-tokenGold flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5" />
                          {s.user?.wallet?.earnedBalance ?? 0}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-300">
                        {s._count?.streams ?? 0} streams • {s._count?.vods ?? 0} VODs
                      </td>
                      <td className="py-3 px-3 text-gray-400 font-mono text-[11px]">
                        {s.kycSubmittedAt ? new Date(s.kycSubmittedAt).toLocaleDateString() : 'Not submitted'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Review KYC Button */}
                          <button
                            onClick={() => openKycModal(s)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                              isPending
                                ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/40'
                                : 'bg-surfaceLight text-gray-300 hover:text-white border border-surfaceBorder'
                            }`}
                            title="Inspect KYC verification dossier"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>{isPending ? 'Review KYC' : 'View KYC'}</span>
                          </button>

                          <button
                            onClick={() => openEditModal(s)}
                            className="p-1.5 rounded-lg bg-surfaceLight hover:bg-brandPurple/20 text-gray-400 hover:text-brandPurple transition"
                            title="Edit streamer profile"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedStreamer(s);
                              setDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-surfaceLight hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition"
                            title="Revoke streamer profile"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* KYC REVIEW DOSSIER MODAL */}
      {kycModalOpen && selectedStreamer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl glass-panel border border-surfaceBorder p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surfaceBorder">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-brandPurple" />
                  <span>KYC Identity Verification Dossier</span>
                </h3>
                <span className="text-xs text-gray-400">
                  Broadcaster: <strong className="text-white">@{selectedStreamer.user?.username}</strong>
                </span>
              </div>
              <button onClick={() => setKycModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dossier Information Grid */}
            <div className="p-4 rounded-xl bg-surfaceLight/50 border border-surfaceBorder space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-surfaceBorder/60">
                <span className="text-gray-400">Current Status:</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    selectedStreamer.kycStatus === 'VERIFIED'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : selectedStreamer.kycStatus === 'PENDING'
                      ? 'bg-amber-500/20 text-amber-400'
                      : selectedStreamer.kycStatus === 'REJECTED'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-surfaceLight text-gray-400'
                  }`}
                >
                  {selectedStreamer.kycStatus}
                </span>
              </div>

              {selectedStreamer.parsedKycDetails ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">Legal Name</span>
                      <strong className="text-white text-xs">
                        {selectedStreamer.parsedKycDetails.legalFirstName}{' '}
                        {selectedStreamer.parsedKycDetails.legalLastName}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">Country</span>
                      <span className="text-gray-200">{selectedStreamer.parsedKycDetails.country}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">Government ID Type</span>
                      <span className="text-cyan-400 font-bold">{selectedStreamer.parsedKycDetails.idType}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">Document Number</span>
                      <span className="text-white font-mono">{selectedStreamer.parsedKycDetails.idNumber}</span>
                    </div>
                  </div>

                  {selectedStreamer.parsedKycDetails.dateOfBirth && (
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">Date of Birth</span>
                      <span className="text-gray-300">{selectedStreamer.parsedKycDetails.dateOfBirth}</span>
                    </div>
                  )}

                  {selectedStreamer.parsedKycDetails.residentialAddress && (
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">Residential Address</span>
                      <span className="text-gray-300">{selectedStreamer.parsedKycDetails.residentialAddress}</span>
                    </div>
                  )}

                  {selectedStreamer.parsedKycDetails.rejectionReason && (
                    <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300">
                      <span className="font-bold block text-[10px] uppercase">Prior Rejection Note:</span>
                      {selectedStreamer.parsedKycDetails.rejectionReason}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-400 italic py-2">
                  No KYC documents submitted yet for this broadcaster.
                </p>
              )}
            </div>

            {/* Rejection input area if toggled */}
            {showRejectInput && (
              <div className="space-y-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <label className="block text-[11px] font-bold text-red-400 uppercase">
                  Rejection Reason (Sent to Broadcaster)
                </label>
                <textarea
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. ID photo was blurry or name did not match registered account..."
                  className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-white focus:outline-none focus:border-red-400"
                />
                <button
                  type="button"
                  onClick={() => handleKycAction('REJECT_KYC')}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow transition w-full"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm KYC Rejection'}
                </button>
              </div>
            )}

            {/* Approval / Rejection Action Controls */}
            <div className="pt-3 border-t border-surfaceBorder flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setKycModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-surfaceLight text-xs text-gray-400 hover:text-white transition"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {!showRejectInput && (
                  <button
                    type="button"
                    onClick={() => setShowRejectInput(true)}
                    className="px-3.5 py-2 rounded-xl bg-surfaceLight hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-surfaceBorder transition"
                  >
                    Reject KYC...
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleKycAction('APPROVE_KYC')}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow flex items-center gap-1.5 transition"
                >
                  <Check className="w-4 h-4" />
                  <span>{actionLoading ? 'Approving...' : 'Approve KYC & Unlock Cashouts'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT STREAMER MODAL */}
      {editModalOpen && selectedStreamer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl glass-panel border border-surfaceBorder p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surfaceBorder">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-pink-400" />
                <span>Edit Broadcaster Profile</span>
              </h3>
              <button onClick={() => setEditModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditStreamer} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-white font-semibold focus:outline-none focus:border-brandPurple"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Bio / Slogan</label>
                <textarea
                  rows={2}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-white focus:outline-none focus:border-brandPurple"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Preferred Payout Method</label>
                <select
                  value={editForm.payoutMethod}
                  onChange={(e) => setEditForm({ ...editForm, payoutMethod: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-white font-semibold focus:outline-none focus:border-brandPurple"
                >
                  <option value="">None configured</option>
                  <option value="STRIPE_CONNECT">Stripe Connect</option>
                  <option value="VAULTPAY_CARD">VaultPay Card</option>
                  <option value="CRYPTO_USDT_TRC20">USDT TRC-20</option>
                  <option value="PAYPAL">PayPal</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Linked Agency ID / User ID</label>
                <input
                  type="text"
                  value={editForm.agencyId}
                  onChange={(e) => setEditForm({ ...editForm, agencyId: e.target.value })}
                  placeholder="Optional Agency User ID"
                  className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surfaceLight text-xs text-gray-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-glow-purple px-5 py-2 rounded-xl text-xs font-bold text-white shadow transition"
                >
                  {actionLoading ? 'Saving...' : 'Save Broadcaster Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVOKE / DELETE MODAL */}
      {deleteModalOpen && selectedStreamer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl glass-panel border border-surfaceBorder p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Revoke Streamer Profile?</h3>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to revoke the broadcaster profile for <strong className="text-white">@{selectedStreamer.user?.username}</strong>? Their account will be converted back to a regular Viewer, but their token wallet will remain safe.
            </p>

            <div className="pt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-surfaceLight text-xs text-gray-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteStreamer}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow transition"
              >
                {actionLoading ? 'Revoking...' : 'Confirm Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

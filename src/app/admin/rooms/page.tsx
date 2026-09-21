'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Radio,
  Search,
  Plus,
  Play,
  Square,
  Eye,
  Coins,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Layers,
  Lock,
} from 'lucide-react';

export default function AdminRoomsPage() {
  const [streams, setStreams] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [terminateModalOpen, setTerminateModalOpen] = useState(false);
  const [selectedStream, setSelectedStream] = useState<any>(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    streamerId: '',
    title: '',
    category: 'Gaming & Chat',
    sourceType: 'WEBRTC',
    externalStreamUrl: '',
    isPrivate: false,
    privateRatePerMin: 60,
  });

  const [editForm, setEditForm] = useState({
    title: '',
    category: '',
    sourceType: 'WEBRTC',
    externalStreamUrl: '',
    privateRatePerMin: 60,
  });

  const [streamersList, setStreamersList] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/rooms?search=${encodeURIComponent(search)}&status=${selectedStatus}`);
      const data = await res.json();
      if (data.streams) {
        setStreams(data.streams);
        setStats(data.stats);
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchStreamersForDropdown = async () => {
    try {
      const res = await fetch('/api/admin/streamers');
      const data = await res.json();
      if (data.streamers) {
        setStreamersList(data.streamers);
        if (data.streamers.length > 0 && !createForm.streamerId) {
          setCreateForm((prev) => ({ ...prev, streamerId: data.streamers[0].id }));
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchRooms();
  }, [selectedStatus]);

  useEffect(() => {
    fetchStreamersForDropdown();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRooms();
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setNotice(null);

    try {
      const res = await fetch('/api/admin/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setNotice({ type: 'success', text: `Stream room "${data.stream.title}" created successfully!` });
        setCreateModalOpen(false);
        setCreateForm({
          streamerId: streamersList[0]?.id || '',
          title: '',
          category: 'Gaming & Chat',
          sourceType: 'WEBRTC',
          externalStreamUrl: '',
          isPrivate: false,
          privateRatePerMin: 60,
        });
        await fetchRooms();
      } else {
        setNotice({ type: 'error', text: data.error || 'Failed to create room' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (stream: any) => {
    setSelectedStream(stream);
    setEditForm({
      title: stream.title,
      category: stream.category,
      sourceType: stream.sourceType || 'WEBRTC',
      externalStreamUrl: stream.externalStreamUrl || '',
      privateRatePerMin: stream.privateRatePerMin || 60,
    });
    setEditModalOpen(true);
  };

  const handleEditRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStream) return;
    setActionLoading(true);
    setNotice(null);

    try {
      const res = await fetch('/api/admin/rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamId: selectedStream.id,
          ...editForm,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setNotice({ type: 'success', text: 'Room settings updated successfully!' });
        setEditModalOpen(false);
        await fetchRooms();
      } else {
        setNotice({ type: 'error', text: data.error || 'Failed to update room' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTerminateStream = async () => {
    if (!selectedStream) return;
    setActionLoading(true);
    setNotice(null);

    try {
      const res = await fetch('/api/admin/rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamId: selectedStream.id,
          action: 'TERMINATE_LIVE',
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setNotice({ type: 'success', text: data.message });
        setTerminateModalOpen(false);
        await fetchRooms();
      } else {
        setNotice({ type: 'error', text: data.error || 'Failed to terminate stream' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!selectedStream) return;
    setActionLoading(true);
    setNotice(null);

    try {
      const res = await fetch(`/api/admin/rooms?id=${selectedStream.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setNotice({ type: 'success', text: data.message });
        setDeleteModalOpen(false);
        await fetchRooms();
      } else {
        setNotice({ type: 'error', text: data.error || 'Failed to delete room' });
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
              <Radio className="w-6 h-6 text-brandPurple" />
              <span>Live Rooms & Broadcasts (CRUD)</span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Monitor active rooms, terminate live broadcasts in real time, configure room keys, and manage stream records.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchRooms()}
            className="p-2.5 rounded-xl bg-surfaceLight hover:bg-surfaceLight/80 text-gray-300 transition border border-surfaceBorder"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="btn-glow-purple px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Create Live Room</span>
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
          <span className="text-[10px] font-bold text-gray-400 uppercase">Total Rooms</span>
          <div className="text-xl font-black text-white mt-1">{stats?.total ?? '—'}</div>
        </div>
        <div
          onClick={() => setSelectedStatus('LIVE')}
          className={`p-3.5 rounded-xl border cursor-pointer transition ${
            stats?.live > 0 ? 'bg-red-500/10 border-red-500/40 hover:bg-red-500/20' : 'glass-panel border-surfaceBorder'
          }`}
        >
          <span className="text-[10px] font-bold text-red-400 uppercase flex items-center gap-1.5">
            <span>Currently Live</span>
            {stats?.live > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
          </span>
          <div className="text-xl font-black text-red-400 mt-1">{stats?.live ?? '—'}</div>
        </div>
        <div
          onClick={() => setSelectedStatus('PRIVATE')}
          className="p-3.5 rounded-xl glass-panel border border-surfaceBorder cursor-pointer hover:border-purple-500/40 transition"
        >
          <span className="text-[10px] font-bold text-purple-400 uppercase">Private Shows</span>
          <div className="text-xl font-black text-purple-400 mt-1">{stats?.private ?? '—'}</div>
        </div>
        <div
          onClick={() => setSelectedStatus('OFFLINE')}
          className="p-3.5 rounded-xl glass-panel border border-surfaceBorder cursor-pointer hover:border-gray-500 transition"
        >
          <span className="text-[10px] font-bold text-gray-400 uppercase">Offline</span>
          <div className="text-xl font-black text-gray-300 mt-1">{stats?.offline ?? '—'}</div>
        </div>
        <div
          onClick={() => setSelectedStatus('ENDED')}
          className="p-3.5 rounded-xl glass-panel border border-surfaceBorder cursor-pointer hover:border-gray-500 transition"
        >
          <span className="text-[10px] font-bold text-gray-500 uppercase">Ended Archives</span>
          <div className="text-xl font-black text-gray-400 mt-1">{stats?.ended ?? '—'}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Rooms' },
            { id: 'LIVE', label: `Live Now (${stats?.live ?? 0})` },
            { id: 'PRIVATE', label: 'Private Shows' },
            { id: 'OFFLINE', label: 'Offline' },
            { id: 'ENDED', label: 'Ended' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                selectedStatus === tab.id
                  ? 'bg-brandPurple text-white shadow-sm'
                  : 'bg-surfaceLight/60 text-gray-400 hover:text-white border border-surfaceBorder'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search room, title, streamer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-white focus:outline-none focus:border-brandPurple"
          />
        </form>
      </div>

      {/* Streams Table */}
      <div className="p-5 rounded-2xl glass-panel border border-surfaceBorder">
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-400">Loading broadcast rooms...</div>
        ) : streams.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400 italic">No stream rooms found matching your view.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="text-[11px] text-gray-400 uppercase border-b border-surfaceBorder">
                <tr>
                  <th className="py-3 px-3">Room / Title</th>
                  <th className="py-3 px-3">Broadcaster</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Viewers</th>
                  <th className="py-3 px-3">Tokens Earned</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surfaceBorder/60">
                {streams.map((s) => {
                  const isLive = s.status === 'LIVE';
                  const isPrivate = s.status === 'PRIVATE';

                  return (
                    <tr key={s.id} className="hover:bg-surfaceLight/40 transition">
                      <td className="py-3 px-3">
                        <div>
                          <span className="font-bold text-white block">{s.title}</span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {s.roomName} • {s.category}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-gray-200 block">
                          {s.streamer?.displayName || 'Streamer'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          @{s.streamer?.user?.username}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-fit ${
                            isLive
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : isPrivate
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-surfaceLight text-gray-400 border border-surfaceBorder'
                          }`}
                        >
                          {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />}
                          <span>{s.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-white flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-gray-400" />
                          {s.viewerCount ?? 0}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-tokenGold flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5" />
                          {s.totalTokensEarned ?? 0}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[10px] font-mono text-gray-400">
                        {s.sourceType || 'WEBRTC'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Force Terminate button if active */}
                          {(isLive || isPrivate) && (
                            <button
                              onClick={() => {
                                setSelectedStream(s);
                                setTerminateModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 text-xs font-bold transition flex items-center gap-1"
                              title="Force-terminate live broadcast"
                            >
                              <Square className="w-3 h-3 fill-current" />
                              <span>End Stream</span>
                            </button>
                          )}

                          {/* Watch room link */}
                          <Link
                            href={`/watch/${s.id}`}
                            target="_blank"
                            className="p-1.5 rounded-lg bg-surfaceLight hover:bg-brandPurple/20 text-gray-400 hover:text-brandPurple transition"
                            title="Open watch page in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => openEditModal(s)}
                            className="p-1.5 rounded-lg bg-surfaceLight hover:bg-brandPurple/20 text-gray-400 hover:text-brandPurple transition"
                            title="Edit room settings"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedStream(s);
                              setDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-surfaceLight hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition"
                            title="Delete room"
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

      {/* CREATE ROOM MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl glass-panel border border-surfaceBorder p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surfaceBorder">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-brandPurple" />
                <span>Create New Live Stream Room</span>
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Assign to Broadcaster</label>
                <select
                  value={createForm.streamerId}
                  onChange={(e) => setCreateForm({ ...createForm, streamerId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-white font-semibold focus:outline-none focus:border-brandPurple"
                >
                  {streamersList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.displayName || `@${s.user?.username}`} ({s.user?.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Room Title</label>
                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-white font-semibold focus:outline-none focus:border-brandPurple"
                  placeholder="e.g. VIP Interactive Night Stream"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Category</label>
                  <input
                    type="text"
                    value={createForm.category}
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-white font-semibold focus:outline-none focus:border-brandPurple"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Source Type</label>
                  <select
                    value={createForm.sourceType}
                    onChange={(e) => setCreateForm({ ...createForm, sourceType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-white font-semibold focus:outline-none focus:border-brandPurple"
                  >
                    <option value="WEBRTC">WebRTC (In-Browser Studio)</option>
                    <option value="RTMP">RTMP (OBS / External Software)</option>
                    <option value="EXTERNAL_EMBED">External Embed / HLS</option>
                  </select>
                </div>
              </div>

              {createForm.sourceType === 'EXTERNAL_EMBED' && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">External Stream URL</label>
                  <input
                    type="text"
                    value={createForm.externalStreamUrl}
                    onChange={(e) => setCreateForm({ ...createForm, externalStreamUrl: e.target.value })}
                    placeholder="https://.../stream.m3u8"
                    className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-white font-mono focus:outline-none focus:border-brandPurple"
                  />
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surfaceLight text-xs text-gray-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-glow-purple px-5 py-2 rounded-xl text-xs font-bold text-white shadow transition"
                >
                  {actionLoading ? 'Creating Room...' : 'Create Stream Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ROOM MODAL */}
      {editModalOpen && selectedStream && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl glass-panel border border-surfaceBorder p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surfaceBorder">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-brandPurple" />
                <span>Edit Room Settings</span>
              </h3>
              <button onClick={() => setEditModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditRoom} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-white font-semibold focus:outline-none focus:border-brandPurple"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Category</label>
                  <input
                    type="text"
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-white font-semibold focus:outline-none focus:border-brandPurple"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Source Type</label>
                  <select
                    value={editForm.sourceType}
                    onChange={(e) => setEditForm({ ...editForm, sourceType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-white font-semibold focus:outline-none focus:border-brandPurple"
                  >
                    <option value="WEBRTC">WebRTC</option>
                    <option value="RTMP">RTMP</option>
                    <option value="EXTERNAL_EMBED">External Embed / HLS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Private Rate (Tokens / Min)</label>
                <input
                  type="number"
                  min="1"
                  value={editForm.privateRatePerMin}
                  onChange={(e) => setEditForm({ ...editForm, privateRatePerMin: parseInt(e.target.value, 10) || 60 })}
                  className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-tokenGold font-bold focus:outline-none focus:border-brandPurple"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">External Stream URL</label>
                <input
                  type="text"
                  value={editForm.externalStreamUrl}
                  onChange={(e) => setEditForm({ ...editForm, externalStreamUrl: e.target.value })}
                  placeholder="https://.../stream.m3u8"
                  className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-white font-mono focus:outline-none focus:border-brandPurple"
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
                  {actionLoading ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORCE TERMINATE STREAM MODAL */}
      {terminateModalOpen && selectedStream && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl glass-panel border border-surfaceBorder p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <div className="p-2.5 rounded-xl bg-red-500/20">
                <Square className="w-5 h-5 fill-current" />
              </div>
              <h3 className="text-base font-bold text-white">Terminate Live Broadcast?</h3>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to immediately force-close <strong className="text-white">"{selectedStream.title}"</strong>? Broadcasters and connected viewers will be kicked, the room status will switch to ENDED, and a socket notification will be sent across the network.
            </p>

            <div className="pt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setTerminateModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-surfaceLight text-xs text-gray-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTerminateStream}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow transition"
              >
                {actionLoading ? 'Terminating...' : 'Force End Stream'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ROOM MODAL */}
      {deleteModalOpen && selectedStream && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl glass-panel border border-surfaceBorder p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Delete Stream Room?</h3>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">"{selectedStream.title}"</strong> ({selectedStream.roomName})? This will permanently remove the room record and chat history.
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
                onClick={handleDeleteRoom}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow transition"
              >
                {actionLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

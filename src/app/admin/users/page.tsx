'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Plus,
  Shield,
  Video,
  Building2,
  Coins,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  X,
  UserCheck,
  RefreshCw,
} from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'VIEWER',
    startingTokens: 100,
    agencyName: '',
  });

  const [editForm, setEditForm] = useState({
    role: 'VIEWER',
    username: '',
    email: '',
    tokenAdjustment: 0,
    ageVerified: true,
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}&role=${selectedRole}`);
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
        setStats(data.stats);
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedRole]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setNotice(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setNotice({ type: 'success', text: `User @${data.user.username} created successfully!` });
        setCreateModalOpen(false);
        setCreateForm({
          username: '',
          email: '',
          password: '',
          role: 'VIEWER',
          startingTokens: 100,
          agencyName: '',
        });
        await fetchUsers();
      } else {
        setNotice({ type: 'error', text: data.error || 'Failed to create user' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (user: any) => {
    setSelectedUser(user);
    setEditForm({
      role: user.role,
      username: user.username,
      email: user.email,
      tokenAdjustment: 0,
      ageVerified: Boolean(user.ageVerifiedAt),
    });
    setEditModalOpen(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoading(true);
    setNotice(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          ...editForm,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setNotice({ type: 'success', text: `User @${selectedUser.username} updated successfully!` });
        setEditModalOpen(false);
        await fetchUsers();
      } else {
        setNotice({ type: 'error', text: data.error || 'Failed to update user' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    setNotice(null);

    try {
      const res = await fetch(`/api/admin/users?id=${selectedUser.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setNotice({ type: 'success', text: data.message || 'User deleted successfully' });
        setDeleteModalOpen(false);
        await fetchUsers();
      } else {
        setNotice({ type: 'error', text: data.error || 'Failed to delete user' });
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
              <Users className="w-6 h-6 text-brandPurple" />
              <span>Users Management (CRUD)</span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Create, view, modify roles, adjust token balances, and manage all platform accounts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchUsers()}
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
            <span>Create New User</span>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl glass-panel border border-surfaceBorder">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Total Accounts</span>
          <div className="text-xl font-black text-white mt-1">{stats?.total ?? '—'}</div>
        </div>
        <div className="p-3.5 rounded-xl glass-panel border border-surfaceBorder">
          <span className="text-[10px] font-bold text-brandPurple uppercase">Viewers</span>
          <div className="text-xl font-black text-brandPurple mt-1">{stats?.viewers ?? '—'}</div>
        </div>
        <div className="p-3.5 rounded-xl glass-panel border border-surfaceBorder">
          <span className="text-[10px] font-bold text-pink-400 uppercase">Streamers</span>
          <div className="text-xl font-black text-pink-400 mt-1">{stats?.streamers ?? '—'}</div>
        </div>
        <div className="p-3.5 rounded-xl glass-panel border border-surfaceBorder">
          <span className="text-[10px] font-bold text-cyan-400 uppercase">Agencies</span>
          <div className="text-xl font-black text-cyan-400 mt-1">{stats?.agencies ?? '—'}</div>
        </div>
        <div className="p-3.5 rounded-xl glass-panel border border-surfaceBorder">
          <span className="text-[10px] font-bold text-red-400 uppercase">Admins</span>
          <div className="text-xl font-black text-red-400 mt-1">{stats?.admins ?? '—'}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Role Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'VIEWER', 'STREAMER', 'AGENCY', 'ADMIN'].map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                selectedRole === role
                  ? 'bg-brandPurple text-white shadow-sm'
                  : 'bg-surfaceLight/60 text-gray-400 hover:text-white border border-surfaceBorder'
              }`}
            >
              {role === 'ALL' ? 'All Roles' : role}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-white focus:outline-none focus:border-brandPurple"
          />
        </form>
      </div>

      {/* Users Table */}
      <div className="p-5 rounded-2xl glass-panel border border-surfaceBorder">
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-400">Loading platform members...</div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400 italic">No users found matching your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="text-[11px] text-gray-400 uppercase border-b border-surfaceBorder">
                <tr>
                  <th className="py-3 px-3">User</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Token Balance</th>
                  <th className="py-3 px-3">Earned Tokens</th>
                  <th className="py-3 px-3">KYC Status</th>
                  <th className="py-3 px-3">Created</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surfaceBorder/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-surfaceLight/40 transition">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shrink-0">
                          {u.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-white block">@{u.username}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          u.role === 'ADMIN'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : u.role === 'STREAMER'
                            ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                            : u.role === 'AGENCY'
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            : 'bg-surfaceLight text-gray-300 border border-surfaceBorder'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-tokenGold flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5" />
                        {u.wallet?.balance ?? 0}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-400">
                      {u.wallet?.earnedBalance ?? 0}
                    </td>
                    <td className="py-3 px-3">
                      {u.streamerProfile ? (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                            u.streamerProfile.kycStatus === 'VERIFIED'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : u.streamerProfile.kycStatus === 'PENDING'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-surfaceLight text-gray-400'
                          }`}
                        >
                          {u.streamerProfile.kycStatus}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-500 font-mono">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-gray-400 font-mono text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 rounded-lg bg-surfaceLight hover:bg-brandPurple/20 text-gray-400 hover:text-brandPurple transition"
                          title="Edit user details & balance"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-surfaceLight hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition"
                          title="Delete user"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE USER MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl glass-panel border border-surfaceBorder p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surfaceBorder">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-brandPurple" />
                <span>Create New User</span>
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-white font-semibold focus:outline-none focus:border-brandPurple"
                  placeholder="e.g. johndoe"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-white font-semibold focus:outline-none focus:border-brandPurple"
                  placeholder="e.g. john@example.com"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-white font-semibold focus:outline-none focus:border-brandPurple"
                  placeholder="••••••••"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Role</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-white font-semibold focus:outline-none focus:border-brandPurple"
                  >
                    <option value="VIEWER">Viewer</option>
                    <option value="STREAMER">Streamer</option>
                    <option value="AGENCY">Agency</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Starting Tokens</label>
                  <input
                    type="number"
                    min="0"
                    value={createForm.startingTokens}
                    onChange={(e) => setCreateForm({ ...createForm, startingTokens: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-tokenGold font-bold focus:outline-none focus:border-brandPurple"
                  />
                </div>
              </div>

              {createForm.role === 'AGENCY' && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Agency Name</label>
                  <input
                    type="text"
                    value={createForm.agencyName}
                    onChange={(e) => setCreateForm({ ...createForm, agencyName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-cyan-300 font-semibold focus:outline-none focus:border-cyan-400"
                    placeholder="e.g. Talent Star Agency"
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
                  {actionLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl glass-panel border border-surfaceBorder p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surfaceBorder">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-brandPurple" />
                <span>Edit User @{selectedUser.username}</span>
              </h3>
              <button onClick={() => setEditModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditUser} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-white font-semibold focus:outline-none focus:border-brandPurple"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-white font-semibold focus:outline-none focus:border-brandPurple"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-white font-semibold focus:outline-none focus:border-brandPurple"
                >
                  <option value="VIEWER">Viewer</option>
                  <option value="STREAMER">Streamer (Broadcaster)</option>
                  <option value="AGENCY">Agency</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">
                  Adjust Token Balance (+/-)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={editForm.tokenAdjustment}
                    onChange={(e) => setEditForm({ ...editForm, tokenAdjustment: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-tokenGold font-bold focus:outline-none focus:border-brandPurple"
                    placeholder="e.g. 500 or -200"
                  />
                  <span className="text-[11px] text-gray-400 shrink-0">
                    Current: <strong className="text-white">{selectedUser.wallet?.balance ?? 0}</strong>
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.ageVerified}
                    onChange={(e) => setEditForm({ ...editForm, ageVerified: e.target.checked })}
                    className="rounded border-surfaceBorder text-brandPurple focus:ring-brandPurple"
                  />
                  <span className="text-xs text-gray-300">Mark Age Verified (18+)</span>
                </label>
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
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl glass-panel border border-surfaceBorder p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Delete User Account?</h3>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-white">@{selectedUser.username}</strong> ({selectedUser.email})? This action cannot be undone and will delete their wallet, stream profile, and associated history.
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
                onClick={handleDeleteUser}
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

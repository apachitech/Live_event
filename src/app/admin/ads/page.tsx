'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Megaphone,
  Plus,
  Trash2,
  ExternalLink,
  Eye,
  MousePointer,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';

interface Advertisement {
  id: string;
  title: string;
  imageUrl: string;
  targetUrl: string;
  placement: 'FEED' | 'DIRECTORY' | 'WATCH';
  active: boolean;
  clicks: number;
  impressions: number;
  createdAt: string;
}

export default function AdminAdvertisementsPage() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [placement, setPlacement] = useState<'FEED' | 'DIRECTORY' | 'WATCH'>('FEED');
  const [active, setActive] = useState(true);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/advertisements');
      const data = await res.json();
      if (data.success && data.ads) {
        setAds(data.ads);
      }
    } catch {
      showNotice('error', 'Failed to load advertisements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const showNotice = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim() || !targetUrl.trim()) {
      showNotice('error', 'Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/advertisements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          imageUrl,
          targetUrl,
          placement,
          active,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotice('success', 'Advertisement published successfully!');
        setShowCreateModal(false);
        setTitle('');
        setImageUrl('');
        setTargetUrl('');
        setPlacement('FEED');
        setActive(true);
        fetchAds();
      } else {
        showNotice('error', data.error || 'Failed to create advertisement');
      }
    } catch (err: any) {
      showNotice('error', err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (ad: Advertisement) => {
    try {
      const res = await fetch('/api/admin/advertisements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ad.id,
          active: !ad.active,
        }),
      });

      if (res.ok) {
        setAds((prev) =>
          prev.map((item) => (item.id === ad.id ? { ...item, active: !item.active } : item))
        );
        showNotice('success', `Ad status updated to ${!ad.active ? 'Active' : 'Paused'}`);
      } else {
        const d = await res.json();
        showNotice('error', d.error || 'Failed to update ad status');
      }
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  const handleDeleteAd = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this advertisement?')) return;

    try {
      const res = await fetch(`/api/admin/advertisements?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setAds((prev) => prev.filter((a) => a.id !== id));
        showNotice('success', 'Advertisement deleted');
      } else {
        const d = await res.json();
        showNotice('error', d.error || 'Failed to delete advertisement');
      }
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  // Sample quick presets for the admin
  const handleSelectPreset = (presetName: string) => {
    if (presetName === 'festival') {
      setTitle('Spring Live Creator Festival');
      setImageUrl('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80');
      setTargetUrl('https://pulsestream.live/explore');
      setPlacement('FEED');
    } else if (presetName === 'tokens') {
      setTitle('50% Bonus Tokens Weekend Flash Sale');
      setImageUrl('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80');
      setTargetUrl('https://pulsestream.live/wallet');
      setPlacement('DIRECTORY');
    } else if (presetName === 'hardware') {
      setTitle('Interactive Streamer Gear & Setup Deals');
      setImageUrl('https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80');
      setTargetUrl('https://pulsestream.live');
      setPlacement('WATCH');
    }
  };

  const totalImpressions = ads.reduce((acc, a) => acc + a.impressions, 0);
  const totalClicks = ads.reduce((acc, a) => acc + a.clicks, 0);
  const overallCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surfaceBorder">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 rounded-xl bg-surfaceLight border border-surfaceBorder hover:border-gray-600 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-brandPurple" />
              <span>Advertisements & Promotions</span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Create, schedule, and track sponsored banners and promotional swipe cards across your platform.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAds}
            disabled={loading}
            className="p-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder hover:border-gray-600 text-gray-400 hover:text-white transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brandPurple' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-glow-purple px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Create Advertisement</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl glass-panel border border-surfaceBorder">
          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-2">
            <span>Active Campaigns</span>
            <Megaphone className="w-4 h-4 text-brandPurple" />
          </div>
          <div className="text-3xl font-black text-white">
            {ads.filter((a) => a.active).length}{' '}
            <span className="text-xs text-gray-500 font-normal">/ {ads.length} total</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Currently serving in feeds & banners</p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-surfaceBorder">
          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-2">
            <span>Total Impressions</span>
            <Eye className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-blue-400">{totalImpressions.toLocaleString()}</div>
          <p className="text-[11px] text-gray-400 mt-2">Ad views logged across rooms and feeds</p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-surfaceBorder">
          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-2">
            <span>Total Clicks</span>
            <MousePointer className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">{totalClicks.toLocaleString()}</div>
          <p className="text-[11px] text-gray-400 mt-2">Outbound and internal referrals</p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-surfaceBorder">
          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-2">
            <span>Overall CTR</span>
            <TrendingUp className="w-4 h-4 text-tokenGold" />
          </div>
          <div className="text-3xl font-black text-tokenGold">{overallCtr}%</div>
          <p className="text-[11px] text-gray-400 mt-2">Average click-through performance</p>
        </div>
      </div>

      {/* Ads Table / Cards */}
      <div className="p-6 rounded-2xl glass-panel border border-surfaceBorder space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">All Advertisements</h2>
            <p className="text-xs text-gray-400">Manage visibility, placements, and creative assets.</p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-gray-500 animate-pulse">Loading advertisements...</div>
        ) : ads.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-brandPurple/10 text-brandPurple flex items-center justify-center mx-auto">
              <Megaphone className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">No advertisements created yet</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Boost platform engagement, sponsor events, or promote partners by creating your first ad banner.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-glow-purple px-4 py-2 rounded-xl text-xs font-bold text-white"
            >
              Create Your First Ad
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="text-[11px] text-gray-400 uppercase border-b border-surfaceBorder">
                <tr>
                  <th className="py-3 px-2">Creative & Title</th>
                  <th className="py-3 px-2">Placement</th>
                  <th className="py-3 px-2">Impressions</th>
                  <th className="py-3 px-2">Clicks</th>
                  <th className="py-3 px-2">CTR</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surfaceBorder/60">
                {ads.map((ad) => {
                  const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={ad.id} className="hover:bg-surfaceLight/30 transition">
                      <td className="py-3.5 px-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={ad.imageUrl}
                            alt={ad.title}
                            className="w-16 h-10 rounded-lg object-cover bg-black border border-surfaceBorder shrink-0"
                            onError={(e: any) => {
                              e.target.src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200';
                            }}
                          />
                          <div className="min-w-0 max-w-xs">
                            <span className="font-bold text-white block truncate">{ad.title}</span>
                            <a
                              href={ad.targetUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-brandPurple hover:underline flex items-center gap-1 truncate"
                            >
                              <span>{ad.targetUrl}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            ad.placement === 'FEED'
                              ? 'bg-purple-500/20 text-purple-300'
                              : ad.placement === 'DIRECTORY'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {ad.placement}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 font-mono text-gray-300">
                        {ad.impressions.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-2 font-mono text-emerald-400 font-bold">
                        {ad.clicks.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-2 font-mono text-tokenGold font-bold">{ctr}%</td>
                      <td className="py-3.5 px-2">
                        <button
                          onClick={() => handleToggleActive(ad)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition flex items-center gap-1.5 ${
                            ad.active
                              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                              : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${ad.active ? 'bg-emerald-400' : 'bg-gray-500'}`}
                          />
                          <span>{ad.active ? 'Active' : 'Paused'}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <button
                          onClick={() => handleDeleteAd(ad.id)}
                          className="p-1.5 rounded-lg bg-surfaceLight hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition"
                          title="Delete advertisement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl p-6 rounded-2xl glass-panel border border-surfaceBorder bg-[#13141f] shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-surfaceBorder">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-brandPurple" />
                <span>Create New Advertisement</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white text-xs font-bold px-2 py-1 rounded-lg hover:bg-surfaceLight"
              >
                ✕ Close
              </button>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-gray-400">Quick Template Inspiration:</span>
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSelectPreset('festival')}
                  className="px-2.5 py-1 rounded-lg bg-surfaceLight border border-surfaceBorder hover:border-brandPurple text-[11px] text-gray-300 transition"
                >
                  🎉 Creator Festival
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('tokens')}
                  className="px-2.5 py-1 rounded-lg bg-surfaceLight border border-surfaceBorder hover:border-brandPurple text-[11px] text-gray-300 transition"
                >
                  🪙 Token Sale
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('hardware')}
                  className="px-2.5 py-1 rounded-lg bg-surfaceLight border border-surfaceBorder hover:border-brandPurple text-[11px] text-gray-300 transition"
                >
                  🎮 Streamer Gear
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateAd} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300">Campaign / Ad Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Spring Creator Festival 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300">Placement *</label>
                  <select
                    value={placement}
                    onChange={(e: any) => setPlacement(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple"
                  >
                    <option value="FEED">Explore Swipe Feed Card</option>
                    <option value="DIRECTORY">Live Directory Top Banner</option>
                    <option value="WATCH">Watch Stream Overlay</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300">Initial Status</label>
                  <div className="flex items-center gap-3 pt-2">
                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={(e) => setActive(e.target.checked)}
                        className="rounded border-gray-700 text-brandPurple focus:ring-brandPurple"
                      />
                      <span>Active immediately</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300">Creative Image URL *</label>
                <div className="relative">
                  <input
                    type="url"
                    required
                    placeholder="https://images.unsplash.com/..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple font-mono"
                  />
                  <ImageIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
                {imageUrl && (
                  <div className="mt-2 relative rounded-xl overflow-hidden border border-surfaceBorder h-24 w-full bg-black">
                    <img src={imageUrl} alt="Ad Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300">Target Landing Page URL *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="https://... or /explore"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple font-mono"
                  />
                  <ExternalLink className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="pt-3 border-t border-surfaceBorder flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-surfaceLight hover:bg-surfaceLight/80 text-gray-300 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-glow-purple px-5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow"
                >
                  <span>{submitting ? 'Creating...' : 'Create & Publish Ad'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

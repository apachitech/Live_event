'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Film, Play, Search, Coins, Clock, Eye, Sparkles, Filter, Plus, Edit, Trash2, Megaphone } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import VodCrudModal, { VodData } from '@/components/vod/VodCrudModal';
import AdPlacement from '@/components/ads/AdPlacement';

interface VodItem {
  id: string;
  title: string;
  description?: string | null;
  videoUrl: string;
  thumbnailUrl?: string | null;
  durationSeconds: number;
  viewCount: number;
  priceTokens: number;
  sourceType: string;
  isPublished?: boolean;
  createdAt: string;
  streamer: {
    displayName: string;
    userId?: string;
    user: {
      id?: string;
      username: string;
      avatarUrl?: string | null;
    };
  };
}

export default function VodsDirectoryPage() {
  const { user, openCampaignModal } = useAuth();
  const [vods, setVods] = useState<VodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'free' | 'ppv'>('all');

  // CRUD Modal State
  const [crudModalOpen, setCrudModalOpen] = useState(false);
  const [vodToEdit, setVodToEdit] = useState<VodData | null>(null);

  useEffect(() => {
    fetchVods();
  }, []);

  const fetchVods = async () => {
    try {
      const res = await fetch('/api/vod');
      const data = await res.json();
      if (data.vods) {
        setVods(data.vods);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaved = (savedVod: any) => {
    setVods((prev) => {
      const exists = prev.some((v) => v.id === savedVod.id);
      if (exists) {
        return prev.map((v) => (v.id === savedVod.id ? { ...v, ...savedVod } : v));
      }
      return [savedVod, ...prev];
    });
  };

  const handleDeleted = (vodId: string) => {
    setVods((prev) => prev.filter((v) => v.id !== vodId));
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const filteredVods = vods.filter((v) => {
    const matchesSearch =
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.streamer?.displayName?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterType === 'free') return v.priceTokens === 0;
    if (filterType === 'ppv') return v.priceTokens > 0;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Hero Header */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-950/40 via-surface to-surface border border-brandPurple/30 p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brandPurple/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brandPurple/20 border border-brandPurple/40 text-purple-300 text-xs font-black uppercase tracking-wider">
            <Film className="w-3.5 h-3.5" />
            <span>Cloud Media & VOD Library</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Stream Replays & Pay-Per-View Shows
          </h1>
          <p className="text-sm text-gray-300 leading-relaxed">
            Missed a live broadcast? Watch high-definition replays, Cloudinary video streams, and exclusive pay-per-view creator specials on-demand.
          </p>
        </div>

        {/* Action Button: Viewers can only create Ad campaigns; Streamers/Agencies can do VOD + Ads */}
        <div className="relative z-10 flex-shrink-0 flex items-center gap-3 flex-wrap">
          {user && (user.role === 'STREAMER' || user.role === 'AGENCY' || user.role === 'ADMIN') ? (
            <>
              <button
                onClick={() => {
                  setVodToEdit(null);
                  setCrudModalOpen(true);
                }}
                className="btn-glow-purple px-5 py-3.5 rounded-2xl text-xs font-black text-white flex items-center gap-2 shadow-2xl hover:scale-105 transition"
                title="Create and publish a new VOD as Streamer or Agency"
              >
                <Plus className="w-4 h-4 text-purple-200 stroke-[3]" />
                <span>+ VOD CRUD</span>
              </button>
              <button
                onClick={openCampaignModal}
                className="px-4 py-3.5 rounded-2xl bg-surfaceLight border border-surfaceBorder hover:border-brandPurple text-xs font-black text-gray-200 hover:text-white flex items-center gap-2 transition"
                title="Launch an Ad Campaign"
              >
                <Megaphone className="w-4 h-4 text-pink-400" />
                <span>Launch Ad</span>
              </button>
            </>
          ) : (
            <button
              onClick={openCampaignModal}
              className="btn-glow-purple px-6 py-3.5 rounded-2xl text-xs font-black text-white flex items-center gap-2 shadow-2xl hover:scale-105 transition"
              title="Viewers can launch interactive Ad campaigns across live streams and video feeds!"
            >
              <Megaphone className="w-4 h-4 text-pink-300" />
              <span>🚀 Launch Ad Campaign</span>
            </button>
          )}
        </div>
      </div>

      {/* Sponsored VOD Directory Banner */}
      <AdPlacement placement="VOD_DIRECTORY" />

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search recordings or broadcasters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-brandPurple transition"
          />
        </div>

        {/* Filter Pills & Toolbar CRUD Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 p-1 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs font-semibold">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterType === 'all'
                  ? 'bg-brandPurple text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All Recordings
            </button>
            <button
              onClick={() => setFilterType('free')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterType === 'free'
                  ? 'bg-brandPurple text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Free Replays
            </button>
            <button
              onClick={() => setFilterType('ppv')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition ${
                filterType === 'ppv'
                  ? 'bg-amber-500 text-black font-extrabold shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Pay-Per-View</span>
            </button>
          </div>

          <button
            onClick={() => {
              setVodToEdit(null);
              setCrudModalOpen(true);
            }}
            className="btn-glow-purple px-4 py-2 rounded-xl text-xs font-black text-white flex items-center gap-1.5 shadow-md hover:scale-105 transition"
            title="Launch VOD CRUD Modal"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>VOD CRUD</span>
          </button>
        </div>
      </div>

      {/* VOD Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-gray-400">
          <div className="w-10 h-10 border-4 border-brandPurple border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading video archive...
        </div>
      ) : filteredVods.length === 0 ? (
        <div className="p-12 rounded-3xl glass-panel border border-surfaceBorder text-center space-y-3">
          <Film className="w-10 h-10 text-gray-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Video Replays Found</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Broadcasters have not published any recordings matching your query yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVods.map((vod) => {
            const isPpv = vod.priceTokens > 0;
            const canManage = Boolean(
              user && (
                user.role === 'ADMIN' ||
                user.id === vod.streamer?.userId ||
                user.id === vod.streamer?.user?.id ||
                user.username === vod.streamer?.user?.username
              )
            );

            return (
              <Link
                key={vod.id}
                href={`/vod/${vod.id}`}
                className="group rounded-2xl glass-panel border border-surfaceBorder hover:border-brandPurple/50 overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-purple-900/20 flex flex-col relative"
              >
                {/* Thumbnail Surface */}
                <div className="relative aspect-video bg-black overflow-hidden">
                  <img
                    src={
                      vod.thumbnailUrl ||
                      'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&q=80'
                    }
                    alt={vod.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-brandPurple/90 text-white flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Owner/Admin CRUD Controls Overlay */}
                  {canManage && (
                    <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setVodToEdit(vod);
                          setCrudModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-black/80 hover:bg-brandPurple text-white transition shadow backdrop-blur-md"
                        title="Edit VOD (CRUD)"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!confirm(`Are you sure you want to delete "${vod.title}"?`)) return;
                          try {
                            const res = await fetch(`/api/vod/${vod.id}`, { method: 'DELETE' });
                            if (res.ok) {
                              handleDeleted(vod.id);
                            } else {
                              const d = await res.json();
                              alert(d.error || 'Failed to delete');
                            }
                          } catch (err: any) {
                            alert(err.message);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-black/80 hover:bg-red-600 text-white transition shadow backdrop-blur-md"
                        title="Delete VOD (CRUD)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Pricing Badge */}
                  <div className="absolute top-2.5 right-2.5">
                    {isPpv ? (
                      <span className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-amber-400/40 text-tokenGold text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg">
                        <Coins className="w-3 h-3 text-tokenGold" />
                        <span>{vod.priceTokens} Tokens</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider shadow-lg">
                        Free Replay
                      </span>
                    )}
                  </div>

                  {/* Duration Tag */}
                  {vod.durationSeconds > 0 && (
                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-gray-200 text-[10px] font-mono font-bold flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{formatDuration(vod.durationSeconds)}</span>
                    </div>
                  )}
                </div>

                {/* Info Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-purple-300 transition">
                      {vod.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                      {vod.description || 'Live stream highlight and complete replay recording.'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-surfaceBorder/60 flex items-center justify-between text-xs text-gray-400">
                    <span className="font-bold text-gray-300 truncate max-w-[120px]">
                      {vod.streamer?.displayName}
                    </span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <Eye className="w-3 h-3" />
                      <span>{vod.viewCount}</span>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        {user && (user.role === 'STREAMER' || user.role === 'AGENCY' || user.role === 'ADMIN') ? (
          <button
            onClick={() => {
              setVodToEdit(null);
              setCrudModalOpen(true);
            }}
            className="btn-glow-purple px-5 py-3 rounded-2xl text-xs font-black text-white flex items-center gap-2 shadow-2xl hover:scale-110 transition border border-purple-400/40 backdrop-blur-md"
            title="Open VOD CRUD Creator"
          >
            <Film className="w-4 h-4 text-purple-200 stroke-[2.5]" />
            <span>VOD CRUD</span>
          </button>
        ) : (
          <button
            onClick={openCampaignModal}
            className="btn-glow-purple px-5 py-3 rounded-2xl text-xs font-black text-white flex items-center gap-2 shadow-2xl hover:scale-110 transition border border-purple-400/40 backdrop-blur-md"
            title="Launch an interactive Ad Campaign"
          >
            <Megaphone className="w-4 h-4 text-pink-300" />
            <span>Launch Ad</span>
          </button>
        )}
      </div>

      {/* CRUD Modal for Create / Edit / Delete */}
      <VodCrudModal
        isOpen={crudModalOpen}
        onClose={() => setCrudModalOpen(false)}
        vodToEdit={vodToEdit}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
    </div>
  );
}

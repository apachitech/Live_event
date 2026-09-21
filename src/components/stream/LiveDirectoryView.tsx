'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Radio, Users, Coins, Search, Sparkles, Play, RefreshCw, ExternalLink, Megaphone, Film, CheckCircle2, FileText, X } from 'lucide-react';
import LiveStreamCard, { LiveStreamItem } from './LiveStreamCard';
import { useSiteConfig } from '@/context/SiteConfigContext';
import { useAuth } from '@/context/AuthContext';
import AdPlacement from '@/components/ads/AdPlacement';

const ADULT_CATEGORIES = ['All', 'Gaming & Music', 'Creative Arts', 'Just Chatting', 'Interactive Shows'];
const KIDS_CATEGORIES = ['All', 'Cartoons & Animation', 'Family Gaming', 'Learning & Crafts', 'Music & Fun'];
const GENERAL_CATEGORIES = ['All', 'Gaming & Esports', 'Creative & Art', 'Music & Performance', 'Podcasts & Tech'];

interface LiveDirectoryViewProps {
  initialCategory?: string;
  purchasedTokens?: number;
  txId?: string;
}

interface AdItem {
  id: string;
  title: string;
  imageUrl: string;
  targetUrl: string;
  placement: string;
}

export default function LiveDirectoryView({ initialCategory = 'All', purchasedTokens, txId }: LiveDirectoryViewProps) {
  const { openCampaignModal } = useAuth();
  const { contentRating } = useSiteConfig();
  const categories =
    contentRating === 'KIDS'
      ? KIDS_CATEGORIES
      : contentRating === 'GENERAL'
      ? GENERAL_CATEGORIES
      : ADULT_CATEGORIES;

  const [streams, setStreams] = useState<LiveStreamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('trending');
  const [featuredAd, setFeaturedAd] = useState<AdItem | null>(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(Boolean(purchasedTokens));

  // Fetch active directory advertisements
  useEffect(() => {
    fetch('/api/ads/public?placement=DIRECTORY')
      .then((res) => res.json())
      .then((data) => {
        if (data.ads && data.ads.length > 0) {
          const ad = data.ads[0];
          setFeaturedAd(ad);
          // Log impression
          fetch('/api/ads/public', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: ad.id, event: 'impression' }),
          }).catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  const handleAdClick = (ad: AdItem) => {
    fetch('/api/ads/public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: ad.id, event: 'click' }),
    }).catch(() => {});
  };

  const fetchStreams = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const queryParams = new URLSearchParams();
      if (selectedCategory !== 'All') queryParams.set('category', selectedCategory);
      if (searchQuery.trim()) queryParams.set('search', searchQuery.trim());
      queryParams.set('sort', sortBy);

      const res = await fetch(`/api/stream/list?${queryParams.toString()}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.streams)) {
        setStreams(data.streams);
      }
    } catch (err) {
      console.error('Error loading streams:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, searchQuery, sortBy]);

  // Initial load and whenever filters change
  useEffect(() => {
    fetchStreams(false);
  }, [fetchStreams]);

  // Real-time live stream directory auto-polling every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStreams(true);
    }, 8000);

    return () => clearInterval(interval);
  }, [fetchStreams]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Transaction Success & Official Payment Slip Banner */}
      {showPaymentSuccess && purchasedTokens && (
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-surfaceCard to-emerald-950/50 border border-emerald-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Payment Confirmed</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold">
                  +{purchasedTokens.toLocaleString()} Tokens
                </span>
              </h3>
              <p className="text-xs text-gray-300 mt-0.5">
                Your tokens have been credited to your wallet. An official electronic payment slip and message have been dispatched to your registered address.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {txId && (
              <Link
                href={`/receipt/${txId}`}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Payment Slip</span>
              </Link>
            )}
            <button
              onClick={() => setShowPaymentSuccess(false)}
              className="p-2 text-gray-400 hover:text-white hover:bg-surfaceLight rounded-xl transition"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-panel p-8 sm:p-12 mb-10 border border-surfaceBorder shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 bg-brandPurple/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-brandPink/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surfaceLight border border-surfaceBorder text-xs text-brandPurple font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-tokenGold" />
            <span>Interactive Live Streaming Directory</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
            Watch, Connect & Interact In <span className="gradient-text-purple">Real Time</span>.
          </h1>

          <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-6">
            Explore active broadcast rooms, tip streamers to trigger interactive perks on-screen, participate in community goals, or request exclusive 1:1 private shows.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-300">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surfaceLight border border-surfaceBorder">
              <Radio className="w-4 h-4 text-red-500 animate-pulse" />
              <span>Ultra-Low Latency Video</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surfaceLight border border-surfaceBorder">
              <Coins className="w-4 h-4 text-tokenGold" />
              <span>Interactive Tipping</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surfaceLight border border-surfaceBorder">
              <Users className="w-4 h-4 text-brandPurple" />
              <span>Private Shows</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={openCampaignModal}
              className="btn-glow-purple px-5 py-2.5 rounded-xl text-xs font-black text-white flex items-center gap-2 shadow-lg hover:scale-105 transition"
              title="Launch a sponsored banner or video campaign"
            >
              <Megaphone className="w-4 h-4 text-pink-400" />
              <span>🚀 Launch Ad Campaign</span>
            </button>
            <Link
              href="/explore"
              className="px-4 py-2.5 rounded-xl bg-surfaceLight hover:bg-surfaceLight/80 text-xs font-bold text-gray-200 flex items-center gap-1.5 border border-surfaceBorder transition"
            >
              <Play className="w-3.5 h-3.5 text-brandPurple" />
              <span>Explore Swipe Feed</span>
            </Link>
            <Link
              href="/vods"
              className="px-4 py-2.5 rounded-xl bg-surfaceLight hover:bg-surfaceLight/80 text-xs font-bold text-gray-200 flex items-center gap-1.5 border border-surfaceBorder transition"
            >
              <Film className="w-3.5 h-3.5 text-purple-400" />
              <span>Browse VODs</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Sponsored Advertisement Banner */}
      <AdPlacement placement="DIRECTORY" className="mb-8" />

      {/* Directory Search & Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        {/* Category Pill Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  isSelected
                    ? 'btn-glow-purple text-white shadow-md'
                    : 'bg-surfaceLight border border-surfaceBorder text-gray-400 hover:text-white hover:border-gray-600'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search, Sort, and Quick Refresh Controls */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search streamer or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-brandPurple transition"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-gray-300 text-xs font-medium focus:outline-none focus:border-brandPurple cursor-pointer"
          >
            <option value="trending">🔥 Trending</option>
            <option value="viewers">👥 Most Viewers</option>
            <option value="tokens">🪙 Most Tipped</option>
            <option value="recent">⏱️ Recently Started</option>
          </select>

          <button
            onClick={() => fetchStreams(false)}
            title="Refresh Live Directory"
            className="p-2 rounded-xl bg-surfaceLight border border-surfaceBorder hover:border-gray-600 text-gray-400 hover:text-white transition"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-brandPurple' : ''}`} />
          </button>

          {/* Direct VOD CRUD Button */}
          <Link
            href="/vods"
            className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-black flex items-center gap-1.5 transition shadow"
            title="Manage and browse VOD recordings (CRUD)"
          >
            <Film className="w-4 h-4 text-brandPurple" />
            <span className="whitespace-nowrap">VOD CRUD</span>
          </Link>
        </div>
      </div>

      {/* Streams Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl bg-surface border border-surfaceBorder p-4 h-80 animate-pulse flex flex-col justify-between">
              <div className="aspect-video w-full rounded-xl bg-surfaceLight" />
              <div className="space-y-2 mt-4">
                <div className="h-4 bg-surfaceLight rounded w-3/4" />
                <div className="h-3 bg-surfaceLight rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : streams.length === 0 ? (
        <div className="rounded-3xl glass-panel p-12 text-center border border-surfaceBorder">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4 text-red-400">
            <Radio className="w-7 h-7 animate-pulse" />
          </div>
          <h3 className="text-xl font-black text-white mb-2">No Active Streams in this View</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto mb-6 leading-relaxed">
            There are currently no broadcasters streaming in this category. You can be the first to start streaming directly from the Go Live Studio!
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
              className="px-4 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs font-bold text-gray-300 hover:text-white transition"
            >
              Reset Filters
            </button>
            <Link
              href="/dashboard/streamer"
              className="btn-glow-purple inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow"
            >
              <Play className="w-3.5 h-3.5" /> Start Broadcasting
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {streams.map((stream) => (
            <LiveStreamCard key={stream.id} stream={stream} />
          ))}
        </div>
      )}
    </div>
  );
}

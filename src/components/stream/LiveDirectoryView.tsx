'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Radio, Users, Coins, Search, Sparkles, Play, RefreshCw, ExternalLink, Megaphone, Film } from 'lucide-react';
import LiveStreamCard, { LiveStreamItem } from './LiveStreamCard';
import { useSiteConfig } from '@/context/SiteConfigContext';

const ADULT_CATEGORIES = ['All', 'Gaming & Music', 'Creative Arts', 'Just Chatting', 'Interactive Shows'];
const KIDS_CATEGORIES = ['All', 'Cartoons & Animation', 'Family Gaming', 'Learning & Crafts', 'Music & Fun'];
const GENERAL_CATEGORIES = ['All', 'Gaming & Esports', 'Creative & Art', 'Music & Performance', 'Podcasts & Tech'];

interface LiveDirectoryViewProps {
  initialCategory?: string;
}

interface AdItem {
  id: string;
  title: string;
  imageUrl: string;
  targetUrl: string;
  placement: string;
}

export default function LiveDirectoryView({ initialCategory = 'All' }: LiveDirectoryViewProps) {
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
        </div>
      </div>

      {/* Featured Sponsored Advertisement Banner */}
      {featuredAd && (
        <div className="mb-8 rounded-2xl overflow-hidden glass-panel border border-brandPurple/30 p-4 sm:p-5 relative bg-gradient-to-r from-brandPurple/10 via-surfaceLight/60 to-brandPink/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <img
                src={featuredAd.imageUrl}
                alt={featuredAd.title}
                className="w-20 h-14 sm:w-28 sm:h-16 rounded-xl object-cover border border-surfaceBorder shrink-0 bg-black"
                onError={(e: any) => {
                  e.target.src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300';
                }}
              />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-tokenGold/20 text-tokenGold text-[10px] font-black uppercase tracking-wider border border-tokenGold/30">
                    <Megaphone className="w-3 h-3" />
                    <span>Sponsored</span>
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-white line-clamp-1">{featuredAd.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">
                  Verified partner promotion & exclusive community perk.
                </p>
              </div>
            </div>

            <a
              href={featuredAd.targetUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => handleAdClick(featuredAd)}
              className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brandPurple to-brandPink text-white text-xs font-black shadow-lg hover:scale-105 transition"
            >
              <span>Learn More</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

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

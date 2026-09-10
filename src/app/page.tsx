'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Radio, Users, Coins, Search, Sparkles, Filter, Play, Flame } from 'lucide-react';

interface StreamItem {
  id: string;
  title: string;
  category: string;
  status: string;
  viewerCount: number;
  totalTokensEarned: number;
  streamer: {
    displayName: string;
    user: {
      username: string;
      avatarUrl?: string;
    };
  };
  tipGoals: Array<{
    id: string;
    label: string;
    targetAmount: number;
    currentAmount: number;
  }>;
}

const CATEGORIES = ['All', 'Gaming & Music', 'Creative Arts', 'Just Chatting', 'Interactive Shows'];

export default function HomePage() {
  const [streams, setStreams] = useState<StreamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('trending');

  useEffect(() => {
    const fetchStreams = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (selectedCategory !== 'All') queryParams.set('category', selectedCategory);
        if (searchQuery) queryParams.set('search', searchQuery);
        queryParams.set('sort', sortBy);

        const res = await fetch(`/api/stream/list?${queryParams.toString()}`);
        const data = await res.json();
        if (data.success) {
          setStreams(data.streams);
        }
      } catch (err) {
        console.error('Error loading streams:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStreams();
  }, [selectedCategory, searchQuery, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-panel p-8 sm:p-12 mb-10 border border-surfaceBorder shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 bg-brandPurple/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-brandPink/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surfaceLight border border-surfaceBorder text-xs text-brandPurple font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-tokenGold" />
            <span>Next-Gen Interactive Live Broadcasting</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
            Watch, Connect & Interact In <span className="gradient-text-purple">Real Time</span>.
          </h1>

          <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-6">
            Join public live rooms, tip streamers to trigger interactive perks on-screen, participate in community goals, or request exclusive 1:1 private shows.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-300">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surfaceLight border border-surfaceBorder">
              <Radio className="w-4 h-4 text-red-500 animate-pulse" />
              <span>Ultra-Low Latency Video</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surfaceLight border border-surfaceBorder">
              <Coins className="w-4 h-4 text-tokenGold" />
              <span>Instant Token Economy</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surfaceLight border border-surfaceBorder">
              <Users className="w-4 h-4 text-brandPurple" />
              <span>Private 1:1 Shows</span>
            </div>
          </div>
        </div>
      </div>

      {/* Directory Search & Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        {/* Category Pill Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => {
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

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-3">
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
        </div>
      </div>

      {/* Streams Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl bg-surface border border-surfaceBorder p-4 h-72 animate-pulse" />
          ))}
        </div>
      ) : streams.length === 0 ? (
        <div className="rounded-3xl glass-panel p-12 text-center border border-surfaceBorder">
          <Radio className="w-10 h-10 text-gray-600 mx-auto mb-3 animate-pulse" />
          <h3 className="text-lg font-bold text-white mb-1">No Active Streams Found</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto mb-5">
            There are currently no live streams in this category. You can start broadcasting from the Streamer Studio!
          </p>
          <Link
            href="/dashboard/streamer"
            className="btn-glow-purple inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow"
          >
            <Play className="w-3.5 h-3.5" /> Start Broadcasting
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {streams.map((s) => {
            const goal = s.tipGoals?.[0];
            const goalPercent = goal
              ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
              : null;

            return (
              <Link
                key={s.id}
                href={`/watch/${s.id}`}
                className="group rounded-2xl bg-surface border border-surfaceBorder hover:border-brandPurple/60 overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Simulated Thumbnail */}
                <div className="relative aspect-video bg-gradient-to-tr from-[#12131f] via-[#1a1930] to-[#251f38] flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />

                  {/* Center avatar & pulse */}
                  <div className="relative w-16 h-16 rounded-2xl bg-surfaceLight border-2 border-brandPurple flex items-center justify-center text-white font-black text-lg shadow-2xl group-hover:scale-110 transition duration-300">
                    {s.streamer.displayName.substring(0, 2).toUpperCase()}
                    <span className="absolute -inset-1 rounded-2xl bg-brandPurple/30 blur-md -z-10 group-hover:bg-brandPurple/50 transition" />
                  </div>

                  {/* Top tags */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                    <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                      <Radio className="w-2.5 h-2.5 animate-ping" /> {s.status}
                    </span>

                    <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold border border-white/10 flex items-center gap-1">
                      <Users className="w-3 h-3 text-brandPurple" /> {s.viewerCount}
                    </span>
                  </div>

                  {/* Bottom category tag */}
                  <div className="absolute bottom-3 left-3 z-10">
                    <span className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-gray-300 text-[10px] font-medium border border-white/10">
                      {s.category}
                    </span>
                  </div>
                </div>

                {/* Stream Info */}
                <div className="p-4">
                  <h3 className="font-bold text-white text-sm truncate group-hover:text-purple-300 transition">
                    {s.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium">{s.streamer.displayName}</p>

                  {/* Tip Goal Bar Preview if active */}
                  {goal && (
                    <div className="mt-3 pt-3 border-t border-surfaceBorder/80">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-gray-400 truncate max-w-[150px]">{goal.label}</span>
                        <span className="text-tokenGold font-bold">{goal.currentAmount}/{goal.targetAmount}🪙</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-surfaceLight overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-pink-500 rounded-full"
                          style={{ width: `${goalPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Total tokens badge */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400">
                    <span className="flex items-center gap-1 text-tokenGold font-semibold">
                      <Coins className="w-3.5 h-3.5" />
                      <span>{s.totalTokensEarned} Tokens Tipped</span>
                    </span>
                    <span className="text-brandPurple font-bold group-hover:underline">Watch Room →</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

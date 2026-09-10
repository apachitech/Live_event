'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Coins, Crown, Medal } from 'lucide-react';
import BadgePill from '../badges/BadgePill';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  totalTokens: number;
  badge: string;
}

interface StreamLeaderboardProps {
  streamId: string;
  refreshTrigger?: number;
}

export default function StreamLeaderboard({ streamId, refreshTrigger }: StreamLeaderboardProps) {
  const [scope, setScope] = useState<'stream' | 'allTime'>('stream');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`/api/stream/${streamId}/leaderboard?scope=${scope}`);
      const data = await res.json();
      if (data.leaderboard) {
        setEntries(data.leaderboard);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [streamId, scope, refreshTrigger]);

  const getRankMedal = (rank: number) => {
    switch (rank) {
      case 1:
        return <span className="text-base" title="1st Place Gold">🥇</span>;
      case 2:
        return <span className="text-base" title="2nd Place Silver">🥈</span>;
      case 3:
        return <span className="text-base" title="3rd Place Bronze">🥉</span>;
      default:
        return <span className="text-xs font-bold text-gray-500 font-mono">#{rank}</span>;
    }
  };

  return (
    <div className="w-full rounded-2xl glass-panel border border-surfaceBorder p-4 shadow-xl space-y-3">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between pb-2.5 border-b border-surfaceBorder/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-tokenGold">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Top Supporters</h4>
            <p className="text-[10px] text-gray-400">Leaderboard of top token tippers</p>
          </div>
        </div>

        {/* Scope Pill Tabs */}
        <div className="flex items-center p-0.5 rounded-lg bg-surfaceLight border border-surfaceBorder text-[10px] font-bold">
          <button
            onClick={() => setScope('stream')}
            className={`px-2.5 py-1 rounded-md transition ${
              scope === 'stream'
                ? 'bg-amber-500 text-black font-extrabold shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Live Room
          </button>
          <button
            onClick={() => setScope('allTime')}
            className={`px-2.5 py-1 rounded-md transition ${
              scope === 'allTime'
                ? 'bg-amber-500 text-black font-extrabold shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All-Time
          </button>
        </div>
      </div>

      {/* Leaderboard Table / Rows */}
      {loading ? (
        <div className="py-6 text-center text-xs text-gray-400 animate-pulse">
          Loading leaderboard rankings...
        </div>
      ) : entries.length === 0 ? (
        <div className="py-6 text-center text-xs text-gray-400">
          <Crown className="w-6 h-6 text-gray-600 mx-auto mb-1" />
          <p>No tippers yet. Be the first to claim the #1 spot!</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {entries.map((entry) => (
            <div
              key={entry.userId}
              className={`flex items-center justify-between p-2 rounded-xl border transition ${
                entry.rank === 1
                  ? 'border-amber-500/30 bg-amber-500/5'
                  : 'border-surfaceBorder/60 bg-surface/50'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 flex items-center justify-center flex-shrink-0">
                  {getRankMedal(entry.rank)}
                </div>

                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm flex-shrink-0">
                  {entry.username.substring(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                    <span>{entry.username}</span>
                    <BadgePill type={entry.badge} size="sm" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-extrabold text-tokenGold flex-shrink-0">
                <Coins className="w-3.5 h-3.5 text-tokenGold" />
                <span>{entry.totalTokens}</span>
                <span className="text-[10px] text-gray-400 font-normal">🪙</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

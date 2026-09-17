'use client';

import React from 'react';
import Link from 'next/link';
import { Users, Coins, Lock, Sparkles, ArrowRight, Play, Radio } from 'lucide-react';

export interface LiveStreamItem {
  id: string;
  title: string;
  category: string;
  status: string;
  viewerCount: number;
  totalTokensEarned: number;
  isPrivate?: boolean;
  externalStreamUrl?: string | null;
  recordingUrl?: string | null;
  streamer: {
    displayName: string;
    bio?: string | null;
    user: {
      username: string;
      avatarUrl?: string | null;
    };
  };
  tipGoals?: Array<{
    id: string;
    label: string;
    targetAmount: number;
    currentAmount: number;
  }>;
}

interface LiveStreamCardProps {
  stream: LiveStreamItem;
}

export default function LiveStreamCard({ stream }: LiveStreamCardProps) {
  const isPrivate = stream.isPrivate || stream.status?.toUpperCase() === 'PRIVATE';
  const goal = stream.tipGoals?.[0];
  const goalPercent = goal
    ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
    : null;

  const streamerName = stream.streamer?.displayName || 'Streamer';
  const username = stream.streamer?.user?.username || 'broadcaster';
  const streamerInitials = streamerName.substring(0, 2).toUpperCase();

  // Broadcaster Picture with reliable high-res fallback
  const rawAvatar = stream.streamer?.user?.avatarUrl;
  const streamerAvatar = rawAvatar
    ? rawAvatar.replace('?w=150', '?w=600&auto=format&fit=crop&q=80')
    : `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80`;

  return (
    <div className="group flex flex-col rounded-2xl bg-surface border border-surfaceBorder hover:border-brandPurple/60 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-purple-950/30 transition-all duration-300 overflow-hidden shadow-xl">
      {/* Broadcaster Picture Thumbnail Stage (No Preview, Pure Broadcaster Image) */}
      <Link
        href={`/watch/${stream.id}`}
        className="relative aspect-video w-full bg-[#12131e] overflow-hidden block cursor-pointer"
      >
        {/* Full-bleed Broadcaster Picture */}
        <img
          src={streamerAvatar}
          alt={streamerName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Ambient Dark Gradients for Crisp Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/40 pointer-events-none" />

        {/* Top Badges: Live Status & Viewers Count */}
        <div className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 right-2.5 sm:right-3 flex items-center justify-between z-10 pointer-events-none">
          <div className="flex items-center gap-1.5">
            {isPrivate ? (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                <Lock className="w-2.5 h-2.5" /> PRIVATE
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-red-600/40">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>LIVE</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white text-[11px] font-semibold border border-white/10 shadow">
            <Users className="w-3 h-3 text-brandPurple" />
            <span>{stream.viewerCount}</span>
          </div>
        </div>

        {/* Bottom Overlay on Picture: Broadcaster Info & Category */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-none">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-brandPurple shadow-md flex-shrink-0 bg-surfaceLight">
              <img
                src={streamerAvatar}
                alt={streamerName}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-black" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white drop-shadow truncate max-w-[130px] sm:max-w-[160px]">
                {streamerName}
              </div>
              <div className="text-[10px] text-gray-300 drop-shadow truncate">
                @{username}
              </div>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-gray-200 text-[10px] font-medium border border-white/10">
            {stream.category}
          </span>
        </div>

        {/* Subtle Glassmorphic Hover Indicator ("Watch Live") */}
        <div className="absolute inset-0 bg-brandPurple/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center z-20 pointer-events-none">
          <span className="px-4 py-2 rounded-full bg-brandPurple text-white text-xs font-extrabold shadow-xl flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200">
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Watch Live</span>
          </span>
        </div>
      </Link>

      {/* Stream & Broadcaster Card Details */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <Link
            href={`/watch/${stream.id}`}
            className="font-bold text-white text-sm line-clamp-1 group-hover:text-purple-300 transition"
          >
            {stream.title}
          </Link>

          <div className="flex items-center justify-between text-xs text-gray-400 mt-1.5">
            <span className="truncate">{streamerName}</span>
            <span className="text-[11px] text-brandPurple font-semibold flex items-center gap-1">
              <Radio className="w-3 h-3 text-red-500 animate-pulse" />
              <span>Broadcasting</span>
            </span>
          </div>
        </div>

        {/* Tip Goal Bar Progress if active */}
        {goal && (
          <div className="mt-3 pt-3 border-t border-surfaceBorder/80">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-gray-400 truncate max-w-[170px] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-tokenGold" />
                {goal.label}
              </span>
              <span className="text-tokenGold font-bold">
                {goal.currentAmount}/{goal.targetAmount}🪙
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-surfaceLight overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-pink-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${goalPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Card Footer: Tokens Tipped & Watch Link */}
        <div className="mt-3.5 pt-2.5 border-t border-surfaceBorder/60 flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1 text-tokenGold font-semibold text-[11px]">
            <Coins className="w-3.5 h-3.5" />
            <span>{stream.totalTokensEarned} Tipped</span>
          </span>

          <Link
            href={`/watch/${stream.id}`}
            className="text-brandPurple group-hover:text-pink-400 font-bold flex items-center gap-1 text-[11px] transition"
          >
            <span>Watch Live</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}

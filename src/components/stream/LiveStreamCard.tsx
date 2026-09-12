'use client';

import React from 'react';
import Link from 'next/link';
import { Radio, Users, Coins, Lock, Sparkles, ArrowRight, Play } from 'lucide-react';

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
  const isPrivate = stream.isPrivate || stream.status.toUpperCase() === 'PRIVATE';
  const goal = stream.tipGoals?.[0];
  const goalPercent = goal
    ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
    : null;

  const streamerAvatar = stream.streamer.user.avatarUrl;
  const streamerInitials = stream.streamer.displayName.substring(0, 2).toUpperCase();

  return (
    <Link
      href={`/watch/${stream.id}`}
      className="group flex flex-col rounded-2xl bg-surface border border-surfaceBorder hover:border-brandPurple/60 overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-purple-950/30"
    >
      {/* Visual Thumbnail / Stream Stage Preview */}
      <div className="relative aspect-video w-full bg-gradient-to-tr from-[#0f101a] via-[#1a1728] to-[#251b38] flex items-center justify-center overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />

        {streamerAvatar ? (
          <>
            <img
              src={streamerAvatar}
              alt={stream.streamer.displayName}
              className="absolute inset-0 w-full h-full object-cover blur-md opacity-25 scale-110 group-hover:scale-125 transition-transform duration-500"
            />
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-brandPurple shadow-2xl group-hover:scale-110 transition-transform duration-300 z-10">
              <img
                src={streamerAvatar}
                alt={stream.streamer.displayName}
                className="w-full h-full object-cover"
              />
            </div>
          </>
        ) : (
          <div className="relative w-16 h-16 rounded-2xl bg-surfaceLight border-2 border-brandPurple flex items-center justify-center text-white font-black text-lg shadow-2xl group-hover:scale-110 transition duration-300 z-10">
            {streamerInitials}
            <span className="absolute -inset-1 rounded-2xl bg-brandPurple/30 blur-md -z-10 group-hover:bg-brandPurple/50 transition" />
          </div>
        )}

        {/* Floating Quick Action Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 pointer-events-none">
          <div className="px-3.5 py-1.5 rounded-full bg-brandPurple/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Join Live Room</span>
          </div>
        </div>

        {/* Top Badges (Status & Viewers) */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none">
          {isPrivate ? (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
              <Lock className="w-2.5 h-2.5" /> 1:1 PRIVATE
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>LIVE</span>
            </span>
          )}

          <span className="px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white text-[11px] font-semibold border border-white/10 flex items-center gap-1 shadow">
            <Users className="w-3 h-3 text-brandPurple" />
            <span>{stream.viewerCount}</span>
          </span>
        </div>

        {/* Bottom Category Tag */}
        <div className="absolute bottom-3 left-3 z-20 pointer-events-none">
          <span className="px-2.5 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-gray-200 text-[10px] font-medium border border-white/10">
            {stream.category}
          </span>
        </div>
      </div>

      {/* Stream & Streamer Card Details */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-purple-300 transition">
              {stream.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 mt-1.5">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-[10px] font-extrabold text-white flex-shrink-0">
              {streamerInitials}
            </div>
            <p className="text-xs font-medium text-gray-300 truncate">
              {stream.streamer.displayName}
            </p>
            <span className="text-[10px] text-gray-500 truncate">@{stream.streamer.user.username}</span>
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

          <span className="text-brandPurple group-hover:text-pink-400 font-bold flex items-center gap-1 text-[11px] transition">
            <span>Watch Live</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
}

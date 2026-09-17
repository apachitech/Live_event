'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Radio, Users, Coins, Lock, Sparkles, ArrowRight, Play, Pause, Volume2, VolumeX, Eye, Maximize, X } from 'lucide-react';

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

  // Hover preview & Inline player state
  const [isHovered, setIsHovered] = useState(false);
  const [isInlinePlaying, setIsInlinePlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showPreviewBadge, setShowPreviewBadge] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewTimerRef = useRef<NodeJS.Timeout | null>(null);

  const videoSrc =
    stream.externalStreamUrl ||
    stream.recordingUrl ||
    'https://res.cloudinary.com/demo/video/upload/sample.mp4';

  // Hover detection with 180ms debounce so rapid cursor sweeps don't needlessly spin up videos
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (!isInlinePlaying) {
      previewTimerRef.current = setTimeout(() => {
        setShowPreviewBadge(true);
        if (videoRef.current) {
          videoRef.current.play().catch(() => {});
        }
      }, 180);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
    }
    if (!isInlinePlaying) {
      setShowPreviewBadge(false);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  };

  // When inline playing activates
  useEffect(() => {
    if (isInlinePlaying && videoRef.current) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isInlinePlaying]);

  const togglePlayPause = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const startInlinePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsInlinePlaying(true);
    setIsMuted(false); // Enable sound when actively watching on card
  };

  const closeInlinePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsInlinePlaying(false);
    setIsMuted(true);
    setShowPreviewBadge(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else {
        videoRef.current.requestFullscreen().catch(() => {});
      }
    }
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group flex flex-col rounded-2xl bg-surface border transition-all duration-300 shadow-xl ${
        isInlinePlaying
          ? 'border-brandPurple shadow-2xl shadow-purple-950/50 ring-1 ring-brandPurple/40'
          : 'border-surfaceBorder hover:border-brandPurple/60 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-purple-950/30'
      } overflow-hidden`}
    >
      {/* Video Preview Surface / Stream Stage Thumbnail */}
      <div className="relative aspect-video w-full bg-gradient-to-tr from-[#0f101a] via-[#1a1728] to-[#251b38] flex items-center justify-center overflow-hidden">
        {/* Background Avatar/Gradient Stage (Visible when video is not active) */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
            showPreviewBadge || isInlinePlaying ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
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
        </div>

        {/* Live Hover Video Surface & Inline Player Element */}
        <video
          ref={videoRef}
          src={videoSrc}
          loop
          playsInline
          muted={isMuted}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            showPreviewBadge || isInlinePlaying ? 'opacity-100 z-10' : 'opacity-0 -z-10 pointer-events-none'
          }`}
        />

        {/* Top Badges (Live, Viewers, Preview Status) */}
        <div className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 right-2.5 sm:right-3 flex items-center justify-between z-20 pointer-events-none">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-nowrap touch-pan-x">
            {isPrivate ? (
              <span className="shrink-0 px-2 sm:px-2.5 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                <Lock className="w-2.5 h-2.5" /> PRIVATE
              </span>
            ) : isInlinePlaying ? (
              <span className="shrink-0 px-2 sm:px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>PLAYING ON CARD</span>
              </span>
            ) : showPreviewBadge ? (
              <span className="shrink-0 px-2 sm:px-2.5 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>LIVE PREVIEW</span>
              </span>
            ) : (
              <span className="shrink-0 px-2 sm:px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>LIVE</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="shrink-0 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white text-[11px] font-semibold border border-white/10 flex items-center gap-1 shadow">
              <Users className="w-3 h-3 text-brandPurple" />
              <span>{stream.viewerCount}</span>
            </span>

            {/* Close Inline Player Button */}
            {isInlinePlaying && (
              <button
                type="button"
                onClick={closeInlinePlay}
                className="pointer-events-auto p-1 rounded-full bg-black/80 hover:bg-red-600 text-white border border-white/20 transition shadow"
                title="Close Card Player"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Hover Quick Action Buttons Bar (Mute Preview & Watch On Card Toggle) */}
        {!isInlinePlaying && (
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {/* Category Tag */}
            <span className="px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-gray-200 text-[10px] font-medium border border-white/10">
              {stream.category}
            </span>

            {/* Quick Actions Ribbon */}
            <div className="flex items-center gap-1.5">
              {/* Audio Preview Toggle */}
              <button
                type="button"
                onClick={toggleMute}
                className="p-1.5 rounded-xl bg-black/80 hover:bg-black text-white border border-white/20 transition flex items-center gap-1 text-[10px] font-bold shadow"
                title={isMuted ? 'Unmute Live Audio Preview' : 'Mute Live Audio Preview'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>

              {/* Watch Directly on Card Button */}
              <button
                type="button"
                onClick={startInlinePlay}
                className="px-2.5 py-1 rounded-xl bg-brandPurple hover:bg-purple-600 text-white border border-purple-400/30 text-[11px] font-bold flex items-center gap-1 shadow-lg transition hover:scale-105"
                title="Watch Live Stream Directly on this Card"
              >
                <Eye className="w-3 h-3" />
                <span>Watch on Card</span>
              </button>
            </div>
          </div>
        )}

        {/* Active Inline Player Controls Bar (When Watching Directly on Card) */}
        {isInlinePlaying && (
          <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex items-center justify-between z-30 animate-fade-in">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlayPause}
                className="p-1.5 rounded-lg bg-surfaceLight hover:bg-surfaceBorder text-white transition border border-white/10"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              </button>

              <button
                type="button"
                onClick={toggleMute}
                className="p-1.5 rounded-lg bg-surfaceLight hover:bg-surfaceBorder text-white transition border border-white/10"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <Link
                href={`/watch/${stream.id}`}
                className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-[10px] font-extrabold flex items-center gap-1 shadow"
              >
                <span>Enter Room</span>
                <ArrowRight className="w-3 h-3" />
              </Link>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-1.5 rounded-lg bg-surfaceLight hover:bg-surfaceBorder text-white transition border border-white/10"
                title="Fullscreen"
              >
                <Maximize className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stream & Streamer Card Details */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/watch/${stream.id}`}
              className="font-bold text-white text-sm line-clamp-1 group-hover:text-purple-300 transition"
            >
              {stream.title}
            </Link>
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

        {/* Card Footer: Tokens Tipped & Watch Link / Card Player Toggle */}
        <div className="mt-3.5 pt-2.5 border-t border-surfaceBorder/60 flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1 text-tokenGold font-semibold text-[11px]">
            <Coins className="w-3.5 h-3.5" />
            <span>{stream.totalTokensEarned} Tipped</span>
          </span>

          <div className="flex items-center gap-2">
            {!isInlinePlaying ? (
              <button
                type="button"
                onClick={startInlinePlay}
                className="text-gray-400 hover:text-white font-semibold text-[11px] flex items-center gap-1 transition"
                title="Watch on this card"
              >
                <Eye className="w-3 h-3 text-cyan-400" />
                <span className="hidden sm:inline">Inline</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={closeInlinePlay}
                className="text-red-400 hover:text-red-300 font-semibold text-[11px] transition"
              >
                Close
              </button>
            )}

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
    </div>
  );
}

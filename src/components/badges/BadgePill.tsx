'use client';

import React from 'react';
import { Crown, Star, Sparkles, Heart, Shield, Video } from 'lucide-react';

interface BadgePillProps {
  type: string;
  size?: 'sm' | 'md';
}

export default function BadgePill({ type, size = 'sm' }: BadgePillProps) {
  const isSm = size === 'sm';
  const textClass = isSm ? 'text-[9px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1';
  const iconClass = isSm ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5';

  switch (type) {
    case 'Whale Patron':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-600/20 border border-amber-400/40 text-amber-300 shadow-sm ${textClass}`}
        >
          <Crown className={`${iconClass} text-yellow-400`} />
          <span>Whale Patron</span>
        </span>
      );

    case 'Top Fan':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-black uppercase tracking-wider bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/40 text-purple-300 shadow-sm ${textClass}`}
        >
          <Sparkles className={`${iconClass} text-pink-400`} />
          <span>Top Fan</span>
        </span>
      );

    case 'Loyal Fan':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400 ${textClass}`}
        >
          <Star className={`${iconClass} text-amber-400 fill-current`} />
          <span>Loyal Fan</span>
        </span>
      );

    case 'Subscriber':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wider bg-pink-500/20 border border-pink-500/30 text-pink-300 ${textClass}`}
        >
          <Heart className={`${iconClass} text-pink-400 fill-current`} />
          <span>Subscriber</span>
        </span>
      );

    case 'STREAMER':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-black uppercase tracking-wider bg-purple-600/20 border border-purple-500/40 text-purple-300 ${textClass}`}
        >
          <Video className={`${iconClass} text-purple-400`} />
          <span>Streamer</span>
        </span>
      );

    case 'ADMIN':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-black uppercase tracking-wider bg-red-600/20 border border-red-500/40 text-red-300 ${textClass}`}
        >
          <Shield className={`${iconClass} text-red-400`} />
          <span>Admin</span>
        </span>
      );

    default:
      return null;
  }
}

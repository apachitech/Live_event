'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, X, Sparkles, Megaphone, Play, Volume2, VolumeX } from 'lucide-react';

export type AdPlacementType =
  | 'HEADER_TOP'
  | 'FEED'
  | 'DIRECTORY'
  | 'WATCH'
  | 'STREAM_CHAT'
  | 'VOD_DIRECTORY'
  | 'PLAYER_OVERLAY'
  | 'PRE_ROLL';

export interface AdData {
  id: string;
  title: string;
  description?: string | null;
  mediaType: 'IMAGE' | 'VIDEO';
  imageUrl: string;
  videoUrl?: string | null;
  targetUrl: string;
  ctaText?: string;
  badge?: string | null;
  placement: AdPlacementType;
  durationSeconds?: number | null;
  skipOffsetSeconds?: number | null;
}

interface AdPlacementProps {
  placement: AdPlacementType;
  className?: string;
  onAdLoaded?: (ad: AdData | null) => void;
}

export default function AdPlacement({ placement, className = '', onAdLoaded }: AdPlacementProps) {
  const [ad, setAd] = useState<AdData | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [muted, setMuted] = useState(true);
  const impressionSentRef = useRef(false);

  useEffect(() => {
    // Check if dismissed in session for dismissible banners
    if (placement === 'HEADER_TOP') {
      const isDismissed = sessionStorage.getItem(`ad_dismissed_${placement}`);
      if (isDismissed === 'true') {
        setDismissed(true);
        return;
      }
    }

    let isMounted = true;
    async function loadAd() {
      try {
        const res = await fetch(`/api/ads/public?placement=${placement}`);
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.success && data.ads && data.ads.length > 0) {
          // Pick a random ad if multiple exist
          const randomIndex = Math.floor(Math.random() * data.ads.length);
          const chosenAd = data.ads[randomIndex];
          setAd(chosenAd);
          if (onAdLoaded) onAdLoaded(chosenAd);

          // Log impression once
          if (!impressionSentRef.current) {
            impressionSentRef.current = true;
            fetch('/api/ads/public', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: chosenAd.id, event: 'impression' }),
            }).catch(() => {});
          }
        } else if (isMounted && onAdLoaded) {
          onAdLoaded(null);
        }
      } catch (err) {
        console.warn('Ad fetch notice:', err);
      }
    }

    loadAd();

    return () => {
      isMounted = false;
    };
  }, [placement]);

  const handleAdClick = (e: React.MouseEvent) => {
    if (!ad) return;
    try {
      fetch('/api/ads/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ad.id, event: 'click' }),
      }).catch(() => {});
    } catch {}
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissed(true);
    sessionStorage.setItem(`ad_dismissed_${placement}`, 'true');
  };

  if (!ad || dismissed) return null;

  const cta = ad.ctaText?.trim() || 'Learn More';
  const badgeText = ad.badge?.trim() || 'SPONSORED';

  // 1. HEADER_TOP Placement: Sleek top-of-page announcement bar
  if (placement === 'HEADER_TOP') {
    return (
      <aside
        aria-label="Sponsored announcement banner"
        className={`w-full bg-gradient-to-r from-brandPurple/90 via-pink-600/90 to-purple-900/90 text-white text-xs py-2 px-3 sm:px-6 relative z-50 flex items-center justify-between shadow-md transition-all ${className}`}
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="shrink-0 px-2 py-0.5 rounded-full bg-black/40 border border-white/20 text-[10px] font-black uppercase tracking-wider text-pink-300">
              {badgeText}
            </span>
            <p className="truncate font-semibold text-white text-xs sm:text-sm">
              <span className="font-bold">{ad.title}</span>
              {ad.description && <span className="opacity-90 hidden md:inline ml-2 text-xs font-normal">— {ad.description}</span>}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href={ad.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleAdClick}
              className="px-3.5 py-1 rounded-full bg-white text-purple-900 hover:bg-white/90 text-[11px] font-black transition flex items-center gap-1.5 shadow-sm hover:scale-105"
            >
              <span>{cta}</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={handleDismiss}
              className="p-1 rounded-full text-white/80 hover:text-white hover:bg-black/20 transition"
              title="Dismiss announcement"
              aria-label="Dismiss announcement"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // 2. STREAM_CHAT Placement: Pinned top card in the chat box
  if (placement === 'STREAM_CHAT') {
    return (
      <div className={`p-2.5 rounded-xl bg-surfaceLight/80 border border-brandPurple/30 shadow-lg space-y-1.5 backdrop-blur-sm relative group ${className}`}>
        <div className="flex items-center justify-between">
          <span className="px-1.5 py-0.5 rounded bg-brandPurple/20 text-brandPurple text-[9px] font-black uppercase tracking-wider">
            {badgeText}
          </span>
          <button
            onClick={() => setDismissed(true)}
            className="text-gray-400 hover:text-white text-xs p-0.5"
            title="Hide sponsor"
          >
            ✕
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          {ad.imageUrl && (
            <img
              src={ad.imageUrl}
              alt={ad.title}
              className="w-10 h-10 rounded-lg object-cover bg-black border border-surfaceBorder shrink-0"
              onError={(e: any) => {
                e.target.style.display = 'none';
              }}
            />
          )}
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-white truncate">{ad.title}</h4>
            {ad.description && <p className="text-[11px] text-gray-300 line-clamp-1">{ad.description}</p>}
          </div>
        </div>

        <a
          href={ad.targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleAdClick}
          className="w-full py-1 rounded-lg bg-gradient-to-r from-brandPurple to-brandPink text-white text-[10px] font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition shadow"
        >
          <span>{cta}</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    );
  }

  // 3. DIRECTORY & VOD_DIRECTORY Placement: Showcase horizontal banner
  if (placement === 'DIRECTORY' || placement === 'VOD_DIRECTORY') {
    return (
      <div className={`relative overflow-hidden rounded-2xl border border-surfaceBorder bg-gradient-to-r from-purple-950/40 via-surface to-surface shadow-xl p-4 sm:p-6 ${className}`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-5 relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left min-w-0">
            {ad.mediaType === 'VIDEO' && ad.videoUrl ? (
              <div className="relative w-28 h-20 sm:w-36 sm:h-24 rounded-xl overflow-hidden bg-black border border-white/10 shrink-0">
                <video
                  src={ad.videoUrl}
                  autoPlay
                  loop
                  muted={muted}
                  playsInline
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setMuted(!muted)}
                  className="absolute bottom-1 right-1 p-1 rounded-md bg-black/70 text-white hover:bg-black text-[10px]"
                >
                  {muted ? <VolumeX className="w-3 h-3 text-pink-400" /> : <Volume2 className="w-3 h-3 text-emerald-400" />}
                </button>
              </div>
            ) : ad.imageUrl ? (
              <img
                src={ad.imageUrl}
                alt={ad.title}
                className="w-28 h-20 sm:w-36 sm:h-24 rounded-xl object-cover bg-black border border-white/10 shrink-0 shadow-md"
              />
            ) : null}

            <div className="space-y-1">
              <span className="inline-block px-2 py-0.5 rounded-full bg-brandPurple/20 border border-brandPurple/30 text-[10px] font-black uppercase tracking-wider text-pink-300">
                {badgeText}
              </span>
              <h3 className="text-base sm:text-lg font-black text-white">{ad.title}</h3>
              {ad.description && <p className="text-xs text-gray-300 max-w-xl leading-relaxed">{ad.description}</p>}
            </div>
          </div>

          <div className="shrink-0">
            <a
              href={ad.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleAdClick}
              className="btn-glow-purple px-5 py-2.5 rounded-xl text-xs font-black text-white flex items-center gap-2 shadow-lg hover:scale-105 transition"
            >
              <span>{cta}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 4. WATCH & FEED Placement: Rich interactive card
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-surfaceBorder bg-surfaceLight/50 hover:border-brandPurple/50 transition duration-300 shadow-xl p-4 space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30 text-[10px] font-black uppercase tracking-wider">
          {badgeText}
        </span>
        <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-tokenGold" />
          <span>Sponsored</span>
        </span>
      </div>

      {ad.mediaType === 'VIDEO' && ad.videoUrl ? (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/10">
          <video
            src={ad.videoUrl}
            autoPlay
            loop
            muted={muted}
            playsInline
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={() => setMuted(!muted)}
            className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/80 text-white hover:bg-black text-xs backdrop-blur-sm"
          >
            {muted ? <VolumeX className="w-3.5 h-3.5 text-pink-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
        </div>
      ) : ad.imageUrl ? (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/10">
          <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
        </div>
      ) : null}

      <div>
        <h3 className="text-sm font-bold text-white">{ad.title}</h3>
        {ad.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{ad.description}</p>}
      </div>

      <a
        href={ad.targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleAdClick}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brandPurple to-brandPink hover:opacity-90 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow"
      >
        <span>{cta}</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}

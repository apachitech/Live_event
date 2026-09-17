'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Radio,
  Users,
  Coins,
  Volume2,
  VolumeX,
  Heart,
  ChevronUp,
  ChevronDown,
  Share2,
  PictureInPicture,
  Check,
  Smartphone,
  Laptop,
  ArrowRight,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import SendTipModal from '@/components/stream/SendTipModal';

interface ExploreStream {
  id: string;
  title: string;
  category: string;
  viewerCount: number;
  totalTokensEarned: number;
  streamer: {
    id: string;
    displayName: string;
  };
  sourceType: string;
  externalStreamUrl?: string | null;
  recordingUrl?: string | null;
}

const CATEGORIES = ['All', 'Gaming & Music', 'Creative Arts', 'Just Chatting', 'Interactive Shows'];

export default function MobileExploreFeed() {
  const { user } = useAuth();
  const [streams, setStreams] = useState<ExploreStream[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [selectedTipStream, setSelectedTipStream] = useState<ExploreStream | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [showLikeHeart, setShowLikeHeart] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Layout mode for desktop: 9:16 portrait phone mode vs 16:9 widescreen
  const [desktopViewMode, setDesktopViewMode] = useState<'portrait' | 'wide'>('portrait');

  // Swipe & Touch handling refs
  const touchStartY = useRef<number | null>(null);
  const touchCurrentY = useRef<number | null>(null);
  const isSwiping = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);

  // Wheel debounce cooldown ref
  const lastWheelTime = useRef<number>(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Fetch streams list
  const fetchStreams = useCallback(() => {
    setLoading(true);
    const query = selectedCategory !== 'All' ? `?category=${encodeURIComponent(selectedCategory)}` : '';
    fetch(`/api/stream/list${query}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.streams) {
          setStreams(data.streams);
          setCurrentIndex(0);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedCategory]);

  useEffect(() => {
    fetchStreams();
  }, [fetchStreams]);

  const activeStream = streams[currentIndex];

  // Auto-play active video and pause inactive videos
  useEffect(() => {
    videoRefs.current.forEach((video, idx) => {
      if (video) {
        if (idx === currentIndex) {
          video.play().catch(() => {});
        } else {
          video.pause();
          video.currentTime = 0;
        }
      }
    });
  }, [currentIndex, streams]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (currentIndex < streams.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsLiked(false);
    }
  }, [currentIndex, streams.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsLiked(false);
    }
  }, [currentIndex]);

  // 1. Touch Event Listeners (Swipe Up/Down on Mobile Devices)
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
    isSwiping.current = true;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping.current || touchStartY.current === null) return;
    touchCurrentY.current = e.touches[0].clientY;
    const diff = touchCurrentY.current - touchStartY.current;
    // Apply soft resistance to the drag
    setDragOffset(diff * 0.35);
  };

  const onTouchEnd = () => {
    if (!isSwiping.current || touchStartY.current === null || touchCurrentY.current === null) {
      setDragOffset(0);
      isSwiping.current = false;
      return;
    }

    const diff = touchCurrentY.current - touchStartY.current;
    const threshold = 55; // Pixels required to trigger next/prev swipe

    if (diff < -threshold && currentIndex < streams.length - 1) {
      handleNext();
    } else if (diff > threshold && currentIndex > 0) {
      handlePrev();
    }

    setDragOffset(0);
    touchStartY.current = null;
    touchCurrentY.current = null;
    isSwiping.current = false;
  };

  // 2. Mouse Wheel / Trackpad Scroll (Laptops & Desktops)
  const onWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    // 450ms cooldown prevents a single trackpad momentum scroll from skipping multiple streams
    if (now - lastWheelTime.current < 450) return;

    if (e.deltaY > 30 && currentIndex < streams.length - 1) {
      lastWheelTime.current = now;
      handleNext();
    } else if (e.deltaY < -30 && currentIndex > 0) {
      lastWheelTime.current = now;
      handlePrev();
    }
  };

  // 3. Keyboard Navigation (Arrow Keys & Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;

      if (e.key === 'ArrowDown' || e.key === 'j' || e.key === 'PageDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowUp' || e.key === 'k' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMuted((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  // Picture-in-Picture support
  const handlePiP = async () => {
    const video = videoRefs.current[currentIndex];
    if (!video) return;

    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {});
    } else if (document.pictureInPictureEnabled) {
      video.requestPictureInPicture().catch(() => {});
    }
  };

  // Share Stream Link
  const handleShare = () => {
    if (!activeStream) return;
    const url = `${window.location.origin}/watch/${activeStream.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Double tap / like animation
  const handleLike = () => {
    setIsLiked(!isLiked);
    if (!isLiked) {
      setShowLikeHeart(true);
      setTimeout(() => setShowLikeHeart(false), 800);
    }
  };

  if (loading && streams.length === 0) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-black">
        <div className="w-10 h-10 border-4 border-brandPurple border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-gray-400 font-semibold">Loading Live Swipe Feed...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100dvh-4rem)] bg-black overflow-hidden select-none flex flex-col items-center justify-center">
      {/* Top Filter Ribbon (Category Pills - Scrollable Left-Right on Mobile & Laptops) */}
      <div className="absolute top-2 inset-x-0 z-30 flex items-center justify-between px-4 max-w-2xl mx-auto pointer-events-none">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 flex-nowrap touch-pan-x pointer-events-auto bg-black/40 backdrop-blur-md p-1 rounded-2xl border border-white/10 shadow-lg">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-3 py-1 rounded-xl text-[11px] font-bold transition ${
                selectedCategory === cat
                  ? 'bg-brandPurple text-white shadow'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Desktop View Mode Switcher (9:16 vs 16:9) */}
        <div className="hidden lg:flex items-center gap-1 bg-black/40 backdrop-blur-md p-1 rounded-2xl border border-white/10 pointer-events-auto text-[11px] font-bold text-gray-300">
          <button
            onClick={() => setDesktopViewMode('portrait')}
            className={`px-2 py-1 rounded-xl flex items-center gap-1 transition ${
              desktopViewMode === 'portrait' ? 'bg-brandPurple text-white' : 'hover:text-white'
            }`}
            title="Mobile Phone Vertical View (9:16)"
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span>Phone</span>
          </button>
          <button
            onClick={() => setDesktopViewMode('wide')}
            className={`px-2 py-1 rounded-xl flex items-center gap-1 transition ${
              desktopViewMode === 'wide' ? 'bg-brandPurple text-white' : 'hover:text-white'
            }`}
            title="Desktop Widescreen View (16:9)"
          >
            <Laptop className="w-3.5 h-3.5 text-amber-400" />
            <span>Wide</span>
          </button>
        </div>
      </div>

      {streams.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-black z-10">
          <Radio className="w-12 h-12 text-gray-500 mb-3 animate-pulse" />
          <h2 className="text-base font-bold text-white mb-1">No Active Live Streams in this View</h2>
          <p className="text-xs text-gray-400 mb-4 max-w-sm">
            There are currently no broadcasters live in {selectedCategory}. You can explore other categories or start a live broadcast room!
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedCategory('All')}
              className="px-4 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs font-bold text-gray-300 hover:text-white transition"
            >
              Show All Categories
            </button>
            <Link
              href="/dashboard/streamer"
              className="btn-glow-purple px-5 py-2 rounded-xl text-xs font-bold text-white shadow"
            >
              Go Live Now
            </Link>
          </div>
        </div>
      ) : (
        /* Main Feed Slide Viewport */
        <div
          ref={containerRef}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onWheel={onWheel}
          className={`relative w-full h-full transition-all duration-300 flex items-center justify-center ${
            desktopViewMode === 'portrait'
              ? 'max-w-[440px] aspect-[9/16] sm:max-h-[92vh] sm:rounded-3xl sm:border sm:border-surfaceBorder sm:shadow-2xl overflow-hidden'
              : 'max-w-4xl aspect-video sm:max-h-[85vh] sm:rounded-3xl sm:border sm:border-surfaceBorder sm:shadow-2xl overflow-hidden'
          }`}
        >
          {/* Vertical Slides Carousel */}
          <div
            className="w-full h-full relative"
            style={{
              transform: `translateY(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
              transition: isSwiping.current ? 'none' : 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
            }}
          >
            {streams.map((s, idx) => {
              const videoSrc =
                s.externalStreamUrl ||
                s.recordingUrl ||
                'https://res.cloudinary.com/demo/video/upload/sample.mp4';

              return (
                <div key={s.id} className="relative w-full h-full shrink-0 flex items-center justify-center bg-black">
                  {/* Stream Video Surface */}
                  <video
                    ref={(el) => {
                      videoRefs.current[idx] = el;
                    }}
                    src={videoSrc}
                    loop
                    playsInline
                    muted={isMuted}
                    className="w-full h-full object-cover"
                  />

                  {/* Gradient Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/95 pointer-events-none" />

                  {/* Top Bar info inside stream slide */}
                  <div className="absolute top-14 sm:top-12 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-nowrap touch-pan-x pointer-events-auto">
                      <div className="shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/90 text-white text-[11px] font-black uppercase shadow-lg shadow-red-600/30">
                        <Radio className="w-3 h-3 animate-ping" />
                        <span>LIVE</span>
                      </div>
                      <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold border border-white/10">
                        <Users className="w-3.5 h-3.5 text-brandPurple" />
                        <span>{s.viewerCount} Viewers</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pointer-events-auto">
                      <button
                        onClick={handlePiP}
                        className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/10 hover:bg-black/80 transition"
                        title="Picture-in-Picture"
                      >
                        <PictureInPicture className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/10 hover:bg-black/80 transition"
                        title={isMuted ? 'Unmute Live Audio' : 'Mute Live Audio'}
                      >
                        {isMuted ? (
                          <VolumeX className="w-4 h-4 text-red-400" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-emerald-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Double tap / Like pulse animation */}
                  {showLikeHeart && idx === currentIndex && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-ping duration-500">
                      <Heart className="w-24 h-24 fill-current text-pink-500" />
                    </div>
                  )}

                  {/* Right Side Interactivity Column (Likes, Tips, Share, Watch) */}
                  <div className="absolute right-3 sm:right-4 bottom-20 flex flex-col items-center gap-3.5 z-20">
                    {/* Streamer Avatar */}
                    <div className="relative">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-black text-white text-sm shadow-xl border-2 border-white">
                        {s.streamer.displayName.substring(0, 2).toUpperCase()}
                      </div>
                    </div>

                    {/* Like Button */}
                    <button
                      onClick={handleLike}
                      className="flex flex-col items-center gap-1 text-white group cursor-pointer"
                    >
                      <div
                        className={`p-2.5 rounded-full backdrop-blur-md border border-white/10 transition hover:scale-110 ${
                          isLiked ? 'bg-pink-600 text-white scale-110 shadow-lg shadow-pink-500/40' : 'bg-black/60 text-white'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${isLiked ? 'fill-current text-white' : ''}`} />
                      </div>
                      <span className="text-[10px] font-bold">Like</span>
                    </button>

                    {/* Send Tip Button */}
                    <button
                      onClick={() => setSelectedTipStream(s)}
                      className="flex flex-col items-center gap-1 text-white cursor-pointer"
                    >
                      <div className="p-2.5 rounded-full bg-amber-500/90 hover:bg-amber-500 text-black shadow-lg shadow-amber-500/30 transition hover:scale-110">
                        <Coins className="w-5 h-5 fill-current" />
                      </div>
                      <span className="text-[10px] font-bold text-amber-300">Tip</span>
                    </button>

                    {/* Share Button */}
                    <button
                      onClick={handleShare}
                      className="flex flex-col items-center gap-1 text-white cursor-pointer"
                    >
                      <div className="p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/10 hover:bg-black/80 transition hover:scale-110">
                        {copiedLink ? <Check className="w-5 h-5 text-emerald-400" /> : <Share2 className="w-5 h-5" />}
                      </div>
                      <span className="text-[10px] font-bold">{copiedLink ? 'Copied' : 'Share'}</span>
                    </button>

                    {/* Watch Full Room Link */}
                    <Link
                      href={`/watch/${s.id}`}
                      className="flex flex-col items-center gap-1 text-white cursor-pointer"
                    >
                      <div className="p-2.5 rounded-full bg-brandPurple/90 hover:bg-brandPurple text-white shadow-lg shadow-purple-500/30 transition hover:scale-110">
                        <ArrowRight className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold">Room</span>
                    </Link>
                  </div>

                  {/* Bottom Stream Metadata & Enter Room Bar */}
                  <div className="absolute left-4 right-18 bottom-5 z-20 space-y-2">
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug drop-shadow-md line-clamp-2">
                        {s.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-300 mt-1">
                        <span className="font-bold text-white">@{s.streamer.displayName}</span>
                        <span>•</span>
                        <span className="text-brandPurple font-semibold">{s.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-nowrap touch-pan-x">
                      <Link
                        href={`/watch/${s.id}`}
                        className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brandPurple to-brandPink text-white text-xs font-black shadow-lg hover:scale-105 transition"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Enter Full Room & Chat</span>
                      </Link>

                      {s.totalTokensEarned > 0 && (
                        <span className="shrink-0 px-2.5 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-tokenGold border border-white/10 text-xs font-bold flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5" />
                          <span>{s.totalTokensEarned} Tipped</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Up / Down Floating Control Chevrons (Accessible on all devices) */}
          <div className="absolute right-2 inset-y-0 flex flex-col justify-between py-24 z-30 pointer-events-none">
            {currentIndex > 0 ? (
              <button
                onClick={handlePrev}
                className="pointer-events-auto p-2 rounded-full bg-black/70 text-white hover:bg-black border border-white/10 shadow-lg transition hover:scale-110"
                title="Previous Stream (Swipe Down / Key Up)"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
            ) : (
              <div />
            )}

            {currentIndex < streams.length - 1 && (
              <button
                onClick={handleNext}
                className="pointer-events-auto p-2 rounded-full bg-black/70 text-white hover:bg-black border border-white/10 shadow-lg transition hover:scale-110 animate-bounce"
                title="Next Stream (Swipe Up / Key Down)"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Swipe Indicator Pill at bottom */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <span className="px-3 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-gray-300 text-[10px] font-semibold border border-white/10">
              {currentIndex + 1} / {streams.length} • Swipe ↕ or Scroll
            </span>
          </div>
        </div>
      )}

      {/* Tip Modal */}
      {selectedTipStream && (
        <SendTipModal
          streamId={selectedTipStream.id}
          streamerName={selectedTipStream.streamer.displayName}
          isOpen={true}
          onClose={() => setSelectedTipStream(null)}
        />
      )}
    </div>
  );
}

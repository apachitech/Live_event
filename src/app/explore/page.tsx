'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Radio, Users, Coins, Volume2, VolumeX, Heart, ChevronUp, ChevronDown, Share2, Maximize, PictureInPicture } from 'lucide-react';
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
}

export default function MobileExploreFeed() {
  const { user } = useAuth();
  const [streams, setStreams] = useState<ExploreStream[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [selectedTipStream, setSelectedTipStream] = useState<ExploreStream | null>(null);
  const [isLiked, setIsLiked] = useState(false);

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    fetch('/api/stream/list')
      .then((res) => res.json())
      .then((data) => {
        if (data.streams) {
          setStreams(data.streams);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeStream = streams[currentIndex];

  // Auto-play active video and pause inactive videos
  useEffect(() => {
    videoRefs.current.forEach((video, idx) => {
      if (video) {
        if (idx === currentIndex) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    });
  }, [currentIndex, streams]);

  const handleNext = () => {
    if (currentIndex < streams.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsLiked(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsLiked(false);
    }
  };

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

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-black">
        <div className="w-10 h-10 border-4 border-brandPurple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (streams.length === 0) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center p-6 bg-black">
        <Radio className="w-12 h-12 text-gray-500 mb-3" />
        <h2 className="text-base font-bold text-white mb-1">No Live Streams Right Now</h2>
        <p className="text-xs text-gray-400 mb-4">Be the first to start a live broadcast room!</p>
        <Link href="/dashboard/streamer" className="btn-glow-purple px-5 py-2.5 rounded-xl text-xs font-bold text-white">
          Go Live Now
        </Link>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-black overflow-hidden select-none flex items-center justify-center">
      {/* Feed Container */}
      <div className="relative w-full max-w-md h-full bg-surface border-x border-surfaceBorder overflow-hidden flex items-center justify-center">
        {streams.map((s, idx) => {
          const isActive = idx === currentIndex;
          const videoSrc = s.externalStreamUrl || 'https://res.cloudinary.com/demo/video/upload/sample.mp4';

          return (
            <div
              key={s.id}
              className={`absolute inset-0 transition-opacity duration-300 ${
                isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <video
                ref={(el) => { videoRefs.current[idx] = el; }}
                src={videoSrc}
                loop
                playsInline
                muted={isMuted}
                className="w-full h-full object-cover"
              />

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/90 pointer-events-none" />

              {/* Top Bar info */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/90 text-white text-[11px] font-black uppercase shadow-lg">
                    <Radio className="w-3 h-3 animate-ping" />
                    <span>LIVE</span>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold border border-white/10">
                    <Users className="w-3.5 h-3.5 text-brandPurple" />
                    <span>{s.viewerCount}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
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
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                  </button>
                </div>
              </div>

              {/* Right Side Interactivity Column */}
              <div className="absolute right-4 bottom-24 flex flex-col items-center gap-4 z-20">
                {/* Streamer Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-black text-white text-base shadow-lg border-2 border-white">
                    {s.streamer.displayName.substring(0, 2).toUpperCase()}
                  </div>
                </div>

                {/* Like Button */}
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className="flex flex-col items-center gap-1 text-white group"
                >
                  <div className={`p-3 rounded-full backdrop-blur-md border border-white/10 transition ${
                    isLiked ? 'bg-pink-600 text-white scale-110' : 'bg-black/60 text-white'
                  }`}>
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current text-white' : ''}`} />
                  </div>
                  <span className="text-[10px] font-bold">Like</span>
                </button>

                {/* Send Tip Button */}
                <button
                  onClick={() => setSelectedTipStream(s)}
                  className="flex flex-col items-center gap-1 text-white"
                >
                  <div className="p-3 rounded-full bg-amber-500/90 text-black shadow-lg shadow-amber-500/30 animate-bounce-short">
                    <Coins className="w-5 h-5 fill-current" />
                  </div>
                  <span className="text-[10px] font-bold text-amber-300">Tip</span>
                </button>

                {/* Share / Open Watch Room */}
                <Link
                  href={`/watch/${s.id}`}
                  className="flex flex-col items-center gap-1 text-white"
                >
                  <div className="p-3 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/10 hover:bg-black/80 transition">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold">Watch</span>
                </Link>
              </div>

              {/* Bottom Stream Metadata */}
              <div className="absolute left-4 right-20 bottom-6 z-20 space-y-2">
                <div>
                  <h3 className="text-sm font-extrabold text-white leading-tight">
                    {s.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-300 mt-1">
                    <span className="font-bold text-white">@{s.streamer.displayName}</span>
                    <span>•</span>
                    <span className="text-brandPurple font-semibold">{s.category}</span>
                  </div>
                </div>

                <Link
                  href={`/watch/${s.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brandPurple/90 hover:bg-brandPurple text-white text-xs font-bold shadow-lg transition"
                >
                  <span>Enter Full Room & Chat</span>
                </Link>
              </div>
            </div>
          );
        })}

        {/* Up / Down Swipe Navigation Overlays */}
        <div className="absolute right-2 inset-y-0 flex flex-col justify-between py-12 z-30 pointer-events-none">
          {currentIndex > 0 && (
            <button
              onClick={handlePrev}
              className="pointer-events-auto p-2 rounded-full bg-black/60 text-white hover:bg-black/90 border border-white/10 shadow transition"
              title="Previous Stream"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
          )}
          <div />
          {currentIndex < streams.length - 1 && (
            <button
              onClick={handleNext}
              className="pointer-events-auto p-2 rounded-full bg-black/60 text-white hover:bg-black/90 border border-white/10 shadow transition"
              title="Next Stream"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

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

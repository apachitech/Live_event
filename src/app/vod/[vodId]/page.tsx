'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Hls from 'hls.js';
import { useAuth } from '@/context/AuthContext';
import SendTipModal from '@/components/stream/SendTipModal';
import {
  Film,
  Play,
  Lock,
  Coins,
  Clock,
  Eye,
  ArrowLeft,
  Video,
  Share2,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export default function SingleVodWatchPage() {
  const params = useParams();
  const router = useRouter();
  const vodId = params?.vodId as string;
  const { user, openPurchaseModal } = useAuth();

  const [vod, setVod] = useState<any>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [unlockSuccess, setUnlockSuccess] = useState(false);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!vodId) return;

    fetch(`/api/vod/${vodId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.vod) {
          setVod(data.vod);
          setIsUnlocked(data.isUnlocked);
          setIsOwner(data.isOwner);
        } else {
          setError(data.error || 'VOD not found');
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [vodId]);

  // Video playback initialization for unlocked VODs
  useEffect(() => {
    if (!isUnlocked || !vod?.videoUrl) return;

    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    const isHls = vod.videoUrl.includes('.m3u8');

    if (isHls && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hls.loadSource(vod.videoUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal && video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = vod.videoUrl;
          video.play().catch(() => {});
        }
      });
    } else if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = vod.videoUrl;
      const onLoaded = () => video.play().catch(() => {});
      video.addEventListener('loadedmetadata', onLoaded, { once: true });
      if (video.readyState >= 1) onLoaded();
    } else {
      video.src = vod.videoUrl;
      video.play().catch(() => {});
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [isUnlocked, vod]);

  const handleUnlock = async () => {
    if (!user) {
      alert('Please log in to unlock this video recording.');
      return;
    }

    if ((user.wallet?.balance ?? 0) < vod.priceTokens) {
      openPurchaseModal();
      return;
    }

    setUnlocking(true);
    try {
      const res = await fetch(`/api/vod/${vod.id}/unlock`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.isUnlocked) {
        setIsUnlocked(true);
        setUnlockSuccess(true);
      } else {
        alert(data.error || 'Failed to unlock video');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUnlocking(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-brandPurple border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-gray-400">Loading video replay...</p>
      </div>
    );
  }

  if (error || !vod) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-3xl glass-panel text-center border border-surfaceBorder">
        <Film className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white mb-2">Video Unavailable</h2>
        <p className="text-xs text-gray-400 mb-6">{error || 'This video could not be loaded.'}</p>
        <Link href="/vods" className="btn-glow-purple px-5 py-2.5 rounded-xl text-xs font-bold text-white inline-block">
          Return to VOD Library
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-in">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Link href="/vods" className="flex items-center gap-1 hover:text-white transition">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to VOD Library</span>
        </Link>
        <span>/</span>
        <span className="text-gray-200 font-semibold truncate max-w-sm">{vod.title}</span>
      </div>

      {/* Video Surface or Paywall Card */}
      <div className="relative aspect-video rounded-2xl bg-black border border-surfaceBorder overflow-hidden shadow-2xl flex items-center justify-center">
        {isUnlocked ? (
          <video
            ref={videoRef}
            controls
            playsInline
            // @ts-ignore
            webkit-playsinline="true"
            x5-playsinline="true"
            controlsList="nodownload"
            className="w-full h-full object-cover"
          />
        ) : (
          /* Paywall Card */
          <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
            {/* Blurry Background Image */}
            {vod.thumbnailUrl && (
              <img
                src={vod.thumbnailUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover blur-md opacity-30 pointer-events-none"
              />
            )}

            <div className="relative z-10 p-4 rounded-3xl bg-amber-500/20 text-tokenGold border border-amber-400/40 shadow-xl animate-pulse-subtle">
              <Lock className="w-10 h-10" />
            </div>

            <div className="relative z-10 space-y-1.5 max-w-md">
              <h2 className="text-xl font-black text-white">Pay-Per-View Video Recording</h2>
              <p className="text-xs text-gray-300 leading-relaxed">
                This exclusive stream recording requires an unlock of{' '}
                <span className="text-tokenGold font-bold">{vod.priceTokens} Tokens</span>. Unlock once and watch unlimited replays anytime.
              </p>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={handleUnlock}
                disabled={unlocking}
                className="btn-glow-gold px-6 py-3 rounded-xl text-xs font-black text-black flex items-center gap-2 shadow-xl hover:scale-105 transition"
              >
                <Coins className="w-4 h-4 text-black" />
                <span>
                  {unlocking ? 'Processing Unlock...' : `Unlock for ${vod.priceTokens} Tokens`}
                </span>
              </button>

              {user && (user.wallet?.balance ?? 0) < vod.priceTokens && (
                <button
                  onClick={openPurchaseModal}
                  className="px-4 py-3 rounded-xl bg-surfaceLight border border-surfaceBorder hover:border-gray-500 text-xs font-bold text-gray-300 transition"
                >
                  Buy Tokens ({user.wallet?.balance ?? 0} available)
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Video Details & Creator Section */}
      <div className="p-6 rounded-2xl glass-panel border border-surfaceBorder space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-xl font-black text-white">{vod.title}</h1>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>{vod.viewCount} views</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Recorded {new Date(vod.createdAt).toLocaleDateString()}</span>
              </span>
              {vod.priceTokens > 0 && (
                <>
                  <span>•</span>
                  <span className="text-tokenGold font-bold flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" />
                    <span>{vod.priceTokens} Tokens PPV</span>
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsTipModalOpen(true)}
              className="btn-glow-gold px-4 py-2.5 rounded-xl text-xs font-black text-black flex items-center gap-1.5"
            >
              <Coins className="w-4 h-4" />
              <span>Tip Broadcaster</span>
            </button>

            {vod.streamer.streams?.length > 0 && (
              <Link
                href={`/watch/${vod.streamer.streams[0].id}`}
                className="px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Video className="w-4 h-4" />
                <span>Watch Live Room</span>
              </Link>
            )}
          </div>
        </div>

        {vod.description && (
          <p className="text-xs text-gray-300 pt-3 border-t border-surfaceBorder leading-relaxed">
            {vod.description}
          </p>
        )}
      </div>

      {/* Tip Modal */}
      {vod.streamer.streams?.length > 0 && (
        <SendTipModal
          streamId={vod.streamer.streams[0].id}
          streamerName={vod.streamer.displayName}
          isOpen={isTipModalOpen}
          onClose={() => setIsTipModalOpen(false)}
        />
      )}
    </div>
  );
}

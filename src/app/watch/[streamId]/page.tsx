'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import VideoPlayer from '@/components/stream/VideoPlayer';
import ChatContainer from '@/components/chat/ChatContainer';
import TipAlertOverlay from '@/components/stream/TipAlertOverlay';
import TipGoalProgressBar from '@/components/stream/TipGoalProgressBar';
import TipMenuDrawer from '@/components/stream/TipMenuDrawer';
import StreamPollCard, { PollData } from '@/components/stream/StreamPollCard';
import StreamLeaderboard from '@/components/stream/StreamLeaderboard';
import SendTipModal from '@/components/stream/SendTipModal';
import SubscribeModal from '@/components/subscription/SubscribeModal';
import PrivateShowRequestModal from '@/components/stream/PrivateShowRequestModal';
import PrivateShowMeterBanner from '@/components/stream/PrivateShowMeterBanner';
import { TipAlertPayload, TipGoalPayload } from '@/types';
import { Coins, Heart, Lock, Flag, Share2, Users, Radio, Sparkles, Trophy, Check, Megaphone } from 'lucide-react';

export default function WatchPage() {
  const params = useParams();
  const streamId = params?.streamId as string;
  const { user, openPurchaseModal, openCampaignModal } = useAuth();

  const [stream, setStream] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeAlert, setActiveAlert] = useState<TipAlertPayload | null>(null);
  const [tipGoal, setTipGoal] = useState<TipGoalPayload | null>(null);
  const [activePoll, setActivePoll] = useState<PollData | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [leaderboardRefresh, setLeaderboardRefresh] = useState(0);
  const [activeTab, setActiveTab] = useState<'menu' | 'leaderboard'>('menu');
  const [copiedLink, setCopiedLink] = useState(false);

  // Modals
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isPrivateModalOpen, setIsPrivateModalOpen] = useState(false);

  // Private show state
  const [isPrivateActive, setIsPrivateActive] = useState(false);
  const [isC2cEnabled, setIsC2cEnabled] = useState(true);

  const fetchActivePoll = () => {
    if (!streamId) return;
    fetch(`/api/stream/${streamId}/polls`)
      .then((res) => res.json())
      .then((data) => {
        if (data.poll) setActivePoll(data.poll);
        else setActivePoll(null);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!streamId) return;

    // Fetch initial stream info
    fetch(`/api/stream/${streamId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStream(data.stream);
          setViewerCount(data.stream.viewerCount || 1);
          setIsPrivateActive(data.stream.isPrivate || data.stream.status === 'PRIVATE');
          if (data.stream.tipGoals?.length > 0) {
            setTipGoal(data.stream.tipGoals[0]);
          }
        } else {
          setError(data.error || 'Stream not found');
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    fetchActivePoll();

    // Connect socket for real-time room alerts & presence
    const socket: Socket = io();

    socket.emit('join_room', {
      streamId,
      user: user ? { id: user.id, username: user.username, role: user.role } : { id: 'guest', username: 'Guest' },
    });

    socket.on('tip_alert', (payload: TipAlertPayload) => {
      setActiveAlert(payload);
      setLeaderboardRefresh((prev) => prev + 1);
    });

    socket.on('goal_updated', (goal: TipGoalPayload) => {
      setTipGoal(goal);
    });

    socket.on('viewer_count_update', ({ count }: { count: number }) => {
      setViewerCount(count);
    });

    socket.on('poll_created', (poll: PollData) => {
      setActivePoll(poll);
    });

    socket.on('poll_voted', (poll: PollData) => {
      setActivePoll(poll);
    });

    socket.on('poll_closed', () => {
      setActivePoll(null);
    });

    socket.on('private_show_response', (res: any) => {
      if (res.accepted) {
        setIsPrivateActive(true);
        if (res.c2cEnabled !== undefined) {
          setIsC2cEnabled(Boolean(res.c2cEnabled));
        }
      }
    });

    socket.on('private_show_ended', () => {
      setIsPrivateActive(false);
    });

    return () => {
      socket.emit('leave_room', { streamId });
      socket.disconnect();
    };
  }, [streamId, user]);

  const handleReportStream = async () => {
    const reason = prompt('Please specify why you are reporting this stream:');
    if (!reason) return;

    try {
      const res = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: 'STREAM',
          targetId: streamId,
          reason,
        }),
      });
      if (res.ok) {
        alert('Thank you. This report has been submitted to platform moderators for review.');
      }
    } catch {}
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="w-12 h-12 border-4 border-brandPurple border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-xs">Loading live broadcast room...</p>
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-3xl glass-panel text-center border border-surfaceBorder">
        <Radio className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white mb-2">Stream Offline or Unavailable</h2>
        <p className="text-xs text-gray-400 mb-6">{error || 'This live stream room could not be found.'}</p>
        <a href="/" className="btn-glow-purple px-5 py-2.5 rounded-xl text-xs font-bold text-white inline-block">
          Browse Active Streams
        </a>
      </div>
    );
  }

  const isCurrentStreamer = user?.id === stream.streamer.userId;

  return (
    <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-6">
      {/* Active Private Show Banner */}
      {isPrivateActive && (
        <div className="mb-4">
          <PrivateShowMeterBanner
            streamId={stream.id}
            ratePerMin={stream.privateRatePerMin || 60}
            isStreamer={isCurrentStreamer}
            onEndShow={() => setIsPrivateActive(false)}
          />
        </div>
      )}

      {/* Main 2-Column Watch Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Video Player & Controls */}
        <div className="lg:col-span-8 space-y-4">
          {/* Video Container with Overlays */}
          <div className="relative">
            <VideoPlayer
              streamId={stream.id}
              streamTitle={stream.title}
              streamerName={stream.streamer.displayName}
              viewerCount={viewerCount}
              isPrivate={isPrivateActive}
              sourceType={stream.sourceType}
              externalStreamUrl={stream.externalStreamUrl}
              c2cEnabled={isC2cEnabled}
            />
            {/* On-screen animated tip alert */}
            <TipAlertOverlay alert={activeAlert} />
          </div>

          {/* Real-time Tip Goal Bar */}
          {tipGoal && <TipGoalProgressBar goal={tipGoal} />}

          {/* Real-time Mid-stream Interactive Poll */}
          {activePoll && (
            <StreamPollCard
              streamId={stream.id}
              poll={activePoll}
              isStreamer={isCurrentStreamer}
              onPollClosed={() => setActivePoll(null)}
              onVoteCast={() => fetchActivePoll()}
            />
          )}

          {/* Streamer Header & Action Toolbar */}
          <div className="rounded-2xl glass-panel p-5 border border-surfaceBorder">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-black text-white text-lg shadow-lg">
                  {stream.streamer.displayName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-lg font-black text-white flex items-center gap-2">
                    {stream.title}
                  </h1>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                    <span className="text-gray-200 font-bold">{stream.streamer.displayName}</span>
                    <span>•</span>
                    <span className="text-brandPurple font-semibold">{stream.category}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-tokenGold font-bold">
                      <Coins className="w-3.5 h-3.5" />
                      {stream.totalTokensEarned} Tipped
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Tip, Subscribe, Private Show, Share, Report (Scrollable Left-Right on Mobile/Small Devices) */}
              {!isCurrentStreamer && (
                <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar py-1 w-full sm:w-auto flex-nowrap touch-pan-x overscroll-x-contain">
                  <button
                    onClick={() => setIsTipModalOpen(true)}
                    className="shrink-0 btn-glow-gold px-4 py-2.5 rounded-xl text-xs font-black text-black flex items-center gap-1.5 transition hover:scale-105"
                  >
                    <Coins className="w-4 h-4" />
                    <span>Send Tip</span>
                  </button>

                  <button
                    onClick={() => setIsSubModalOpen(true)}
                    className="shrink-0 px-4 py-2.5 rounded-xl bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/30 text-xs font-bold flex items-center gap-1.5 transition hover:scale-105"
                  >
                    <Heart className="w-4 h-4" />
                    <span>Fan Club</span>
                  </button>

                  {!isPrivateActive && (
                    <button
                      onClick={() => setIsPrivateModalOpen(true)}
                      className="shrink-0 px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 transition hover:scale-105"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Private ({stream.privateRatePerMin || 60}🪙/m)</span>
                    </button>
                  )}

                  <button
                    onClick={openCampaignModal}
                    className="shrink-0 px-3.5 py-2.5 rounded-xl bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/30 text-xs font-bold flex items-center gap-1.5 transition hover:scale-105"
                    title="Launch a sponsored Ad Campaign"
                  >
                    <Megaphone className="w-4 h-4 text-pink-400" />
                    <span>Launch Ad</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="shrink-0 px-3.5 py-2.5 rounded-xl bg-surfaceLight hover:bg-surfaceBorder text-gray-200 border border-surfaceBorder text-xs font-bold flex items-center gap-1.5 transition hover:scale-105"
                    title="Share Live Stream Link"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-brandPurple" />}
                    <span>{copiedLink ? 'Copied!' : 'Share'}</span>
                  </button>

                  <button
                    onClick={handleReportStream}
                    className="shrink-0 p-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-gray-400 hover:text-red-400 transition"
                    title="Report Stream"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Streamer Bio */}
            {stream.streamer.bio && (
              <p className="mt-4 pt-4 border-t border-surfaceBorder/80 text-xs text-gray-300 leading-relaxed">
                {stream.streamer.bio}
              </p>
            )}
          </div>

          {/* Bottom Interactive Area: Tabs for Tip Menu & Top Supporters Leaderboard */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-surfaceBorder pb-2 overflow-x-auto no-scrollbar flex-nowrap touch-pan-x">
              <button
                onClick={() => setActiveTab('menu')}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'menu'
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tip Menu & Actions</span>
              </button>
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'leaderboard'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Top Supporters Leaderboard</span>
              </button>
            </div>

            {activeTab === 'menu' ? (
              stream.streamer.tipMenus && stream.streamer.tipMenus.length > 0 ? (
                <TipMenuDrawer
                  streamId={stream.id}
                  streamerName={stream.streamer.displayName}
                  items={stream.streamer.tipMenus}
                />
              ) : (
                <div className="p-6 rounded-2xl glass-panel text-center text-xs text-gray-400 border border-surfaceBorder">
                  No custom tip menu items created yet for this room.
                </div>
              )
            ) : (
              <StreamLeaderboard streamId={stream.id} refreshTrigger={leaderboardRefresh} />
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Live Real-time Chat Container */}
        <div className="lg:col-span-4 h-[650px] lg:h-[calc(100vh-6rem)] sticky top-20">
          <ChatContainer
            streamId={stream.id}
            initialMessages={stream.chatMessages?.map((m: any) => ({
              id: m.id,
              streamId: m.streamId,
              userId: m.userId,
              username: m.user?.username || 'Viewer',
              role: m.user?.role || 'VIEWER',
              body: m.body,
              flagged: m.flagged,
              createdAt: m.createdAt,
            }))}
          />
        </div>
      </div>

      {/* Modal Dialogs */}
      <SendTipModal
        streamId={stream.id}
        streamerName={stream.streamer.displayName}
        isOpen={isTipModalOpen}
        onClose={() => setIsTipModalOpen(false)}
      />

      <SubscribeModal
        streamerId={stream.streamer.id}
        streamerName={stream.streamer.displayName}
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
      />

      <PrivateShowRequestModal
        streamId={stream.id}
        streamerName={stream.streamer.displayName}
        ratePerMin={stream.privateRatePerMin || 60}
        isOpen={isPrivateModalOpen}
        onClose={() => setIsPrivateModalOpen(false)}
      />
    </div>
  );
}

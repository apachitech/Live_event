'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import {
  Video,
  Radio,
  Users,
  Coins,
  Play,
  Square,
  Target,
  Sparkles,
  PhoneCall,
  Check,
  X,
  ExternalLink,
  BarChart3,
  Trash2,
  Pin,
  AlertTriangle,
  Film,
  Megaphone,
} from 'lucide-react';
import ChatContainer from '@/components/chat/ChatContainer';
import PrivateShowMeterBanner from '@/components/stream/PrivateShowMeterBanner';
import BroadcastStudio from '@/components/stream/BroadcastStudio';
import StreamPollCard, { PollData } from '@/components/stream/StreamPollCard';
import { HapticsManager } from '@/lib/haptics/hapticsManager';
import { useSiteConfig } from '@/context/SiteConfigContext';

export default function StreamerStudioPage() {
  const { user, openCampaignModal } = useAuth();
  const { isToysAllowed } = useSiteConfig();

  useEffect(() => {
    HapticsManager.getInstance().setEnabled(!!isToysAllowed);
  }, [isToysAllowed]);
  const [stream, setStream] = useState<any>(null);
  const [isLive, setIsLive] = useState(false);
  const [streamTitle, setStreamTitle] = useState('My Live Broadcast');
  const [category, setCategory] = useState('Gaming & Music');
  const [privateRate, setPrivateRate] = useState(60);

  // Stop Stream Confirmation Modal
  const [showEndModal, setShowEndModal] = useState(false);

  // Pinned Announcement state
  const [announcementInput, setAnnouncementInput] = useState('');
  const [pinnedText, setPinnedText] = useState<string | null>(null);

  // Tip Goal form
  const [goalLabel, setGoalLabel] = useState('');
  const [goalTarget, setGoalTarget] = useState(500);

  // Tip Menu item form
  const [menuLabel, setMenuLabel] = useState('');
  const [menuCost, setMenuCost] = useState(25);
  const [menuDesc, setMenuDesc] = useState('');
  const [tipMenuItems, setTipMenuItems] = useState<any[]>([]);

  // Mid-stream Poll state
  const [activePoll, setActivePoll] = useState<PollData | null>(null);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollTokenCost, setPollTokenCost] = useState(0);
  const [isPollSubmitting, setIsPollSubmitting] = useState(false);

  // Incoming private request
  const [incomingPrivate, setIncomingPrivate] = useState<any | null>(null);
  const [isPrivateActive, setIsPrivateActive] = useState(false);

  // Broadcast action loading state
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  // Load current streamer stream or channel
  useEffect(() => {
    if (!user) return;

    fetch('/api/stream/current')
      .then((res) => res.json())
      .then((data) => {
        if (data.stream) {
          const myStream = data.stream;
          setStream(myStream);
          setIsLive(myStream.status === 'LIVE' || myStream.status === 'PRIVATE');
          setIsPrivateActive(myStream.status === 'PRIVATE');
          if (myStream.title) setStreamTitle(myStream.title);
          if (myStream.category) setCategory(myStream.category);
          if (myStream.privateRatePerMin) setPrivateRate(myStream.privateRatePerMin);

          // Fetch active poll for this stream
          fetch(`/api/stream/${myStream.id}/polls`)
            .then((r) => r.json())
            .then((pData) => {
              if (pData.poll) setActivePoll(pData.poll);
            })
            .catch(() => {});

          // Fetch existing tip menu items
          fetch(`/api/stream/${myStream.id}/tip-menu`)
            .then((r) => r.json())
            .then((m) => {
              if (m.items) setTipMenuItems(m.items);
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, [user]);

  // Socket connection for room coordination
  useEffect(() => {
    if (!stream) return;

    const socket = io();
    socketRef.current = socket;

    socket.emit('join_room', {
      streamId: stream.id,
      user: { id: user?.id, username: user?.username, role: 'STREAMER' },
    });

    socket.on('private_show_requested', (reqData: any) => {
      setIncomingPrivate(reqData);
    });

    socket.on('private_show_ended', () => {
      setIsPrivateActive(false);
      setIncomingPrivate(null);
    });

    socket.on('poll_voted', (pollData: PollData) => {
      setActivePoll(pollData);
    });

    socket.on('poll_closed', () => {
      setActivePoll(null);
    });

    socket.on('viewer_count_update', ({ count }: { count: number }) => {
      setStream((prev: any) => (prev ? { ...prev, viewerCount: count } : prev));
    });

    socket.on('tip_alert', (tipData: any) => {
      if (tipData && tipData.tokenAmount) {
        HapticsManager.getInstance().handleTipReceived(tipData.tokenAmount);
        setStream((prev: any) =>
          prev ? { ...prev, totalTokensEarned: (prev.totalTokensEarned || 0) + tipData.tokenAmount } : prev
        );
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [stream, user]);

  const handleStartStream = async () => {
    if (isStarting) return;
    setIsStarting(true);
    try {
      const res = await fetch('/api/stream/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: streamTitle,
          category,
          privateRatePerMin: privateRate,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStream(data.stream);
        setIsLive(true);
      } else {
        alert(data.error || 'Failed to start stream');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsStarting(false);
    }
  };

  const handleEndStream = async () => {
    if (!stream || isEnding) return;
    setIsEnding(true);
    try {
      await fetch('/api/stream/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamId: stream.id,
          status: 'ENDED',
        }),
      });
      setIsLive(false);
      setIsPrivateActive(false);
      setStream((prev: any) => (prev ? { ...prev, status: 'ENDED' } : prev));
      setShowEndModal(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsEnding(false);
    }
  };

  const handlePinAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stream || !announcementInput.trim()) return;

    socketRef.current?.emit('pinned_announcement', {
      streamId: stream.id,
      announcement: announcementInput.trim(),
    });

    setPinnedText(announcementInput.trim());
    setAnnouncementInput('');
  };

  const handleClearAnnouncement = () => {
    if (!stream) return;
    socketRef.current?.emit('pinned_announcement', {
      streamId: stream.id,
      announcement: null,
    });
    setPinnedText(null);
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stream || !goalLabel) return;
    try {
      const res = await fetch(`/api/stream/${stream.id}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: goalLabel,
          targetAmount: goalTarget,
        }),
      });
      if (res.ok) {
        alert('Tip Goal Activated in Room!');
        setGoalLabel('');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stream || !menuLabel) return;
    try {
      const res = await fetch(`/api/stream/${stream.id}/tip-menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: menuLabel,
          tokenCost: menuCost,
          description: menuDesc,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTipMenuItems((prev) => [...prev, data.item]);
        setMenuLabel('');
        setMenuDesc('');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleAcceptPrivate = async () => {
    if (!stream || !incomingPrivate) return;
    try {
      await fetch('/api/stream/private/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamId: stream.id,
          action: 'accept',
          viewerId: incomingPrivate.viewerId,
          requestId: incomingPrivate.requestId,
          sessionId: incomingPrivate.sessionId || incomingPrivate.requestId,
        }),
      });
      setIsPrivateActive(true);
      setIncomingPrivate(null);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleRemovePollOption = (idx: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== idx));
    }
  };

  const handlePollOptionChange = (idx: number, val: string) => {
    const updated = [...pollOptions];
    updated[idx] = val;
    setPollOptions(updated);
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stream || !pollQuestion.trim()) return;

    const filteredOptions = pollOptions.filter((o) => o.trim() !== '');
    if (filteredOptions.length < 2) {
      alert('Poll requires at least 2 non-empty options.');
      return;
    }

    setIsPollSubmitting(true);
    try {
      const res = await fetch(`/api/stream/${stream.id}/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: pollQuestion.trim(),
          options: filteredOptions,
          tokenCost: pollTokenCost,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActivePoll(data.poll);
        socketRef.current?.emit('poll_created', { streamId: stream.id, poll: data.poll });
        setPollQuestion('');
        setPollOptions(['', '']);
        setPollTokenCost(0);
      } else {
        alert(data.error || 'Failed to create poll');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsPollSubmitting(false);
    }
  };

  const handleEndPoll = async () => {
    if (!stream || !activePoll) return;
    try {
      await fetch(`/api/stream/${stream.id}/polls`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId: activePoll.id }),
      });
      socketRef.current?.emit('poll_closed', { streamId: stream.id, pollId: activePoll.id });
      setActivePoll(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surfaceBorder">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Video className="w-6 h-6 text-brandPurple" />
            <span>Go Live Broadcast Studio</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Real-time camera management, interactive tip menus, screen sharing, and community goals
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Live Viewers Counter */}
          {stream && isLive && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-white">
              <Users className="w-3.5 h-3.5 text-brandPurple" />
              <span className="font-bold">{stream.viewerCount || 0}</span>
              <span className="text-gray-400 text-[11px]">Viewers</span>
            </div>
          )}

          {/* Stream Session Earnings */}
          {stream && isLive && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-tokenGold">
              <Coins className="w-3.5 h-3.5" />
              <span className="font-bold">{stream.totalTokensEarned || 0}</span>
              <span className="text-[11px] text-gray-400">Tokens Tipped</span>
            </div>
          )}

          <Link
            href="/dashboard/streamer/vods"
            className="btn-glow-purple px-4 py-2 rounded-xl text-xs font-black text-white flex items-center gap-1.5 shadow hover:scale-105 transition"
            title="Manage and CRUD your VOD recordings"
          >
            <Film className="w-4 h-4 text-purple-200" />
            <span>VOD CRUD</span>
          </Link>

          <button
            type="button"
            onClick={openCampaignModal}
            className="px-3.5 py-2 rounded-xl bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/30 text-xs font-bold flex items-center gap-1.5 shadow transition hover:scale-105"
            title="Launch an Ad Campaign to promote your stream across the platform"
          >
            <Megaphone className="w-4 h-4 text-pink-400" />
            <span>Launch Ad</span>
          </button>

          <Link
            href="/dashboard/streamer/payouts"
            className="btn-glow-gold px-4 py-2 rounded-xl text-xs font-bold text-black flex items-center gap-1.5 shadow"
          >
            <Coins className="w-4 h-4" />
            <span>Earnings ({user?.wallet?.earnedBalance ?? 0}🪙)</span>
          </Link>

          {stream && isLive && (
            <Link
              href={`/watch/${stream.id}`}
              target="_blank"
              className="px-3.5 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder hover:border-gray-600 text-xs font-semibold text-gray-300 flex items-center gap-1.5 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Room</span>
            </Link>
          )}
        </div>
      </div>

      {/* Incoming Private Show Alert Popup */}
      {incomingPrivate && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-600/30 to-purple-600/30 border-2 border-pink-500 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-bounce-short">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-pink-500 text-white">
              <PhoneCall className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-black text-white flex items-center gap-2">
                <span>Incoming 1:1 Private Show Request!</span>
                {incomingPrivate.c2cEnabled && (
                  <span className="px-2 py-0.5 rounded-md bg-pink-500 text-white text-[10px] font-black uppercase tracking-wider">
                    📹 C2C Mutual Cam
                  </span>
                )}
              </div>
              <div className="text-xs text-pink-200">
                Viewer <span className="font-bold text-white">{incomingPrivate.viewerUsername}</span> wants to start a private show at {incomingPrivate.ratePerMin} tokens/min.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAcceptPrivate}
              className="btn-glow-purple px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1 shadow"
            >
              <Check className="w-4 h-4" /> Accept & Go Private
            </button>
            <button
              onClick={() => setIncomingPrivate(null)}
              className="p-2 rounded-xl bg-surfaceLight hover:bg-surface text-gray-300 text-xs transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Private Show Active Meter */}
      {isPrivateActive && stream && (
        <PrivateShowMeterBanner
          streamId={stream.id}
          ratePerMin={stream.privateRatePerMin || 60}
          isStreamer={true}
          onEndShow={() => setIsPrivateActive(false)}
        />
      )}

      {/* Main Studio Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Camera Feed, Controls & Tooling */}
        <div className="lg:col-span-8 space-y-5">
          {/* Hardware Device Manager & Publisher Studio (WebRTC, Screen Share, OBS) */}
          <BroadcastStudio
            streamId={stream?.id || null}
            isLive={isLive}
            isActionLoading={isStarting || isEnding}
            onStartStream={handleStartStream}
            onEndStream={() => setShowEndModal(true)}
          />

          {/* Broadcast Launch & Parameters Bar */}
          <div className="p-5 rounded-2xl glass-panel border border-surfaceBorder space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 flex-1">
                <label className="text-xs font-bold text-gray-400">Stream Title</label>
                <input
                  type="text"
                  disabled={isLive}
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-sm font-semibold focus:outline-none focus:border-brandPurple disabled:opacity-60"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400">Category</label>
                <select
                  disabled={isLive}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full sm:w-44 px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs font-medium focus:outline-none focus:border-brandPurple disabled:opacity-60"
                >
                  <option value="Gaming & Music">Gaming & Music</option>
                  <option value="Creative Arts">Creative Arts</option>
                  <option value="Just Chatting">Just Chatting</option>
                  <option value="Interactive Shows">Interactive Shows</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400">Private Rate (Tokens/min)</label>
                <input
                  type="number"
                  disabled={isLive}
                  value={privateRate}
                  onChange={(e) => setPrivateRate(parseInt(e.target.value, 10) || 60)}
                  className="w-full sm:w-32 px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-tokenGold font-black text-xs focus:outline-none focus:border-brandPurple disabled:opacity-60"
                />
              </div>

              <div className="pt-5">
                {!isLive ? (
                  <button
                    onClick={handleStartStream}
                    disabled={isStarting}
                    className="btn-glow-purple px-6 py-2.5 rounded-xl text-xs font-black text-white flex items-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    {isStarting ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 fill-current" />
                    )}
                    <span>{isStarting ? 'Starting...' : 'Go Live Now'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowEndModal(true)}
                    disabled={isEnding}
                    className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-black text-white flex items-center gap-2 transition shadow-lg disabled:opacity-50"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>End Stream</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Chat Announcement Tool */}
          {isLive && (
            <div className="p-4 rounded-2xl glass-panel border border-surfaceBorder">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Pin className="w-4 h-4 text-tokenGold" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Sticky Room Announcement
                  </h3>
                </div>
                {pinnedText && (
                  <button
                    onClick={handleClearAnnouncement}
                    className="text-[11px] text-red-400 hover:underline font-bold"
                  >
                    Clear Pinned Message
                  </button>
                )}
              </div>

              <form onSubmit={handlePinAnnouncement} className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={160}
                  value={announcementInput}
                  onChange={(e) => setAnnouncementInput(e.target.value)}
                  placeholder={
                    pinnedText
                      ? `Pinned: "${pinnedText}" (enter new message to replace)`
                      : 'e.g. Welcome everyone! Hit the tip menu to request songs 🎵'
                  }
                  className="flex-1 px-3.5 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple"
                />
                <button
                  type="submit"
                  disabled={!announcementInput.trim()}
                  className="btn-glow-purple px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-40"
                >
                  Pin in Chat
                </button>
              </form>
            </div>
          )}

          {/* Interactive Tooling: Tip Goal & Tip Menu Manager */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Create Room Tip Goal */}
            <div className="p-5 rounded-2xl glass-panel border border-surfaceBorder">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-tokenGold" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Community Tip Goal</h3>
              </div>

              <form onSubmit={handleCreateGoal} className="space-y-3">
                <input
                  type="text"
                  placeholder="e.g. Upgrade Camera Lens"
                  value={goalLabel}
                  onChange={(e) => setGoalLabel(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple"
                />
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-gray-300">
                    <Coins className="w-3.5 h-3.5 text-tokenGold" />
                    <input
                      type="number"
                      min="50"
                      value={goalTarget}
                      onChange={(e) => setGoalTarget(parseInt(e.target.value, 10) || 100)}
                      className="w-full bg-transparent text-white font-bold text-xs focus:outline-none"
                    />
                    <span className="text-[10px] text-gray-400">Tokens</span>
                  </div>
                  <button
                    type="submit"
                    disabled={!isLive}
                    className="btn-glow-gold px-4 py-2 rounded-xl text-xs font-bold text-black disabled:opacity-40"
                  >
                    Activate Goal
                  </button>
                </div>
              </form>
            </div>

            {/* Manage Tip Menu Items */}
            <div className="p-5 rounded-2xl glass-panel border border-surfaceBorder">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-brandPurple" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Add Tip Menu Action</h3>
              </div>

              <form onSubmit={handleAddMenuItem} className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Action (e.g. Song Request)"
                    value={menuLabel}
                    onChange={(e) => setMenuLabel(e.target.value)}
                    className="col-span-2 px-3.5 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple"
                  />
                  <div className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs">
                    <Coins className="w-3 h-3 text-tokenGold" />
                    <input
                      type="number"
                      min="5"
                      value={menuCost}
                      onChange={(e) => setMenuCost(parseInt(e.target.value, 10) || 10)}
                      className="w-full bg-transparent text-tokenGold font-bold text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={menuDesc}
                    onChange={(e) => setMenuDesc(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple"
                  />
                  <button
                    type="submit"
                    disabled={!isLive}
                    className="btn-glow-purple px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-40"
                  >
                    Add
                  </button>
                </div>
              </form>

              {/* Active Menu Items Quick List */}
              {tipMenuItems.length > 0 && (
                <div className="mt-3 pt-3 border-t border-surfaceBorder/60 space-y-1.5 max-h-28 overflow-y-auto">
                  {tipMenuItems.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-surfaceLight/50"
                    >
                      <span className="font-semibold text-white truncate max-w-[150px]">{item.label}</span>
                      <span className="text-tokenGold font-bold">{item.tokenCost}🪙</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mid-Stream Interactive Polls Tool */}
          <div className="p-5 rounded-2xl glass-panel border border-surfaceBorder space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brandPurple" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Mid-Stream Live Poll</h3>
              </div>
              {activePoll && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold animate-pulse">
                  Live Poll Running
                </span>
              )}
            </div>

            {activePoll ? (
              <div className="space-y-3">
                <StreamPollCard
                  streamId={stream.id}
                  poll={activePoll}
                  isStreamer={true}
                  onPollClosed={handleEndPoll}
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleEndPoll}
                    className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-bold transition"
                  >
                    End Active Poll
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreatePoll} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400">Poll Question</label>
                  <input
                    type="text"
                    disabled={!isLive}
                    placeholder="e.g. Which track or costume should I perform next?"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400">Voting Options</label>
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        disabled={!isLive}
                        placeholder={`Option ${idx + 1}`}
                        value={opt}
                        onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                        className="flex-1 px-3.5 py-1.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple disabled:opacity-50"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePollOption(idx)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}

                  {pollOptions.length < 5 && (
                    <button
                      type="button"
                      disabled={!isLive}
                      onClick={handleAddPollOption}
                      className="text-[11px] font-bold text-brandPurple hover:text-purple-300 flex items-center gap-1 mt-1 transition disabled:opacity-50"
                    >
                      <span>+ Add Option</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-surfaceBorder/60">
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-bold text-gray-400">Vote Cost:</label>
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs">
                      <Coins className="w-3 h-3 text-tokenGold" />
                      <input
                        type="number"
                        min="0"
                        disabled={!isLive}
                        value={pollTokenCost}
                        onChange={(e) => setPollTokenCost(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-16 bg-transparent text-tokenGold font-bold text-xs focus:outline-none disabled:opacity-50"
                      />
                      <span className="text-[10px] text-gray-400">{pollTokenCost > 0 ? 'Tokens / Vote' : 'Free Vote'}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!isLive || isPollSubmitting || !pollQuestion.trim()}
                    className="btn-glow-purple px-5 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-40 shadow transition"
                  >
                    {isPollSubmitting ? 'Launching...' : '🚀 Launch Room Poll'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Live Chat Monitor */}
        <div className="lg:col-span-4 h-[600px] lg:h-[calc(100vh-8rem)] sticky top-24">
          {stream ? (
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
          ) : (
            <div className="h-full rounded-2xl glass-panel border border-surfaceBorder flex flex-col items-center justify-center text-center p-6 text-gray-500">
              <div className="w-7 h-7 border-2 border-brandPurple border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs font-bold text-gray-300">Connecting Studio Chat...</p>
              <p className="text-[11px] text-gray-400 mt-1 max-w-xs">Initializing real-time studio channel.</p>
            </div>
          )}
        </div>
      </div>

      {/* Stop Stream Confirmation Modal */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-surface border border-surfaceBorder p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-red-500/20 text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">End Live Broadcast?</h3>
                <p className="text-xs text-gray-400">
                  This will disconnect all active viewers and conclude your stream session.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-gray-300 space-y-1">
              <div className="flex justify-between">
                <span>Viewers:</span>
                <span className="font-bold text-white">{stream?.viewerCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Tokens Earned:</span>
                <span className="font-bold text-tokenGold">{stream?.totalTokensEarned || 0}🪙</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowEndModal(false)}
                className="px-4 py-2 rounded-xl bg-surfaceLight hover:bg-surfaceBorder text-gray-300 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEndStream}
                disabled={isEnding}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-lg transition disabled:opacity-50"
              >
                {isEnding ? 'Stopping...' : 'Yes, Stop Broadcast'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

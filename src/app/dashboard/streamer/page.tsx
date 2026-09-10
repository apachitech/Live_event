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
  Settings,
  Plus,
  Play,
  Square,
  Lock,
  Target,
  Sparkles,
  PhoneCall,
  Check,
  X,
  ExternalLink,
  BarChart3,
  Trash2,
} from 'lucide-react';
import ChatContainer from '@/components/chat/ChatContainer';
import PrivateShowMeterBanner from '@/components/stream/PrivateShowMeterBanner';
import BroadcastStudio from '@/components/stream/BroadcastStudio';
import StreamPollCard, { PollData } from '@/components/stream/StreamPollCard';
import { HapticsManager } from '@/lib/haptics/hapticsManager';

export default function StreamerStudioPage() {
  const { user } = useAuth();
  const [stream, setStream] = useState<any>(null);
  const [isLive, setIsLive] = useState(false);
  const [streamTitle, setStreamTitle] = useState('My Live Broadcast');
  const [category, setCategory] = useState('Gaming & Music');
  const [privateRate, setPrivateRate] = useState(60);

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

  // Video preview canvas
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Animated broadcast preview on canvas
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const draw = () => {
      t += 0.04;
      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = '#0d0f18';
      ctx.fillRect(0, 0, w, h);

      // Studio light beams
      const grad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w / 2);
      grad.addColorStop(0, isLive ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.05)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Waves
      ctx.strokeStyle = isLive ? '#a855f7' : '#4b5563';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < w; x += 10) {
        const y = h / 2 + Math.sin(t + x * 0.02) * (isLive ? 35 : 8);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Studio status text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(isLive ? '🔴 ON AIR - BROADCASTING' : 'CAMERA PREVIEW (OFFLINE)', w / 2, h / 2 + 60);

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [isLive]);

  // Load existing stream or setup socket listeners
  useEffect(() => {
    if (!user) return;

    // Check existing live stream for this streamer
    fetch('/api/stream/list')
      .then((res) => res.json())
      .then((data) => {
        if (data.streams) {
          const myStream = data.streams.find((s: any) => s.streamer.user.username === user.username);
          if (myStream) {
            setStream(myStream);
            setIsLive(myStream.status === 'LIVE' || myStream.status === 'PRIVATE');
            setIsPrivateActive(myStream.status === 'PRIVATE');
            setStreamTitle(myStream.title);

            // Fetch active poll for this stream
            fetch(`/api/stream/${myStream.id}/polls`)
              .then((r) => r.json())
              .then((pData) => {
                if (pData.poll) setActivePoll(pData.poll);
              })
              .catch(() => {});
          }
        }
      })
      .catch(() => {});
  }, [user]);

  // Socket for private show and poll signals
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

    // Auto-trigger interactive toy vibration upon viewer tips
    socket.on('tip_alert', (tipData: any) => {
      if (tipData && tipData.tokenAmount) {
        HapticsManager.getInstance().handleTipReceived(tipData.tokenAmount);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [stream, user]);

  const handleStartStream = async () => {
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
    }
  };

  const handleEndStream = async () => {
    if (!stream) return;
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
      setStream(null);
    } catch (e: any) {
      alert(e.message);
    }
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
    const cleanOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (cleanOptions.length < 2) {
      alert('Please provide at least 2 non-empty options for the poll.');
      return;
    }

    setIsPollSubmitting(true);
    try {
      const res = await fetch(`/api/stream/${stream.id}/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: pollQuestion.trim(),
          options: cleanOptions,
          tokenCost: Number(pollTokenCost) || 0,
        }),
      });
      const data = await res.json();
      if (res.ok && data.poll) {
        setActivePoll(data.poll);
        socketRef.current?.emit('poll_created', {
          streamId: stream.id,
          ...data.poll,
        });
        setPollQuestion('');
        setPollOptions(['', '']);
        setPollTokenCost(0);
      } else {
        alert(data.error || 'Failed to launch poll');
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
            <span>Broadcast Studio</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Control live camera feeds, tip menus, interactive goals, and private show requests</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/streamer/payouts"
            className="btn-glow-gold px-4 py-2 rounded-xl text-xs font-bold text-black flex items-center gap-1.5 shadow"
          >
            <Coins className="w-4 h-4" />
            <span>Earnings & Payouts ({user?.wallet?.earnedBalance ?? 0}🪙)</span>
          </Link>

          {stream && isLive && (
            <Link
              href={`/watch/${stream.id}`}
              target="_blank"
              className="px-3.5 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder hover:border-gray-600 text-xs font-semibold text-gray-300 flex items-center gap-1.5 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Preview Public Room</span>
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
        {/* Left (8 cols): Camera Feed & Live Controls */}
        <div className="lg:col-span-8 space-y-5">
          {/* Hardware Device Manager & LiveKit Publisher Studio */}
          <BroadcastStudio streamId={stream?.id || null} isLive={isLive} />

          {/* Broadcast Controls Bar */}
          <div className="p-5 rounded-2xl glass-panel border border-surfaceBorder space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400">Stream Title</label>
                <input
                  type="text"
                  disabled={isLive}
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  className="w-full sm:w-80 px-3.5 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-sm font-semibold focus:outline-none focus:border-brandPurple disabled:opacity-60"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400">Category</label>
                <select
                  disabled={isLive}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full sm:w-48 px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs font-medium focus:outline-none focus:border-brandPurple disabled:opacity-60"
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
                    className="btn-glow-purple px-6 py-2.5 rounded-xl text-xs font-black text-white flex items-center gap-2 shadow-lg"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Go Live Now</span>
                  </button>
                ) : (
                  <button
                    onClick={handleEndStream}
                    className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-black text-white flex items-center gap-2 transition shadow-lg"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Stop Broadcast</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Tooling: Tip Goal & Tip Menu Manager */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Create Room Tip Goal */}
            <div className="p-5 rounded-2xl glass-panel border border-surfaceBorder">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-tokenGold" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Set Community Tip Goal</h3>
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
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Add Priced Menu Action</h3>
              </div>

              <form onSubmit={handleAddMenuItem} className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Action name (e.g. Song Request)"
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
                    placeholder="Short description (optional)"
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
                    placeholder="e.g. Which hero or costume should I play next?"
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
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Another Option</span>
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

        {/* Right (4 cols): Studio Live Chat Monitor */}
        <div className="lg:col-span-4 h-[600px] lg:h-[calc(100vh-8rem)] sticky top-24">
          {stream ? (
            <ChatContainer streamId={stream.id} />
          ) : (
            <div className="h-full rounded-2xl glass-panel border border-surfaceBorder flex flex-col items-center justify-center text-center p-6 text-gray-500">
              <Radio className="w-8 h-8 text-gray-600 mb-2 animate-pulse" />
              <p className="text-xs font-bold text-gray-300">Live Chat Monitor</p>
              <p className="text-[11px] text-gray-400 mt-1 max-w-xs">Start your stream broadcast to monitor viewer chat in real-time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

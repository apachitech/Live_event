'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Megaphone,
  X,
  Coins,
  Sparkles,
  ExternalLink,
  Image as ImageIcon,
  Video as VideoIcon,
  Play,
  Volume2,
  VolumeX,
  FastForward,
  CheckCircle2,
  AlertCircle,
  Radio,
  Tv,
  MessageSquare,
  Layout,
  Plus,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AdPlacementType } from './AdPlacement';

interface UserCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newAd: any) => void;
}

export default function UserCampaignModal({ isOpen, onClose, onSuccess }: UserCampaignModalProps) {
  const { user, openPurchaseModal, refreshUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [publishPrice, setPublishPrice] = useState<number>(50);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [ctaText, setCtaText] = useState('Learn More');
  const [badge, setBadge] = useState('SPONSORED');
  const [placement, setPlacement] = useState<AdPlacementType>('FEED');
  const [durationSeconds, setDurationSeconds] = useState(15);
  const [skipOffsetSeconds, setSkipOffsetSeconds] = useState(5);

  // Simulator controls
  const [simMuted, setSimMuted] = useState(true);
  const [simCanSkip, setSimCanSkip] = useState(false);
  const [simSkipTimer, setSimSkipTimer] = useState(5);

  useEffect(() => {
    if (!isOpen || !user) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    fetch('/api/ads/campaigns')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPublishPrice(data.publishPriceTokens || 50);
          setUserBalance(data.userBalance || 0);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen, user]);

  // Simulator tick
  useEffect(() => {
    setSimCanSkip(skipOffsetSeconds === 0);
    setSimSkipTimer(skipOffsetSeconds);
  }, [placement, skipOffsetSeconds]);

  useEffect(() => {
    if (!isOpen || simCanSkip) return;
    const interval = setInterval(() => {
      setSimSkipTimer((prev) => {
        if (prev <= 1) {
          setSimCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, simCanSkip]);

  if (!isOpen) return null;

  // Strict guard: only logged-in users can run ad campaigns
  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
        <div className="w-full max-w-md rounded-3xl glass-panel border border-surfaceBorder bg-[#10111a] shadow-2xl p-6 sm:p-8 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brandPurple to-brandPink text-white mx-auto flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Login Required</h3>
            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
              Only logged-in users (Viewers, Streamers, and Agencies) can create and run advertising campaigns.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 pt-2">
            <Link
              href="/login"
              onClick={onClose}
              className="btn-glow-purple w-full py-3 rounded-xl text-xs font-black text-white flex items-center justify-center gap-2 shadow-lg hover:scale-105 transition"
            >
              Log In to Continue
            </Link>
            <Link
              href="/register"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-surfaceLight border border-surfaceBorder hover:bg-surfaceLight/80 text-xs font-bold text-gray-300 transition"
            >
              Sign Up (18+)
            </Link>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-gray-500 hover:text-gray-300 transition pt-1"
          >
            ✕ Close
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === 'ADMIN';
  const tokensRequired = isAdmin ? 0 : publishPrice;
  const hasEnoughTokens = isAdmin || userBalance >= tokensRequired;

  const applyInspiration = (type: 'creator' | 'gaming' | 'tokens' | 'agency') => {
    if (type === 'creator') {
      setTitle('Watch My Daily Interactive Shows');
      setDescription('Top music sessions, live Q&A, and interactive toy tipping!');
      setMediaType('IMAGE');
      setImageUrl('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800');
      setVideoUrl('');
      setTargetUrl('https://pulsestream.live/explore');
      setCtaText('Follow Streamer');
      setBadge('TOP CREATOR');
      setPlacement('FEED');
    } else if (type === 'gaming') {
      setTitle('Pro Esports Mouse & Controller Showcase');
      setDescription('Low latency gear for competitive multiplayer live streaming.');
      setMediaType('VIDEO');
      setVideoUrl('https://vjs.zencdn.net/v/oceans.mp4');
      setImageUrl('https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800');
      setTargetUrl('https://pulsestream.live');
      setCtaText('Get 20% Off');
      setBadge('GEAR DEAL');
      setPlacement('PRE_ROLL');
      setDurationSeconds(15);
      setSkipOffsetSeconds(5);
    } else if (type === 'tokens') {
      setTitle('Special Weekend Stream Pass & Bonus');
      setDescription('Exclusive VIP badges and priority private show chat.');
      setMediaType('IMAGE');
      setImageUrl('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800');
      setVideoUrl('');
      setTargetUrl('https://pulsestream.live/wallet');
      setCtaText('Unlock Pass');
      setBadge('LIMITED PASS');
      setPlacement('HEADER_TOP');
    } else if (type === 'agency') {
      setTitle('Join Our Verified Streamer Agency Roster');
      setDescription('Fast cashouts, verified blue checkmark, and promo boosts.');
      setMediaType('IMAGE');
      setImageUrl('https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800');
      setVideoUrl('');
      setTargetUrl('https://pulsestream.live/agency/register');
      setCtaText('Join Agency');
      setBadge('AGENCY ROSTER');
      setPlacement('STREAM_CHAT');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetUrl.trim()) {
      setErrorMsg('Title and Target Link are required.');
      return;
    }

    if (mediaType === 'VIDEO' && !videoUrl.trim() && !imageUrl.trim()) {
      setErrorMsg('Please provide a Video URL or preview thumbnail image.');
      return;
    }

    if (mediaType === 'IMAGE' && !imageUrl.trim()) {
      setErrorMsg('Please provide a Creative Image URL.');
      return;
    }

    if (!hasEnoughTokens) {
      setErrorMsg(`Insufficient token balance. You need ${tokensRequired} Tokens.`);
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/ads/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description.trim() || null,
          mediaType,
          imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800',
          videoUrl: videoUrl.trim() || null,
          targetUrl,
          ctaText: ctaText.trim() || 'Learn More',
          badge: badge.trim() || 'SPONSORED',
          placement,
          durationSeconds: Number(durationSeconds),
          skipOffsetSeconds: Number(skipOffsetSeconds),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Campaign published successfully!');
        setUserBalance(data.remainingBalance);
        if (refreshUser) refreshUser();
        if (onSuccess) onSuccess(data.ad);
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setErrorMsg(data.error || 'Failed to publish campaign.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl rounded-3xl glass-panel border border-surfaceBorder bg-[#10111a] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-surfaceBorder flex items-center justify-between shrink-0 bg-surface/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-brandPurple to-brandPink text-white shadow-lg shadow-purple-500/20">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">Launch Sponsored Ad Campaign</h3>
                <span className="px-2 py-0.5 rounded-full bg-brandPurple/20 text-brandPurple text-[10px] font-black uppercase">
                  {user.role === 'VIEWER' ? 'Viewer Sponsor' : user.role === 'AGENCY' ? 'Agency Campaign' : user.role === 'STREAMER' ? 'Creator Promo' : 'Admin Campaign'}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Promote your brand, social links, or stream event across live video players, chat, and feeds.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xs font-bold p-2 rounded-xl hover:bg-surfaceLight"
          >
            ✕ Close
          </button>
        </div>

        {/* Token Pricing & Wallet Balance Ribbon */}
        <div className="px-6 py-3.5 bg-surfaceLight/40 border-b border-surfaceBorder flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-400 font-medium">Publishing Cost:</span>
              <span className="font-black text-tokenGold flex items-center gap-1 bg-tokenGold/10 px-2 py-0.5 rounded-lg border border-tokenGold/20">
                <Coins className="w-3.5 h-3.5" />
                <span>{tokensRequired} Tokens</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-400 font-medium">Your Balance:</span>
              <span className={`font-black flex items-center gap-1 px-2 py-0.5 rounded-lg border ${
                hasEnoughTokens
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
              }`}>
                <Coins className="w-3.5 h-3.5" />
                <span>{userBalance} Tokens</span>
              </span>
            </div>
          </div>

          {!hasEnoughTokens && (
            <button
              type="button"
              onClick={() => openPurchaseModal()}
              className="btn-glow-purple px-3.5 py-1.5 rounded-xl text-xs font-black text-white flex items-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Get Tokens (+ Top Up)</span>
            </button>
          )}
        </div>

        {/* Quick Inspiration Presets */}
        <div className="px-6 py-2.5 bg-black/40 border-b border-surfaceBorder/60 flex items-center gap-2 flex-wrap shrink-0">
          <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-tokenGold" />
            <span>Templates:</span>
          </span>
          <button
            type="button"
            onClick={() => applyInspiration('creator')}
            className="px-2 py-0.5 rounded-md bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/20 transition"
          >
            🎨 Creator Spotlight
          </button>
          <button
            type="button"
            onClick={() => applyInspiration('gaming')}
            className="px-2 py-0.5 rounded-md bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 text-[10px] font-bold border border-pink-500/20 transition"
          >
            🎮 Pre-Roll Video Promo
          </button>
          <button
            type="button"
            onClick={() => applyInspiration('tokens')}
            className="px-2 py-0.5 rounded-md bg-tokenGold/10 hover:bg-tokenGold/20 text-tokenGold text-[10px] font-bold border border-tokenGold/20 transition"
          >
            🪙 Header Marquee
          </button>
          <button
            type="button"
            onClick={() => applyInspiration('agency')}
            className="px-2 py-0.5 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/20 transition"
          >
            🏢 Agency Chat Pin
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Body: Form + Live Simulator */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Form (7 Cols) */}
          <form id="campaign-form" onSubmit={handleSubmit} className="md:col-span-7 space-y-4">
            {/* Media Type */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-300">Format *</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setMediaType('IMAGE')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
                    mediaType === 'IMAGE'
                      ? 'bg-brandPurple/20 border-brandPurple text-white'
                      : 'bg-surfaceLight border-surfaceBorder text-gray-400 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-4 h-4 text-blue-400" />
                  <span>Image Banner</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType('VIDEO')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
                    mediaType === 'VIDEO'
                      ? 'bg-pink-600/20 border-pink-500 text-white'
                      : 'bg-surfaceLight border-surfaceBorder text-gray-400 hover:text-white'
                  }`}
                >
                  <VideoIcon className="w-4 h-4 text-pink-400" />
                  <span>Video Ad (Pre-Roll)</span>
                </button>
              </div>
            </div>

            {/* Placement */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-300">Where will this appear? *</label>
              <select
                value={placement}
                onChange={(e: any) => setPlacement(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple"
              >
                <option value="PRE_ROLL">📺 In-Player Pre-Roll Video Ad (Plays before live stream)</option>
                <option value="PLAYER_OVERLAY">🎦 Live Stream Lower-Third Player Overlay</option>
                <option value="HEADER_TOP">📢 Top Platform Marquee Banner (Sticky header)</option>
                <option value="STREAM_CHAT">💬 Pinned Live Stream Chat Sponsor Card</option>
                <option value="DIRECTORY">✨ Live Directory Hero Billboard</option>
                <option value="VOD_DIRECTORY">🎬 VOD Replay Catalog Showcase</option>
                <option value="FEED">📱 Explore Swipe Feed Card</option>
                <option value="WATCH">👀 Watch Page Companion Card</option>
              </select>
            </div>

            {/* Title & Badge */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-gray-300">Campaign Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My Special Live Event"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300">Badge</label>
                <input
                  type="text"
                  placeholder="SPONSORED"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple uppercase font-bold"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-300">Description / Subtitle</label>
              <input
                type="text"
                placeholder="Highlight your offer, channel, or promotion..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple"
              />
            </div>

            {/* Video Controls if Video */}
            {mediaType === 'VIDEO' && (
              <div className="p-3.5 rounded-xl bg-pink-950/20 border border-pink-500/30 space-y-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-pink-300">Video Source URL (MP4/WebM) *</label>
                  <input
                    type="url"
                    required={mediaType === 'VIDEO'}
                    placeholder="https://.../ad.mp4"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-pink-500/30 text-white text-xs font-mono focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-300">Duration (s)</label>
                    <input
                      type="number"
                      min={5}
                      max={60}
                      value={durationSeconds}
                      onChange={(e) => setDurationSeconds(parseInt(e.target.value, 10) || 15)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-surfaceBorder text-white text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-300">Skip After (s)</label>
                    <input
                      type="number"
                      min={0}
                      max={durationSeconds}
                      value={skipOffsetSeconds}
                      onChange={(e) => setSkipOffsetSeconds(parseInt(e.target.value, 10) || 5)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-surfaceBorder text-white text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Creative Image */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-300">
                {mediaType === 'VIDEO' ? 'Fallback Thumbnail URL' : 'Creative Image Banner URL *'}
              </label>
              <input
                type="url"
                required={mediaType === 'IMAGE'}
                placeholder="https://images.unsplash.com/..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs font-mono focus:outline-none focus:border-brandPurple"
              />
            </div>

            {/* Target URL & CTA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300">Target Link URL *</label>
                <input
                  type="text"
                  required
                  placeholder="https://... or /explore"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs font-mono focus:outline-none focus:border-brandPurple"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300">CTA Button Text *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Claim Offer, Visit"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple"
                />
              </div>
            </div>
          </form>

          {/* Live Simulator (5 Cols) */}
          <div className="md:col-span-5 space-y-2.5 flex flex-col">
            <div className="flex items-center justify-between text-xs font-bold text-gray-300">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-tokenGold" />
                <span>Live Appearance Preview</span>
              </span>
              <span className="text-[10px] text-pink-400 font-mono uppercase">{placement}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/75 border border-surfaceBorder flex-1 flex flex-col justify-center min-h-[300px] overflow-hidden relative shadow-inner">
              {placement === 'PRE_ROLL' ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/20 shadow-xl flex flex-col justify-between">
                  {mediaType === 'VIDEO' && videoUrl ? (
                    <video src={videoUrl} autoPlay loop muted={simMuted} playsInline className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <img src={imageUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800'} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
                  )}
                  <div className="relative z-10 p-2 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
                    <span className="px-2 py-0.5 rounded bg-yellow-500 text-black text-[9px] font-black uppercase">
                      {badge || 'AD'} • {durationSeconds}s
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white text-black text-[9px] font-black flex items-center gap-1">
                      <span>{ctaText || 'Learn More'}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </span>
                  </div>
                  <div className="relative z-10 p-2 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent">
                    <button type="button" onClick={() => setSimMuted(!simMuted)} className="p-1 rounded bg-black/60 text-white text-[10px]">
                      {simMuted ? <VolumeX className="w-3 h-3 text-pink-400" /> : <Volume2 className="w-3 h-3 text-emerald-400" />}
                    </button>
                    {simCanSkip ? (
                      <span className="px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-brandPurple to-brandPink text-white text-[10px] font-black flex items-center gap-1">
                        Skip Ad ⏭
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg bg-black/70 text-gray-300 text-[9px]">
                        Skip in {simSkipTimer}s
                      </span>
                    )}
                  </div>
                </div>
              ) : placement === 'HEADER_TOP' ? (
                <div className="w-full bg-gradient-to-r from-brandPurple via-pink-600 to-purple-900 text-white text-xs py-2 px-3 rounded-xl flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-1.5 py-0.2 rounded bg-black/40 text-[9px] font-black uppercase text-pink-300">
                      {badge || 'SPONSORED'}
                    </span>
                    <span className="font-bold text-[11px] truncate">{title || 'Your Announcement'}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white text-purple-900 text-[10px] font-black shrink-0">
                    {ctaText || 'Learn More'}
                  </span>
                </div>
              ) : placement === 'STREAM_CHAT' ? (
                <div className="w-full max-w-xs mx-auto p-2.5 rounded-xl bg-[#1b1c2e] border border-brandPurple/30 space-y-1.5 shadow-lg">
                  <span className="text-[9px] font-black text-brandPurple uppercase">{badge || 'SPONSORED'}</span>
                  <div className="flex items-center gap-2">
                    <img src={imageUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200'} alt="ad" className="w-7 h-7 rounded object-cover" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[11px] font-bold text-white truncate">{title || 'Ad Title'}</h4>
                      <p className="text-[10px] text-gray-300 truncate">{description || 'Offer details'}</p>
                    </div>
                  </div>
                  <div className="w-full py-1 rounded bg-gradient-to-r from-brandPurple to-brandPink text-white text-[10px] font-bold text-center">
                    {ctaText || 'Learn More'}
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-xs mx-auto p-3 rounded-xl bg-surfaceLight/80 border border-surfaceBorder space-y-2 shadow-lg">
                  <span className="px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-400 text-[9px] font-black uppercase">
                    {badge || 'SPONSORED'}
                  </span>
                  <div className="w-full aspect-video rounded-lg overflow-hidden bg-black">
                    {mediaType === 'VIDEO' && videoUrl ? (
                      <video src={videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                    ) : (
                      <img src={imageUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400'} alt="thumb" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">{title || 'Campaign Title'}</h4>
                  <div className="w-full py-1.5 rounded-lg bg-gradient-to-r from-brandPurple to-brandPink text-white text-[11px] font-bold text-center">
                    {ctaText || 'Learn More'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-surfaceBorder bg-surface/50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-gray-400 text-center sm:text-left">
            {hasEnoughTokens ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5 justify-center sm:justify-start">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Tokens verified. Ready to publish immediately.</span>
              </span>
            ) : (
              <span className="text-rose-400 font-semibold flex items-center gap-1.5 justify-center sm:justify-start">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Insufficient tokens ({userBalance}/{tokensRequired}). Top up wallet first.</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-surfaceLight hover:bg-surfaceLight/80 text-gray-300 text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="campaign-form"
              disabled={submitting || !hasEnoughTokens}
              className="btn-glow-purple px-6 py-2.5 rounded-xl text-xs font-black text-white flex items-center gap-2 shadow-lg hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Coins className="w-4 h-4 text-tokenGold" />
              <span>
                {submitting
                  ? 'Processing Tokens...'
                  : isAdmin
                  ? 'Publish Campaign (Admin Free)'
                  : `Spend ${tokensRequired} Tokens & Launch`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

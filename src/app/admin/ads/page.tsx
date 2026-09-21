'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Megaphone,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  Eye,
  MousePointer,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Image as ImageIcon,
  Video as VideoIcon,
  Play,
  Volume2,
  VolumeX,
  FastForward,
  X,
  Sparkles,
  Layout,
  Radio,
  Tv,
  MessageSquare,
  Search,
  Filter,
  Coins,
} from 'lucide-react';

export type AdPlacementType =
  | 'FEED'
  | 'DIRECTORY'
  | 'WATCH'
  | 'PRE_ROLL'
  | 'PLAYER_OVERLAY'
  | 'STREAM_CHAT'
  | 'HEADER_TOP'
  | 'VOD_DIRECTORY';

export interface Advertisement {
  id: string;
  title: string;
  description?: string | null;
  mediaType: 'IMAGE' | 'VIDEO';
  imageUrl: string;
  videoUrl?: string | null;
  targetUrl: string;
  ctaText: string;
  badge?: string | null;
  placement: AdPlacementType;
  durationSeconds?: number | null;
  skipOffsetSeconds?: number | null;
  creatorUserId?: string | null;
  creatorUser?: {
    id: string;
    username: string;
    role: string;
    avatarUrl?: string | null;
  } | null;
  tokensSpent?: number;
  active: boolean;
  clicks: number;
  impressions: number;
  createdAt: string;
  updatedAt?: string;
}

const PLACEMENT_LABELS: Record<AdPlacementType, { label: string; desc: string; icon: any }> = {
  PRE_ROLL: {
    label: 'In-Player Pre-Roll Video',
    desc: 'Plays before the live broadcast begins with countdown & skip timer',
    icon: Tv,
  },
  PLAYER_OVERLAY: {
    label: 'Live Player Lower-Third Overlay',
    desc: 'Semi-transparent interactive banner on top of the live video stream',
    icon: Play,
  },
  HEADER_TOP: {
    label: 'Top Platform Marquee Banner',
    desc: 'Dismissible top-of-page announcement across the entire site',
    icon: Megaphone,
  },
  STREAM_CHAT: {
    label: 'Pinned Live Stream Chat Card',
    desc: 'Sticky sponsored prompt at the top of the live chat room',
    icon: MessageSquare,
  },
  DIRECTORY: {
    label: 'Live Directory Hero Showcase',
    desc: 'Wide interactive showcase banner in the live stream directory',
    icon: Layout,
  },
  VOD_DIRECTORY: {
    label: 'VOD & Replay Catalog Showcase',
    desc: 'Featured promotional billboard on the /vods video catalog',
    icon: VideoIcon,
  },
  FEED: {
    label: 'Explore Swipe Feed Card',
    desc: 'Interactive full-height sponsored card inserted in swipe feeds',
    icon: Radio,
  },
  WATCH: {
    label: 'Stream Watch Companion Card',
    desc: 'Sidebar interactive widget alongside the stream player',
    icon: Layout,
  },
};

export default function AdminAdvertisementsPage() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlacement, setFilterPlacement] = useState<string>('ALL');
  const [filterMediaType, setFilterMediaType] = useState<string>('ALL');

  // Admin Token Price Setting State
  const [tokenPrice, setTokenPrice] = useState<number>(50);
  const [tokenPriceInput, setTokenPriceInput] = useState<string>('50');
  const [savingPrice, setSavingPrice] = useState(false);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [adToDelete, setAdToDelete] = useState<Advertisement | null>(null);

  // Form State
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
  const [active, setActive] = useState(true);

  // Live Preview Simulator State inside modal
  const [simMuted, setSimMuted] = useState(true);
  const [simPlaying, setSimPlaying] = useState(true);
  const [simSkipTimer, setSimSkipTimer] = useState(5);
  const [simCanSkip, setSimCanSkip] = useState(false);
  const [simDismissed, setSimDismissed] = useState(false);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/advertisements');
      const data = await res.json();
      if (data.success && data.ads) {
        setAds(data.ads);
        if (data.publishPriceTokens !== undefined) {
          setTokenPrice(data.publishPriceTokens);
          setTokenPriceInput(String(data.publishPriceTokens));
        }
      }
    } catch {
      showNotice('error', 'Failed to load advertisements');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTokenPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseInt(tokenPriceInput, 10);
    if (isNaN(price) || price < 0) {
      showNotice('error', 'Please enter a valid token price (>= 0)');
      return;
    }

    setSavingPrice(true);
    try {
      const res = await fetch('/api/admin/advertisements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenPrice: price }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTokenPrice(data.tokenPrice);
        setTokenPriceInput(String(data.tokenPrice));
        showNotice('success', `Campaign publishing price updated to ${data.tokenPrice} Tokens!`);
      } else {
        showNotice('error', data.error || 'Failed to update token price');
      }
    } catch (err: any) {
      showNotice('error', err.message || 'Network error');
    } finally {
      setSavingPrice(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const showNotice = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Reset simulator countdown whenever modal opens or placement changes
  useEffect(() => {
    setSimDismissed(false);
    setSimCanSkip(skipOffsetSeconds === 0);
    setSimSkipTimer(skipOffsetSeconds);
  }, [placement, skipOffsetSeconds, showModal]);

  // Simulator skip timer tick
  useEffect(() => {
    if (!showModal || simCanSkip) return;
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
  }, [showModal, simCanSkip]);

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingAdId(null);
    setTitle('');
    setDescription('');
    setMediaType('IMAGE');
    setImageUrl('https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800');
    setVideoUrl('');
    setTargetUrl('https://pulsestream.live');
    setCtaText('Learn More');
    setBadge('SPONSORED');
    setPlacement('FEED');
    setDurationSeconds(15);
    setSkipOffsetSeconds(5);
    setActive(true);
    setShowModal(true);
  };

  const openEditModal = (ad: Advertisement) => {
    setIsEditing(true);
    setEditingAdId(ad.id);
    setTitle(ad.title);
    setDescription(ad.description || '');
    setMediaType(ad.mediaType || 'IMAGE');
    setImageUrl(ad.imageUrl || '');
    setVideoUrl(ad.videoUrl || '');
    setTargetUrl(ad.targetUrl);
    setCtaText(ad.ctaText || 'Learn More');
    setBadge(ad.badge || 'SPONSORED');
    setPlacement(ad.placement);
    setDurationSeconds(ad.durationSeconds || 15);
    setSkipOffsetSeconds(ad.skipOffsetSeconds !== undefined && ad.skipOffsetSeconds !== null ? ad.skipOffsetSeconds : 5);
    setActive(ad.active);
    setShowModal(true);
  };

  // Preset Template loader
  const applyPreset = (preset: 'festival' | 'tokens' | 'preroll' | 'agency') => {
    if (preset === 'preroll') {
      setTitle('Razer BlackShark Pro Headset — Ultra Latency');
      setDescription('Crystal-clear spatial audio tuned for top esports live streams.');
      setMediaType('VIDEO');
      setVideoUrl('https://vjs.zencdn.net/v/oceans.mp4');
      setImageUrl('https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800');
      setTargetUrl('https://pulsestream.live');
      setCtaText('Shop Deal 30% Off');
      setBadge('SPECIAL OFFER');
      setPlacement('PRE_ROLL');
      setDurationSeconds(15);
      setSkipOffsetSeconds(5);
    } else if (preset === 'tokens') {
      setTitle('Weekend Flash Sale: +50% Bonus Tokens');
      setDescription('Unlock exclusive creator PPV replays and interactive toy tip tips!');
      setMediaType('IMAGE');
      setImageUrl('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800');
      setVideoUrl('');
      setTargetUrl('https://pulsestream.live/wallet');
      setCtaText('Claim Bonus Tokens');
      setBadge('LIMITED PROMO');
      setPlacement('HEADER_TOP');
    } else if (preset === 'festival') {
      setTitle('PulseStream Global Creator Festival 2026');
      setDescription('Join 500+ top verified streamers in our biggest interactive event yet.');
      setMediaType('VIDEO');
      setVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
      setImageUrl('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800');
      setTargetUrl('https://pulsestream.live/explore');
      setCtaText('Watch Festival');
      setBadge('LIVE EVENT');
      setPlacement('DIRECTORY');
    } else if (preset === 'agency') {
      setTitle('Elite Streamer Agency Talent Search');
      setDescription('Fast-track your revenue share, verified badges, and manager support.');
      setMediaType('IMAGE');
      setImageUrl('https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800');
      setVideoUrl('');
      setTargetUrl('https://pulsestream.live/agency/register');
      setCtaText('Apply as Agency');
      setBadge('OFFICIAL PARTNER');
      setPlacement('STREAM_CHAT');
    }
  };

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetUrl.trim()) {
      showNotice('error', 'Please fill in Title and Target URL');
      return;
    }

    if (mediaType === 'VIDEO' && !videoUrl.trim() && !imageUrl.trim()) {
      showNotice('error', 'Please provide a Video URL or fallback image for video ad');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
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
        active,
      };

      const url = '/api/admin/advertisements';
      const method = isEditing ? 'PUT' : 'POST';
      const body = isEditing ? JSON.stringify({ id: editingAdId, ...payload }) : JSON.stringify(payload);

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotice('success', isEditing ? 'Advertisement updated successfully!' : 'Advertisement published successfully!');
        setShowModal(false);
        fetchAds();
      } else {
        showNotice('error', data.error || 'Failed to save advertisement');
      }
    } catch (err: any) {
      showNotice('error', err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (ad: Advertisement) => {
    try {
      const res = await fetch('/api/admin/advertisements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ad.id,
          active: !ad.active,
        }),
      });

      if (res.ok) {
        setAds((prev) =>
          prev.map((item) => (item.id === ad.id ? { ...item, active: !item.active } : item))
        );
        showNotice('success', `Ad status switched to ${!ad.active ? 'Active' : 'Paused'}`);
      } else {
        const d = await res.json();
        showNotice('error', d.error || 'Failed to update ad status');
      }
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!adToDelete) return;

    try {
      const res = await fetch(`/api/admin/advertisements?id=${adToDelete.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setAds((prev) => prev.filter((a) => a.id !== adToDelete.id));
        showNotice('success', 'Advertisement removed');
        setAdToDelete(null);
      } else {
        const d = await res.json();
        showNotice('error', d.error || 'Failed to delete advertisement');
      }
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  // Filtered ads
  const filteredAds = ads.filter((ad) => {
    const matchesSearch =
      ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ad.targetUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ad.badge && ad.badge.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;

    if (filterPlacement !== 'ALL' && ad.placement !== filterPlacement) return false;
    if (filterMediaType !== 'ALL' && ad.mediaType !== filterMediaType) return false;

    return true;
  });

  const totalImpressions = ads.reduce((acc, a) => acc + a.impressions, 0);
  const totalClicks = ads.reduce((acc, a) => acc + a.clicks, 0);
  const overallCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
  const videoAdsCount = ads.filter((a) => a.mediaType === 'VIDEO').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surfaceBorder">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder hover:border-gray-600 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                <Megaphone className="w-6 h-6 text-brandPurple" />
                <span>Interactive Advertisement Hub</span>
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-brandPurple/20 text-brandPurple text-[10px] font-black tracking-wider uppercase border border-brandPurple/30">
                Video & Multi-Placement CRUD
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Deploy in-player pre-roll video ads, live lower-third overlays, top header marquees, and swipe cards with real-time preview simulation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAds}
            disabled={loading}
            className="p-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder hover:border-gray-600 text-gray-400 hover:text-white transition"
            title="Refresh advertisements"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brandPurple' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="btn-glow-purple px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-lg hover:scale-105 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Advertisement</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-lg ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Admin Token Price Configuration Banner */}
      <div className="p-5 rounded-2xl glass-panel border border-tokenGold/30 bg-gradient-to-r from-tokenGold/10 via-surface/60 to-purple-950/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-tokenGold/5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-tokenGold/20 border border-tokenGold/30 flex items-center justify-center shrink-0 text-tokenGold">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Campaign Publishing Token Price</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-tokenGold/20 text-tokenGold border border-tokenGold/30 uppercase tracking-wider">
                Live Pricing
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Set the token cost required for Viewers, Streamers, and Agencies to publish an advertising campaign.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveTokenPrice} className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-tokenGold font-bold text-xs">🪙</span>
            <input
              type="number"
              min="0"
              value={tokenPriceInput}
              onChange={(e) => setTokenPriceInput(e.target.value)}
              className="w-32 pl-8 pr-3 py-2 bg-surfaceLight border border-surfaceBorder rounded-xl text-sm font-black text-tokenGold focus:outline-none focus:border-tokenGold/50"
              placeholder="Price"
              required
            />
          </div>
          <button
            type="submit"
            disabled={savingPrice || parseInt(tokenPriceInput, 10) === tokenPrice}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-tokenGold to-amber-500 text-black font-extrabold text-xs shadow-md shadow-tokenGold/20 hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {savingPrice ? 'Saving...' : 'Update Price'}
          </button>
        </form>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl glass-panel border border-surfaceBorder">
          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-1.5">
            <span>Active Campaigns</span>
            <Megaphone className="w-4 h-4 text-brandPurple" />
          </div>
          <div className="text-2xl font-black text-white">
            {ads.filter((a) => a.active).length}{' '}
            <span className="text-xs text-gray-500 font-normal">/ {ads.length}</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Live in feeds & video player</p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-surfaceBorder">
          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-1.5">
            <span>Video Ad Campaigns</span>
            <VideoIcon className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-2xl font-black text-pink-400">{videoAdsCount}</div>
          <p className="text-[11px] text-gray-400 mt-1">Pre-rolls & stream overlays</p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-surfaceBorder">
          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-1.5">
            <span>Total Impressions</span>
            <Eye className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">{totalImpressions.toLocaleString()}</div>
          <p className="text-[11px] text-gray-400 mt-1">Views across placements</p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-surfaceBorder">
          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-1.5">
            <span>Total Clicks</span>
            <MousePointer className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{totalClicks.toLocaleString()}</div>
          <p className="text-[11px] text-gray-400 mt-1">Outbound & internal referrals</p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-surfaceBorder">
          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-1.5">
            <span>Platform CTR</span>
            <TrendingUp className="w-4 h-4 text-tokenGold" />
          </div>
          <div className="text-2xl font-black text-tokenGold">{overallCtr}%</div>
          <p className="text-[11px] text-gray-400 mt-1">Avg conversion performance</p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-4 rounded-2xl glass-panel border border-surfaceBorder flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search campaigns, target links, or badges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-brandPurple transition"
          />
        </div>

        {/* Placement Filter & Media Type Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Placement:</span>
          </div>
          <select
            value={filterPlacement}
            onChange={(e) => setFilterPlacement(e.target.value)}
            className="px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple"
          >
            <option value="ALL">All Placements (8)</option>
            <option value="PRE_ROLL">Pre-Roll Video</option>
            <option value="PLAYER_OVERLAY">Player Overlay</option>
            <option value="HEADER_TOP">Header Marquee</option>
            <option value="STREAM_CHAT">Stream Chat Card</option>
            <option value="DIRECTORY">Live Directory</option>
            <option value="VOD_DIRECTORY">VOD Directory</option>
            <option value="FEED">Explore Swipe Feed</option>
            <option value="WATCH">Watch Companion</option>
          </select>

          <select
            value={filterMediaType}
            onChange={(e) => setFilterMediaType(e.target.value)}
            className="px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple"
          >
            <option value="ALL">All Media Types</option>
            <option value="IMAGE">Images Only</option>
            <option value="VIDEO">Videos Only</option>
          </select>
        </div>
      </div>

      {/* Ads Catalog Table */}
      <div className="p-6 rounded-2xl glass-panel border border-surfaceBorder space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">All Advertisements & Creatives</h2>
            <p className="text-xs text-gray-400">Showing {filteredAds.length} of {ads.length} campaigns</p>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-gray-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-brandPurple" />
            <span>Loading advertisements...</span>
          </div>
        ) : filteredAds.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-brandPurple/10 text-brandPurple flex items-center justify-center mx-auto">
              <Megaphone className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">No advertisements found</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              {searchQuery || filterPlacement !== 'ALL' || filterMediaType !== 'ALL'
                ? 'Try clearing your filters or search term to view existing campaigns.'
                : 'Create your first sponsored video or image campaign to start monetizing platform views.'}
            </p>
            <button
              onClick={openCreateModal}
              className="btn-glow-purple px-5 py-2.5 rounded-xl text-xs font-bold text-white"
            >
              Create New Advertisement
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="text-[11px] text-gray-400 uppercase border-b border-surfaceBorder">
                <tr>
                  <th className="py-3 px-2">Creative & Campaign</th>
                  <th className="py-3 px-2">Creator</th>
                  <th className="py-3 px-2">Type</th>
                  <th className="py-3 px-2">Placement</th>
                  <th className="py-3 px-2">Tokens Paid</th>
                  <th className="py-3 px-2">Interactive CTA</th>
                  <th className="py-3 px-2">Impressions</th>
                  <th className="py-3 px-2">Clicks</th>
                  <th className="py-3 px-2">CTR</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surfaceBorder/60">
                {filteredAds.map((ad) => {
                  const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : '0.0';
                  const placementInfo = PLACEMENT_LABELS[ad.placement] || {
                    label: ad.placement,
                    desc: '',
                    icon: Megaphone,
                  };
                  const PlacementIcon = placementInfo.icon;

                  return (
                    <tr key={ad.id} className="hover:bg-surfaceLight/30 transition">
                      {/* Creative & Title */}
                      <td className="py-3.5 px-2">
                        <div className="flex items-center gap-3">
                          <div className="relative w-16 h-11 rounded-lg overflow-hidden bg-black border border-surfaceBorder shrink-0">
                            {ad.mediaType === 'VIDEO' ? (
                              <div className="w-full h-full relative flex items-center justify-center bg-purple-950/40">
                                {ad.imageUrl ? (
                                  <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                                ) : (
                                  <VideoIcon className="w-5 h-5 text-pink-400" />
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <Play className="w-3.5 h-3.5 text-white fill-white" />
                                </div>
                              </div>
                            ) : (
                              <img
                                src={ad.imageUrl}
                                alt={ad.title}
                                className="w-full h-full object-cover"
                                onError={(e: any) => {
                                  e.target.src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200';
                                }}
                              />
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <div className="flex items-center gap-1.5">
                              {ad.badge && (
                                <span className="px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-400 text-[9px] font-black uppercase">
                                  {ad.badge}
                                </span>
                              )}
                              <span className="font-bold text-white block truncate">{ad.title}</span>
                            </div>
                            {ad.description && (
                              <p className="text-[11px] text-gray-400 truncate">{ad.description}</p>
                            )}
                            <a
                              href={ad.targetUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-brandPurple hover:underline flex items-center gap-1 truncate mt-0.5"
                            >
                              <span>{ad.targetUrl}</span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            </a>
                          </div>
                        </div>
                      </td>

                      {/* Creator */}
                      <td className="py-3.5 px-2">
                        {ad.creatorUser ? (
                          <div className="flex flex-col">
                            <span className="font-semibold text-white truncate max-w-[120px]">
                              {ad.creatorUser.username}
                            </span>
                            <span
                              className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded w-fit mt-0.5 ${
                                ad.creatorUser.role === 'STREAMER'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : ad.creatorUser.role === 'AGENCY'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : ad.creatorUser.role === 'ADMIN'
                                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}
                            >
                              {ad.creatorUser.role}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 font-medium italic">
                            Platform Admin
                          </span>
                        )}
                      </td>

                      {/* Media Type */}
                      <td className="py-3.5 px-2">
                        {ad.mediaType === 'VIDEO' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                            <VideoIcon className="w-3 h-3" />
                            <span>Video ({ad.durationSeconds || 15}s)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            <ImageIcon className="w-3 h-3" />
                            <span>Image</span>
                          </span>
                        )}
                      </td>

                      {/* Placement */}
                      <td className="py-3.5 px-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          <PlacementIcon className="w-3 h-3" />
                          <span>{placementInfo.label}</span>
                        </span>
                      </td>

                      {/* Tokens Paid */}
                      <td className="py-3.5 px-2 font-mono">
                        {(ad.tokensSpent ?? 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 text-tokenGold font-bold">
                            <Coins className="w-3 h-3" />
                            <span>{ad.tokensSpent}</span>
                          </span>
                        ) : (
                          <span className="text-gray-500 text-[10px]">Free (0)</span>
                        )}
                      </td>

                      {/* CTA */}
                      <td className="py-3.5 px-2 font-semibold text-gray-200">
                        <span className="px-2 py-1 rounded-md bg-surfaceLight border border-surfaceBorder text-[11px]">
                          {ad.ctaText || 'Learn More'}
                        </span>
                      </td>

                      {/* Stats */}
                      <td className="py-3.5 px-2 font-mono text-gray-300">
                        {ad.impressions.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-2 font-mono text-emerald-400 font-bold">
                        {ad.clicks.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-2 font-mono text-tokenGold font-bold">{ctr}%</td>

                      {/* Active Status */}
                      <td className="py-3.5 px-2">
                        <button
                          onClick={() => handleToggleActive(ad)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition flex items-center gap-1.5 ${
                            ad.active
                              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
                              : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700 border border-gray-600'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${ad.active ? 'bg-emerald-400' : 'bg-gray-500'}`}
                          />
                          <span>{ad.active ? 'Active' : 'Paused'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(ad)}
                            className="p-1.5 rounded-lg bg-surfaceLight hover:bg-brandPurple/20 text-gray-400 hover:text-white transition"
                            title="Edit advertisement"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setAdToDelete(ad)}
                            className="p-1.5 rounded-lg bg-surfaceLight hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition"
                            title="Delete advertisement"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE & EDIT MODAL WITH LIVE PREVIEW SIMULATOR */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-5xl rounded-3xl glass-panel border border-surfaceBorder bg-[#11121d] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-surfaceBorder flex items-center justify-between shrink-0 bg-surface/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-brandPurple/20 text-brandPurple">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {isEditing ? 'Edit Advertisement Campaign' : 'Create Interactive Advertisement'}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Configure creative assets, video parameters, interactive CTA, and placement.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white text-xs font-bold p-2 rounded-xl hover:bg-surfaceLight"
              >
                ✕ Close
              </button>
            </div>

            {/* Quick Inspiration Presets */}
            <div className="px-6 py-3 bg-surfaceLight/30 border-b border-surfaceBorder/60 flex items-center gap-2 flex-wrap shrink-0">
              <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-tokenGold" />
                <span>Quick Templates:</span>
              </span>
              <button
                type="button"
                onClick={() => applyPreset('preroll')}
                className="px-2.5 py-1 rounded-lg bg-pink-500/10 border border-pink-500/30 hover:bg-pink-500/20 text-[11px] text-pink-300 font-semibold transition"
              >
                🎬 Esports Pre-Roll Video
              </button>
              <button
                type="button"
                onClick={() => applyPreset('tokens')}
                className="px-2.5 py-1 rounded-lg bg-tokenGold/10 border border-tokenGold/30 hover:bg-tokenGold/20 text-[11px] text-tokenGold font-semibold transition"
              >
                🪙 50% Token Sale Banner
              </button>
              <button
                type="button"
                onClick={() => applyPreset('festival')}
                className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-[11px] text-purple-300 font-semibold transition"
              >
                🎉 Creator Festival Showcase
              </button>
              <button
                type="button"
                onClick={() => applyPreset('agency')}
                className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-[11px] text-blue-300 font-semibold transition"
              >
                🏢 Agency Chat Pinned Card
              </button>
            </div>

            {/* Modal Body: Split Form + Live Interactive Preview */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Form (7 Cols) */}
              <form id="ad-form" onSubmit={handleSaveAd} className="lg:col-span-7 space-y-4">
                {/* Media Type Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">Creative Media Type *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMediaType('IMAGE')}
                      className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
                        mediaType === 'IMAGE'
                          ? 'bg-brandPurple/20 border-brandPurple text-white shadow-md'
                          : 'bg-surfaceLight border-surfaceBorder text-gray-400 hover:text-white'
                      }`}
                    >
                      <ImageIcon className="w-4 h-4 text-blue-400" />
                      <span>Image / Static Banner</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaType('VIDEO')}
                      className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
                        mediaType === 'VIDEO'
                          ? 'bg-pink-600/20 border-pink-500 text-white shadow-md'
                          : 'bg-surfaceLight border-surfaceBorder text-gray-400 hover:text-white'
                      }`}
                    >
                      <VideoIcon className="w-4 h-4 text-pink-400" />
                      <span>Video Advertisement</span>
                    </button>
                  </div>
                </div>

                {/* Placement Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">Display Placement *</label>
                  <select
                    value={placement}
                    onChange={(e: any) => setPlacement(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple"
                  >
                    <option value="PRE_ROLL">📺 In-Player Pre-Roll Video Ad (Plays before live stream)</option>
                    <option value="PLAYER_OVERLAY">🎦 Live Stream Lower-Third Player Overlay</option>
                    <option value="HEADER_TOP">📢 Top Platform Marquee Banner (Dismissible header bar)</option>
                    <option value="STREAM_CHAT">💬 Pinned Live Stream Chat Card</option>
                    <option value="DIRECTORY">✨ Live Directory Hero Showcase Banner</option>
                    <option value="VOD_DIRECTORY">🎬 VOD & Replay Showcase Billboard</option>
                    <option value="FEED">📱 Explore Swipe Feed Card</option>
                    <option value="WATCH">👀 Watch Page Companion Card</option>
                  </select>
                </div>

                {/* Title & Badge */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-gray-300">Campaign Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 50% Bonus Tokens Flash Sale"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-300">Badge Label</label>
                    <input
                      type="text"
                      placeholder="e.g. SPONSORED"
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple uppercase font-bold"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300">Description / Subtitle</label>
                  <textarea
                    rows={2}
                    placeholder="Short engaging copy explaining the offer, perk, or announcement..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple"
                  />
                </div>

                {/* Video URLs & Timing Controls if Video */}
                {mediaType === 'VIDEO' && (
                  <div className="p-4 rounded-2xl bg-pink-950/20 border border-pink-500/30 space-y-3">
                    <div className="flex items-center gap-2 text-pink-300 font-bold text-xs">
                      <VideoIcon className="w-4 h-4" />
                      <span>Video Creative & Skip Controls</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-300">Video Source URL (MP4 / WebM / HLS) *</label>
                      <input
                        type="url"
                        required={mediaType === 'VIDEO'}
                        placeholder="https://.../video.mp4"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-black/50 border border-pink-500/30 text-white text-xs font-mono focus:outline-none focus:border-pink-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-300">Max Duration (Seconds)</label>
                        <input
                          type="number"
                          min={5}
                          max={120}
                          value={durationSeconds}
                          onChange={(e) => setDurationSeconds(parseInt(e.target.value, 10) || 15)}
                          className="w-full px-3 py-2 rounded-xl bg-black/50 border border-surfaceBorder text-white text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-300">Skip Offset (Seconds)</label>
                        <input
                          type="number"
                          min={0}
                          max={durationSeconds}
                          value={skipOffsetSeconds}
                          onChange={(e) => setSkipOffsetSeconds(parseInt(e.target.value, 10) || 0)}
                          className="w-full px-3 py-2 rounded-xl bg-black/50 border border-surfaceBorder text-white text-xs"
                        />
                        <span className="text-[10px] text-gray-400">0 = instant skip allowed</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Creative Image / Fallback Thumbnail */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300">
                    {mediaType === 'VIDEO' ? 'Fallback Thumbnail / Poster Image URL' : 'Creative Image URL *'}
                  </label>
                  <input
                    type="url"
                    required={mediaType === 'IMAGE'}
                    placeholder="https://images.unsplash.com/..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs font-mono focus:outline-none focus:border-brandPurple"
                  />
                </div>

                {/* Target URL & CTA Text */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-300">Target Landing Page URL *</label>
                    <input
                      type="text"
                      required
                      placeholder="https://... or /wallet"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs font-mono focus:outline-none focus:border-brandPurple"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-300">CTA Button Text *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Claim Bonus, Learn More"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple"
                    />
                  </div>
                </div>

                {/* Active Switch */}
                <div className="pt-2 flex items-center justify-between p-3 rounded-xl bg-surfaceLight border border-surfaceBorder">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white block">Campaign Active</span>
                    <span className="text-[11px] text-gray-400 block">
                      When enabled, this advertisement serves immediately in live rooms and feeds.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-700 text-brandPurple focus:ring-brandPurple cursor-pointer"
                  />
                </div>
              </form>

              {/* Right: Real-time Live Interactive Placement Preview Simulator (5 Cols) */}
              <div className="lg:col-span-5 space-y-3 flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Sparkles className="w-3.5 h-3.5 text-tokenGold" />
                    <span>Live Interactive Simulator</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-pink-400 px-2 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/20">
                    Placement: {placement}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-black/70 border border-surfaceBorder flex-1 flex flex-col justify-center min-h-[360px] overflow-hidden relative">
                  {/* PRE_ROLL SIMULATOR */}
                  {placement === 'PRE_ROLL' && (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/20 shadow-2xl flex flex-col justify-between">
                      {mediaType === 'VIDEO' && videoUrl ? (
                        <video
                          src={videoUrl}
                          autoPlay
                          loop
                          muted={simMuted}
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={imageUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800'}
                          alt="Pre-roll preview"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )}

                      {/* Top Bar */}
                      <div className="relative z-10 p-2.5 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full bg-yellow-500 text-black text-[9px] font-black uppercase">
                            {badge || 'AD'} • {durationSeconds}s
                          </span>
                          <span className="text-[11px] font-bold text-white drop-shadow truncate max-w-[120px]">
                            {title || 'Ad Title'}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-white text-black text-[10px] font-black flex items-center gap-1 shadow">
                          <span>{ctaText || 'Learn More'}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      </div>

                      {/* Bottom Bar Controls & Working Skip */}
                      <div className="relative z-10 p-2.5 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent">
                        <button
                          type="button"
                          onClick={() => setSimMuted(!simMuted)}
                          className="p-1.5 rounded-lg bg-black/60 text-white text-[10px] flex items-center gap-1"
                        >
                          {simMuted ? <VolumeX className="w-3 h-3 text-pink-400" /> : <Volume2 className="w-3 h-3 text-emerald-400" />}
                        </button>

                        {simCanSkip ? (
                          <button
                            type="button"
                            onClick={() => alert('Simulator: Ad skipped! Live stream connects.')}
                            className="px-3 py-1 rounded-xl bg-gradient-to-r from-brandPurple to-brandPink text-white text-[11px] font-black flex items-center gap-1 animate-pulse"
                          >
                            <span>Skip Ad</span>
                            <FastForward className="w-3 h-3" />
                          </button>
                        ) : (
                          <div className="px-2.5 py-1 rounded-xl bg-black/70 text-gray-300 text-[10px] font-bold border border-white/10">
                            Skip Ad in {simSkipTimer}s
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* PLAYER_OVERLAY SIMULATOR */}
                  {placement === 'PLAYER_OVERLAY' && (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gradient-to-tr from-purple-950/60 to-black border border-white/20 shadow-2xl flex flex-col justify-end p-3">
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-black uppercase">
                        <Radio className="w-2.5 h-2.5 animate-ping" />
                        <span>LIVE STREAM</span>
                      </div>

                      {!simDismissed && (
                        <div className="p-2.5 rounded-xl bg-black/85 backdrop-blur-md border border-white/20 flex items-center justify-between gap-2 shadow-xl animate-in slide-in-from-bottom-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={imageUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200'}
                              alt="thumb"
                              className="w-8 h-8 rounded-lg object-cover bg-black shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="text-[8px] font-black text-pink-400 uppercase">{badge || 'SPONSORED'}</span>
                              <h4 className="text-[11px] font-bold text-white truncate">{title || 'Offer Title'}</h4>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-brandPurple to-brandPink text-white text-[10px] font-black">
                              {ctaText || 'Claim'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSimDismissed(true)}
                              className="p-1 text-gray-400 hover:text-white text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )}

                      {simDismissed && (
                        <button
                          type="button"
                          onClick={() => setSimDismissed(false)}
                          className="text-[10px] text-pink-400 font-bold underline text-center"
                        >
                          Reset Overlay
                        </button>
                      )}
                    </div>
                  )}

                  {/* HEADER_TOP SIMULATOR */}
                  {placement === 'HEADER_TOP' && (
                    <div className="w-full space-y-2">
                      <div className="w-full bg-gradient-to-r from-brandPurple via-pink-600 to-purple-900 text-white text-xs py-2 px-3 rounded-xl flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="px-1.5 py-0.2 rounded bg-black/40 text-[9px] font-black uppercase text-pink-300">
                            {badge || 'SPONSORED'}
                          </span>
                          <span className="font-bold text-[11px] truncate">{title || 'Announcement Title'}</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-white text-purple-900 text-[10px] font-black shrink-0">
                          {ctaText || 'Learn More'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 text-center">
                        Renders directly at the very top of every page in the platform navigation.
                      </p>
                    </div>
                  )}

                  {/* STREAM_CHAT SIMULATOR */}
                  {placement === 'STREAM_CHAT' && (
                    <div className="w-full max-w-xs mx-auto p-3 rounded-xl bg-[#1a1b2b] border border-brandPurple/30 space-y-2 shadow-xl">
                      <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span className="font-black text-brandPurple uppercase">{badge || 'SPONSORED'}</span>
                        <span>Pinned Message</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <img
                          src={imageUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200'}
                          alt="Chat icon"
                          className="w-8 h-8 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-white truncate">{title || 'Chat Promo'}</h4>
                          <p className="text-[10px] text-gray-300 line-clamp-1">{description || 'Click to claim deal'}</p>
                        </div>
                      </div>
                      <div className="w-full py-1 rounded-lg bg-gradient-to-r from-brandPurple to-brandPink text-white text-[10px] font-bold text-center">
                        {ctaText || 'Learn More'}
                      </div>
                    </div>
                  )}

                  {/* DIRECTORY & VOD_DIRECTORY SIMULATOR */}
                  {(placement === 'DIRECTORY' || placement === 'VOD_DIRECTORY') && (
                    <div className="w-full p-4 rounded-xl bg-gradient-to-r from-purple-950/70 to-surface border border-brandPurple/30 space-y-3 shadow-xl">
                      <div className="flex items-center gap-3">
                        {mediaType === 'VIDEO' && videoUrl ? (
                          <div className="w-20 h-14 rounded-lg overflow-hidden bg-black shrink-0">
                            <video src={videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <img
                            src={imageUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300'}
                            alt="preview"
                            className="w-20 h-14 rounded-lg object-cover shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] font-black text-pink-400 uppercase">{badge || 'SPONSORED'}</span>
                          <h4 className="text-xs font-black text-white truncate">{title || 'Showcase Banner'}</h4>
                          <p className="text-[10px] text-gray-300 line-clamp-1">{description}</p>
                        </div>
                      </div>
                      <div className="w-full py-1.5 rounded-xl bg-gradient-to-r from-brandPurple to-brandPink text-white text-xs font-black text-center shadow">
                        {ctaText || 'Learn More'}
                      </div>
                    </div>
                  )}

                  {/* FEED & WATCH SIMULATOR */}
                  {(placement === 'FEED' || placement === 'WATCH') && (
                    <div className="w-full max-w-xs mx-auto p-3 rounded-2xl bg-surfaceLight/70 border border-surfaceBorder space-y-2.5 shadow-xl">
                      <div className="flex items-center justify-between">
                        <span className="px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-400 text-[9px] font-black uppercase">
                          {badge || 'SPONSORED'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-semibold">Feed Card</span>
                      </div>
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
                        {mediaType === 'VIDEO' && videoUrl ? (
                          <video src={videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                        ) : (
                          <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white truncate">{title || 'Feed Card Title'}</h4>
                        <p className="text-[10px] text-gray-400 line-clamp-2 mt-0.5">{description}</p>
                      </div>
                      <div className="w-full py-2 rounded-xl bg-gradient-to-r from-brandPurple to-brandPink text-white text-xs font-bold text-center shadow">
                        {ctaText || 'Learn More'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-surfaceBorder bg-surface/50 flex items-center justify-between shrink-0">
              <div className="text-xs text-gray-400">
                {isEditing ? 'Editing existing campaign ID: ' + editingAdId : 'Ready to publish new campaign'}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-surfaceLight hover:bg-surfaceLight/80 text-gray-300 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="ad-form"
                  disabled={submitting}
                  className="btn-glow-purple px-6 py-2 rounded-xl text-xs font-black text-white flex items-center gap-2 shadow-lg hover:scale-105 transition disabled:opacity-50"
                >
                  <span>{submitting ? 'Saving...' : isEditing ? 'Save & Update Ad' : 'Publish Advertisement'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {adToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl glass-panel border border-red-500/30 bg-[#12131f] shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Advertisement?</h3>
                <p className="text-xs text-gray-400">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surfaceLight/50 border border-surfaceBorder text-xs text-gray-300 space-y-1">
              <div className="font-bold text-white truncate">{adToDelete.title}</div>
              <div className="text-gray-400">Placement: {adToDelete.placement}</div>
              <div className="text-gray-400 font-mono text-[11px] truncate">Target: {adToDelete.targetUrl}</div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAdToDelete(null)}
                className="px-4 py-2 rounded-xl bg-surfaceLight hover:bg-surfaceLight/80 text-gray-300 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-lg shadow-red-600/30"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

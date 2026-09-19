'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Film,
  Plus,
  Coins,
  Clock,
  Eye,
  Trash2,
  ExternalLink,
  ArrowLeft,
  Check,
  UploadCloud,
  Globe,
  Edit,
} from 'lucide-react';
import VodCrudModal from '@/components/vod/VodCrudModal';

export default function StreamerVodsManagerPage() {
  const [vods, setVods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [crudModalOpen, setCrudModalOpen] = useState(false);
  const [vodToEdit, setVodToEdit] = useState<any>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [durationMins, setDurationMins] = useState(15);
  const [priceTokens, setPriceTokens] = useState(0);
  const [sourceType, setSourceType] = useState('CLOUDINARY');

  useEffect(() => {
    fetchMyVods();
  }, []);

  const fetchMyVods = async () => {
    try {
      const res = await fetch('/api/vod');
      const data = await res.json();
      if (data.vods) {
        setVods(data.vods);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !videoUrl.trim()) {
      alert('Please provide a Title and a Video URL.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/vod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          videoUrl: videoUrl.trim(),
          thumbnailUrl: thumbnailUrl.trim() || null,
          durationSeconds: durationMins * 60,
          priceTokens: Number(priceTokens) || 0,
          sourceType,
        }),
      });

      const data = await res.json();
      if (res.ok && data.vod) {
        setVods([data.vod, ...vods]);
        setTitle('');
        setDescription('');
        setVideoUrl('');
        setThumbnailUrl('');
        setPriceTokens(0);
        alert('VOD Published to Platform Library successfully!');
      } else {
        alert(data.error || 'Failed to publish VOD');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVod = async (vodId: string) => {
    if (!confirm('Are you sure you want to remove this video recording?')) return;

    try {
      const res = await fetch(`/api/vod/${vodId}`, { method: 'DELETE' });
      if (res.ok) {
        setVods(vods.filter((v) => v.id !== vodId));
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surfaceBorder">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <Link href="/dashboard/streamer" className="hover:text-white flex items-center gap-1 transition">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Broadcast Studio</span>
            </Link>
          </div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Film className="w-6 h-6 text-brandPurple" />
            <span>VOD & Media Archive Manager</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Publish on-demand recordings, Cloudinary streams, and pay-per-view videos for fans.
          </p>
        </div>

        <Link
          href="/vods"
          target="_blank"
          className="btn-glow-purple px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Browse Public VOD Library</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (5 cols): Publish New VOD Form */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-6 rounded-2xl glass-panel border border-surfaceBorder space-y-4">
            <div className="flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Publish New VOD</h2>
            </div>

            <form onSubmit={handleCreateVod} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400">Video Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Cosplay Special - Episode 1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400">Cloudinary / Video Stream URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://res.cloudinary.com/... or https://.../stream.m3u8"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs font-mono focus:outline-none focus:border-brandPurple"
                />
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setVideoUrl('https://res.cloudinary.com/demo/video/upload/sample.mp4')}
                    className="text-[10px] text-cyan-300 hover:underline"
                  >
                    + Use Cloudinary Demo Video
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoUrl('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8')}
                    className="text-[10px] text-indigo-300 hover:underline"
                  >
                    + Use HLS Feed (.m3u8)
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400">Thumbnail Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... or Cloudinary image URL"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="1"
                    value={durationMins}
                    onChange={(e) => setDurationMins(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3.5 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400">Price (Tokens)</label>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surfaceLight border border-surfaceBorder">
                    <Coins className="w-4 h-4 text-tokenGold" />
                    <input
                      type="number"
                      min="0"
                      value={priceTokens}
                      onChange={(e) => setPriceTokens(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-transparent text-tokenGold font-bold text-xs focus:outline-none"
                    />
                    <span className="text-[10px] text-gray-400">{priceTokens > 0 ? 'PPV' : 'Free'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400">Description</label>
                <textarea
                  rows={3}
                  placeholder="Tell viewers what this video includes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-glow-purple py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-40 transition shadow-lg flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? 'Publishing...' : 'Publish VOD'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column (7 cols): Published VODs List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Your Published Recordings ({vods.length})
            </h2>
            <button
              type="button"
              onClick={() => {
                setVodToEdit(null);
                setCrudModalOpen(true);
              }}
              className="btn-glow-purple px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Quick CRUD Modal</span>
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-gray-400">Loading your VOD catalog...</div>
          ) : vods.length === 0 ? (
            <div className="p-12 rounded-2xl glass-panel border border-surfaceBorder text-center space-y-2">
              <Film className="w-8 h-8 text-gray-600 mx-auto" />
              <p className="text-xs font-bold text-white">No VODs Published Yet</p>
              <p className="text-[11px] text-gray-400">Use the form on the left to publish your first replay.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vods.map((vod) => (
                <div
                  key={vod.id}
                  className="p-4 rounded-2xl glass-panel border border-surfaceBorder flex items-center justify-between gap-4 transition hover:border-gray-600"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-20 h-14 rounded-xl bg-black overflow-hidden flex-shrink-0 relative">
                      <img
                        src={
                          vod.thumbnailUrl ||
                          'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&q=80'
                        }
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-white truncate max-w-sm">{vod.title}</h3>
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>{vod.viewCount} views</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{Math.floor(vod.durationSeconds / 60)} min</span>
                        </span>
                        <span>•</span>
                        {vod.priceTokens > 0 ? (
                          <span className="text-tokenGold font-bold">{vod.priceTokens} Tokens PPV</span>
                        ) : (
                          <span className="text-emerald-400 font-bold">Free</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setVodToEdit(vod);
                        setCrudModalOpen(true);
                      }}
                      className="p-2 rounded-xl bg-surfaceLight hover:bg-brandPurple text-gray-300 hover:text-white transition shadow"
                      title="Edit / Update VOD (CRUD)"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <Link
                      href={`/vod/${vod.id}`}
                      target="_blank"
                      className="p-2 rounded-xl bg-surfaceLight hover:bg-surfaceBorder text-gray-300 hover:text-white transition"
                      title="Watch VOD"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>

                    <button
                      onClick={() => handleDeleteVod(vod.id)}
                      className="p-2 rounded-xl bg-surfaceLight hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition"
                      title="Delete VOD"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reusable CRUD Modal */}
      <VodCrudModal
        isOpen={crudModalOpen}
        onClose={() => setCrudModalOpen(false)}
        vodToEdit={vodToEdit}
        onSaved={(saved) => {
          setVods((prev) => {
            const idx = prev.findIndex((v) => v.id === saved.id);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = { ...updated[idx], ...saved };
              return updated;
            }
            return [saved, ...prev];
          });
        }}
        onDeleted={(deletedId) => {
          setVods((prev) => prev.filter((v) => v.id !== deletedId));
        }}
      />
    </div>
  );
}

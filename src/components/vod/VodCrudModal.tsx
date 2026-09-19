'use client';

import React, { useState, useEffect } from 'react';
import {
  Film,
  X,
  UploadCloud,
  Check,
  Trash2,
  Coins,
  Clock,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export interface VodData {
  id?: string;
  title: string;
  description?: string | null;
  videoUrl: string;
  thumbnailUrl?: string | null;
  durationSeconds: number;
  priceTokens: number;
  isPublished?: boolean;
  sourceType?: string;
}

interface VodCrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  vodToEdit?: VodData | null;
  onSaved: (vod: any) => void;
  onDeleted?: (vodId: string) => void;
}

export default function VodCrudModal({
  isOpen,
  onClose,
  vodToEdit,
  onSaved,
  onDeleted,
}: VodCrudModalProps) {
  const isEditing = Boolean(vodToEdit && vodToEdit.id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [durationMins, setDurationMins] = useState(15);
  const [priceTokens, setPriceTokens] = useState(0);
  const [isPublished, setIsPublished] = useState(true);
  const [sourceType, setSourceType] = useState('CLOUDINARY');

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill form when editing
  useEffect(() => {
    if (vodToEdit) {
      setTitle(vodToEdit.title || '');
      setDescription(vodToEdit.description || '');
      setVideoUrl(vodToEdit.videoUrl || '');
      setThumbnailUrl(vodToEdit.thumbnailUrl || '');
      setDurationMins(Math.max(1, Math.round((vodToEdit.durationSeconds || 0) / 60)) || 15);
      setPriceTokens(vodToEdit.priceTokens || 0);
      setIsPublished(vodToEdit.isPublished ?? true);
      setSourceType(vodToEdit.sourceType || 'CLOUDINARY');
    } else {
      setTitle('');
      setDescription('');
      setVideoUrl('');
      setThumbnailUrl('');
      setDurationMins(15);
      setPriceTokens(0);
      setIsPublished(true);
      setSourceType('CLOUDINARY');
    }
    setError('');
  }, [vodToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !videoUrl.trim()) {
      setError('Please provide both a Title and a Video Stream URL.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        videoUrl: videoUrl.trim(),
        thumbnailUrl: thumbnailUrl.trim() || null,
        durationSeconds: durationMins * 60,
        priceTokens: Math.max(0, Number(priceTokens) || 0),
        isPublished,
        sourceType,
      };

      const url = isEditing ? `/api/vod/${vodToEdit?.id}` : '/api/vod';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save VOD');
      }

      onSaved(data.vod);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!vodToEdit?.id) return;
    if (!confirm(`Are you sure you want to permanently delete "${vodToEdit.title}"?`)) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/vod/${vodToEdit.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete VOD');
      }

      if (onDeleted) onDeleted(vodToEdit.id);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to delete VOD');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl bg-surface border border-surfaceBorder shadow-2xl overflow-hidden my-auto animate-fade-in">
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-brandPurple/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-surfaceBorder bg-surface/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brandPurple/20 text-brandPurple">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                {isEditing ? 'Edit VOD Recording (Update)' : 'Publish New VOD Recording (Create)'}
              </h2>
              <p className="text-[11px] text-gray-400">
                {isEditing ? 'Modify metadata, pricing, or stream link' : 'Upload and organize on-demand video media for fans'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-surfaceLight transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider">
              Video Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. VIP Stream Special - Episode 1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple"
            />
          </div>

          {/* Video URL */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider">
                Video Stream URL (Cloudinary, HLS, or MP4) *
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVideoUrl('https://res.cloudinary.com/demo/video/upload/sample.mp4')}
                  className="text-[10px] text-cyan-400 hover:underline"
                >
                  + Cloudinary Demo
                </button>
                <button
                  type="button"
                  onClick={() => setVideoUrl('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8')}
                  className="text-[10px] text-brandPurple hover:underline"
                >
                  + HLS Stream
                </button>
              </div>
            </div>
            <input
              type="url"
              required
              placeholder="https://res.cloudinary.com/... or https://.../stream.m3u8"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs font-mono focus:outline-none focus:border-brandPurple"
            />
          </div>

          {/* Thumbnail URL */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider">
              Thumbnail Cover Image URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/... or Cloudinary image link"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple"
            />
          </div>

          {/* Duration & Price Grid */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>Duration (Minutes)</span>
              </label>
              <input
                type="number"
                min={1}
                max={600}
                value={durationMins}
                onChange={(e) => setDurationMins(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full px-3.5 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs font-semibold focus:outline-none focus:border-brandPurple"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-tokenGold" />
                <span>Price (Tokens - 0 = Free)</span>
              </label>
              <input
                type="number"
                min={0}
                step={5}
                value={priceTokens}
                onChange={(e) => setPriceTokens(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-3.5 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs font-bold text-tokenGold focus:outline-none focus:border-amber-400"
              />
              <p className="text-[10px] text-gray-400">
                {priceTokens === 0 ? '🟢 Free for all viewers' : `🔒 Pay-Per-View: ${priceTokens} Tokens (~$${(priceTokens * 0.1).toFixed(2)})`}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider">
              Description / Tags
            </label>
            <textarea
              rows={3}
              placeholder="Provide context, episode notes, or special highlights..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple resize-none"
            />
          </div>

          {/* Published Visibility Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isPublishedCheck"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 rounded text-brandPurple focus:ring-brandPurple bg-surfaceLight border-surfaceBorder"
            />
            <label htmlFor="isPublishedCheck" className="text-xs text-gray-200 font-semibold cursor-pointer">
              Published & Visible in Public VOD Directory
            </label>
          </div>

          {/* Footer Action Bar */}
          <div className="pt-4 border-t border-surfaceBorder flex items-center justify-between gap-3">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? 'Deleting...' : 'Delete VOD'}</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-surfaceLight transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-glow-purple px-5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow"
              >
                {loading ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{isEditing ? 'Update VOD' : 'Publish VOD'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

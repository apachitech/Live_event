'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Lock, Coins, X, Clock, AlertCircle } from 'lucide-react';

interface PrivateShowRequestModalProps {
  streamId: string;
  streamerName: string;
  ratePerMin: number;
  isOpen: boolean;
  onClose: () => void;
  onRequestSent?: () => void;
}

export default function PrivateShowRequestModal({
  streamId,
  streamerName,
  ratePerMin,
  isOpen,
  onClose,
  onRequestSent,
}: PrivateShowRequestModalProps) {
  const { user, openPurchaseModal } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [c2cEnabled, setC2cEnabled] = useState(true);

  if (!isOpen) return null;

  const userBalance = user?.wallet?.balance ?? 0;
  const minRequired = ratePerMin * 2;
  const hasTokens = userBalance >= minRequired;

  const handleRequest = async () => {
    setError('');
    if (!user) {
      alert('Please log in to request a private show.');
      return;
    }

    if (!hasTokens) {
      openPurchaseModal();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/stream/private/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamId,
          action: 'request',
          c2cEnabled,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (onRequestSent) onRequestSent();
        onClose();
        alert('Private show request sent! Waiting for streamer to accept...');
      } else {
        setError(data.error || 'Failed to submit request');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-surface border border-surfaceBorder p-6 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-surfaceBorder">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-brandPurple">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">1:1 Private Show Request</h3>
              <p className="text-xs text-gray-400">Exclusive private session with {streamerName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-surfaceLight transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            {error}
          </div>
        )}

        <div className="my-5 p-4 rounded-xl bg-surfaceLight border border-surfaceBorder space-y-3 text-xs text-gray-300">
          <div className="flex items-center justify-between font-semibold">
            <span>Rate Per Minute:</span>
            <span className="text-tokenGold font-black flex items-center gap-1">
              <Coins className="w-4 h-4" /> {ratePerMin} Tokens/min
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span>Minimum Entry Buffer:</span>
            <span>2 Minutes ({minRequired} Tokens)</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-surfaceBorder text-gray-400">
            <span>Your Current Balance:</span>
            <span className="text-white font-bold">{userBalance} Tokens</span>
          </div>

          {/* Cam-to-Cam (C2C) Mutual Video Toggle */}
          <div className="pt-2 border-t border-surfaceBorder flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-white font-bold text-xs flex items-center gap-1.5">
                <span>📹 Cam-to-Cam (C2C) Mutual Video</span>
                <span className="px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-400 text-[10px] font-extrabold uppercase">
                  VIP
                </span>
              </span>
              <span className="text-[11px] text-gray-400">
                Broadcast your webcam directly to the streamer in private show
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={c2cEnabled}
                onChange={(e) => setC2cEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-600"></div>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white transition"
          >
            Cancel
          </button>
          {!hasTokens ? (
            <button
              onClick={() => {
                onClose();
                openPurchaseModal();
              }}
              className="btn-glow-gold px-5 py-2.5 rounded-xl text-xs font-bold text-black"
            >
              Get More Tokens
            </button>
          ) : (
            <button
              onClick={handleRequest}
              disabled={loading}
              className="btn-glow-purple px-5 py-2.5 rounded-xl text-xs font-bold text-white"
            >
              {loading ? 'Sending Request...' : 'Send Private Request'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

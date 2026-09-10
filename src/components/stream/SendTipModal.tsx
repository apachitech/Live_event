'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Coins, X, MessageSquare, AlertCircle, Plus } from 'lucide-react';

interface SendTipModalProps {
  streamId: string;
  streamerName: string;
  isOpen: boolean;
  onClose: () => void;
  onTipSuccess?: (data: any) => void;
}

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];

export default function SendTipModal({
  streamId,
  streamerName,
  isOpen,
  onClose,
  onTipSuccess,
}: SendTipModalProps) {
  const { user, openPurchaseModal, refreshUser } = useAuth();
  const [amount, setAmount] = useState<number>(25);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const userBalance = user?.wallet?.balance ?? 0;
  const effectiveAmount = customAmount ? parseInt(customAmount, 10) || 0 : amount;
  const hasEnoughTokens = userBalance >= effectiveAmount;

  const handleSendTip = async () => {
    setError('');
    if (effectiveAmount <= 0) {
      setError('Please select a valid tip amount.');
      return;
    }

    if (!hasEnoughTokens) {
      setError('Insufficient token balance. Please top up your wallet.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/stream/${streamId}/tip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenAmount: effectiveAmount,
          message: message.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        await refreshUser();
        if (onTipSuccess) onTipSuccess(data);
        onClose();
      } else {
        setError(data.error || 'Failed to send tip');
      }
    } catch (err: any) {
      setError(err.message || 'Error processing tip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-surface border border-surfaceBorder p-6 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surfaceBorder">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-tokenGold">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Tip {streamerName}</h3>
              <p className="text-xs text-gray-400">Your tip will appear live on screen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-surfaceLight transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Status */}
        <div className="mt-4 p-3 rounded-xl bg-surfaceLight border border-surfaceBorder flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Your Balance:</span>
            <span className="font-extrabold text-white flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-tokenGold" />
              {userBalance} Tokens
            </span>
          </div>
          <button
            onClick={() => {
              onClose();
              openPurchaseModal();
            }}
            className="text-tokenGold hover:text-amber-300 font-bold flex items-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Get More
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Preset token pills */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-gray-400 mb-2">Select Amount (Tokens)</label>
          <div className="grid grid-cols-3 gap-2">
            {PRESET_AMOUNTS.map((val) => {
              const isSelected = !customAmount && amount === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setCustomAmount('');
                    setAmount(val);
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/20 text-tokenGold'
                      : 'border-surfaceBorder bg-surfaceLight/60 text-gray-300 hover:border-gray-600'
                  }`}
                >
                  <Coins className="w-3 h-3 text-tokenGold" />
                  {val}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom amount input */}
        <div className="mt-3">
          <input
            type="number"
            min="1"
            placeholder="Or enter custom token amount"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-tokenGold transition"
          />
        </div>

        {/* Optional alert message */}
        <div className="mt-3">
          <label className="block text-xs font-semibold text-gray-400 mb-1 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" /> On-screen message (optional)
          </label>
          <textarea
            rows={2}
            maxLength={120}
            placeholder="Say something awesome..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple transition resize-none"
          />
        </div>

        {/* Submit */}
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white transition"
          >
            Cancel
          </button>

          {!hasEnoughTokens ? (
            <button
              onClick={() => {
                onClose();
                openPurchaseModal();
              }}
              className="btn-glow-gold px-5 py-2.5 rounded-xl text-xs font-bold text-black flex items-center gap-1.5"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Get Tokens to Tip</span>
            </button>
          ) : (
            <button
              onClick={handleSendTip}
              disabled={loading}
              className="btn-glow-gold px-5 py-2.5 rounded-xl text-xs font-bold text-black flex items-center gap-1.5"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>{loading ? 'Sending Tip...' : `Send ${effectiveAmount} Tokens`}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

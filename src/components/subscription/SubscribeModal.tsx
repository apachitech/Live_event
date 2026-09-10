'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Heart, Coins, X, Check, Star, Crown, Shield } from 'lucide-react';

interface SubscribeModalProps {
  streamerId: string;
  streamerName: string;
  isOpen: boolean;
  onClose: () => void;
  onSubscribed?: () => void;
}

const TIERS = [
  {
    tier: 1,
    name: 'Supporter Club',
    cost: 50,
    icon: Heart,
    color: 'border-purple-500 text-purple-400',
    perks: ['Exclusive Fan Club Chat Badge', 'Emotes access', 'Slow-mode immunity'],
  },
  {
    tier: 2,
    name: 'VIP Enthusiast',
    cost: 150,
    icon: Star,
    color: 'border-pink-500 text-pink-400',
    popular: true,
    perks: ['All Tier 1 Perks', '10% Discount on Private Shows', 'Priority Queue in Tip Menus'],
  },
  {
    tier: 3,
    name: 'Crown Patron',
    cost: 300,
    icon: Crown,
    color: 'border-amber-500 text-tokenGold',
    perks: ['All Tier 1 & 2 Perks', 'Direct messaging unlock', 'Golden Crown Room Badge'],
  },
];

export default function SubscribeModal({
  streamerId,
  streamerName,
  isOpen,
  onClose,
  onSubscribed,
}: SubscribeModalProps) {
  const { user, openPurchaseModal, refreshUser } = useAuth();
  const [selectedTier, setSelectedTier] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const currentTier = TIERS.find((t) => t.tier === selectedTier) || TIERS[1];
  const userBalance = user?.wallet?.balance ?? 0;
  const hasTokens = userBalance >= currentTier.cost;

  const handleSubscribe = async () => {
    setError('');
    if (!user) {
      alert('Please log in to subscribe.');
      return;
    }

    if (!hasTokens) {
      openPurchaseModal();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/streamer/${streamerId}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: selectedTier }),
      });

      const data = await res.json();
      if (res.ok) {
        await refreshUser();
        if (onSubscribed) onSubscribed();
        onClose();
      } else {
        setError(data.error || 'Subscription failed');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-surface border border-surfaceBorder p-6 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surfaceBorder">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-pink-500/20 text-pink-400">
              <Heart className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Join {streamerName}&apos;s Fan Club</h3>
              <p className="text-xs text-gray-400">Monthly renewal in tokens • Cancel anytime</p>
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

        {/* Tier Cards */}
        <div className="grid grid-cols-3 gap-3 my-5">
          {TIERS.map((t) => {
            const isSelected = selectedTier === t.tier;
            const Icon = t.icon;
            return (
              <div
                key={t.tier}
                onClick={() => setSelectedTier(t.tier)}
                className={`cursor-pointer rounded-xl p-3 border transition-all text-center relative ${
                  isSelected
                    ? `${t.color} bg-surfaceLight/80 shadow-md`
                    : 'border-surfaceBorder bg-surfaceLight/40 hover:border-gray-600'
                }`}
              >
                {t.popular && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-brandPink text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">
                    POPULAR
                  </span>
                )}
                <Icon className="w-5 h-5 mx-auto mb-1.5" />
                <div className="text-xs font-bold text-white truncate">{t.name}</div>
                <div className="flex items-center justify-center gap-1 mt-1 text-sm font-black text-tokenGold">
                  <Coins className="w-3.5 h-3.5" />
                  <span>{t.cost}</span>
                  <span className="text-[10px] text-gray-400 font-normal">/mo</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Tier Perks */}
        <div className="p-4 rounded-xl bg-surfaceLight border border-surfaceBorder mb-5">
          <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2.5">
            Included Perks:
          </h4>
          <div className="space-y-2">
            {currentTier.perks.map((perk, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{perk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400">
            Your Balance: <span className="font-bold text-white">{userBalance} Tokens</span>
          </div>

          <div className="flex items-center gap-2">
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
                Top Up Tokens
              </button>
            ) : (
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="btn-glow-purple px-5 py-2.5 rounded-xl text-xs font-bold text-white"
              >
                {loading ? 'Subscribing...' : `Join for ${currentTier.cost} Tokens`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Settings, ArrowLeft, Save, CheckCircle2 } from 'lucide-react';

export default function AdminSettingsPage() {
  const [streamerSplit, setStreamerSplit] = useState('70');
  const [minPayoutTokens, setMinPayoutTokens] = useState('1000');
  const [chatRateLimit, setChatRateLimit] = useState('5');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setStreamerSplit(data.settings.REVENUE_SPLIT_STREAMER_PERCENT || '70');
          setMinPayoutTokens(data.settings.MIN_PAYOUT_THRESHOLD_TOKENS || '1000');
          setChatRateLimit(data.settings.CHAT_RATE_LIMIT_MESSAGES || '5');
        }
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      await Promise.all([
        fetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'REVENUE_SPLIT_STREAMER_PERCENT',
            value: streamerSplit,
            description: 'Percentage of tokens credited to streamer upon tip/subscription',
          }),
        }),
        fetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'MIN_PAYOUT_THRESHOLD_TOKENS',
            value: minPayoutTokens,
            description: 'Minimum token balance required to request cashout',
          }),
        }),
        fetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'CHAT_RATE_LIMIT_MESSAGES',
            value: chatRateLimit,
            description: 'Max chat messages allowed per 4 seconds window',
          }),
        }),
      ]);

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    finally {
      setLoading(false);
    }
  };

  const platformSplit = 100 - (parseInt(streamerSplit, 10) || 70);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="p-2 rounded-xl bg-surfaceLight border border-surfaceBorder hover:border-gray-600 text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-brandPurple" />
            <span>Platform Economics & Rules</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Configure dynamic platform revenue splits, payout limits, and chat spam prevention.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="p-6 rounded-2xl glass-panel border border-surfaceBorder space-y-6">
        {saved && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings successfully updated and active platform-wide!</span>
          </div>
        )}

        {/* Revenue Split Configuration */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-white uppercase tracking-wider">
            Token Revenue Split Configuration
          </label>
          <p className="text-xs text-gray-400">
            Define what percentage of tokens from tips and subscriptions go to the streamer versus the platform fee.
          </p>

          <div className="flex items-center gap-4 pt-2">
            <div className="flex-1 space-y-1">
              <span className="text-xs font-semibold text-purple-300">Streamer Share (%)</span>
              <input
                type="number"
                min="50"
                max="95"
                value={streamerSplit}
                onChange={(e) => setStreamerSplit(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white font-bold text-sm focus:outline-none focus:border-brandPurple"
              />
            </div>

            <div className="flex-1 space-y-1">
              <span className="text-xs font-semibold text-gray-400">Platform Retention (%)</span>
              <input
                type="text"
                disabled
                value={`${platformSplit}%`}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceLight/50 border border-surfaceBorder text-gray-400 font-bold text-sm cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Minimum Payout Threshold */}
        <div className="space-y-2 pt-4 border-t border-surfaceBorder">
          <label className="block text-xs font-bold text-white uppercase tracking-wider">
            Minimum Streamer Payout Threshold
          </label>
          <p className="text-xs text-gray-400">
            Minimum number of earned tokens required before a streamer can submit a cashout request.
          </p>

          <div className="w-64">
            <input
              type="number"
              min="100"
              step="100"
              value={minPayoutTokens}
              onChange={(e) => setMinPayoutTokens(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-tokenGold font-bold text-sm focus:outline-none focus:border-brandPurple"
            />
            <span className="text-[11px] text-gray-400 mt-1 block">
              Equivalent to: ${(parseInt(minPayoutTokens, 10) * 0.05 || 50).toFixed(2)} USD
            </span>
          </div>
        </div>

        {/* Chat Rate Limit */}
        <div className="space-y-2 pt-4 border-t border-surfaceBorder">
          <label className="block text-xs font-bold text-white uppercase tracking-wider">
            Chat Anti-Spam Rate Limit
          </label>
          <p className="text-xs text-gray-400">
            Maximum number of messages a viewer can send within a 4-second rolling window.
          </p>

          <div className="w-64">
            <input
              type="number"
              min="1"
              max="20"
              value={chatRateLimit}
              onChange={(e) => setChatRateLimit(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white font-bold text-sm focus:outline-none focus:border-brandPurple"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-surfaceBorder flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn-glow-purple px-6 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving Changes...' : 'Save Platform Rules'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

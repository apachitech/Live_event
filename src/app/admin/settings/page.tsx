'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Settings,
  ArrowLeft,
  Save,
  CheckCircle2,
  Globe,
  Coins,
  Gift,
  Sliders,
  Plus,
  Trash2,
  Search,
  User as UserIcon,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { TokenPackage } from '@/types';
import { useSiteConfig } from '@/context/SiteConfigContext';

function AdminSettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'branding';
  const [activeTab, setActiveTab] = useState<'branding' | 'pricing' | 'distribute' | 'rules'>(
    (initialTab as any) || 'branding'
  );

  const { reloadConfig } = useSiteConfig();

  // Branding State
  const [siteName, setSiteName] = useState('PulseStream');
  const [siteTagline, setSiteTagline] = useState('Live Interactive Monetized Streaming Platform');
  const [siteDescription, setSiteDescription] = useState(
    'Public stream rooms, virtual currency economy, interactive tipping menus, and private shows.'
  );
  const [supportEmail, setSupportEmail] = useState('support@pulsestream.live');

  // Economics & Rules State
  const [streamerSplit, setStreamerSplit] = useState('70');
  const [minPayoutTokens, setMinPayoutTokens] = useState('1000');
  const [chatRateLimit, setChatRateLimit] = useState('5');
  const [exchangeRateCents, setExchangeRateCents] = useState('5');

  // Token Packages State
  const [tokenPackages, setTokenPackages] = useState<TokenPackage[]>([]);

  // Token Distribution State
  const [distTarget, setDistTarget] = useState<'SPECIFIC' | 'ALL'>('SPECIFIC');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [distAmount, setDistAmount] = useState('100');
  const [distMemo, setDistMemo] = useState('Platform Promotional Reward');
  const [distBalanceType, setDistBalanceType] = useState<'viewer' | 'streamer'>('viewer');
  const [distributing, setDistributing] = useState(false);
  const [recentDistributions, setRecentDistributions] = useState<any[]>([]);
  const [distributionStats, setDistributionStats] = useState<any>(null);

  // General Status
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotice = (type: 'success' | 'error', message: string) => {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 4000);
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setSiteName(data.settings.SITE_NAME || 'PulseStream');
        setSiteTagline(data.settings.SITE_TAGLINE || '');
        setSiteDescription(data.settings.SITE_DESCRIPTION || '');
        setSupportEmail(data.settings.SUPPORT_EMAIL || '');
        setStreamerSplit(data.settings.REVENUE_SPLIT_STREAMER_PERCENT || '70');
        setMinPayoutTokens(data.settings.MIN_PAYOUT_THRESHOLD_TOKENS || '1000');
        setChatRateLimit(data.settings.CHAT_RATE_LIMIT_MESSAGES || '5');
        setExchangeRateCents(data.settings.TOKEN_EXCHANGE_RATE_CENTS || '5');
        if (Array.isArray(data.settings.TOKEN_PACKAGES)) {
          setTokenPackages(data.settings.TOKEN_PACKAGES);
        }
      }
    } catch {
      showNotice('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchDistributions = async () => {
    try {
      const res = await fetch('/api/admin/tokens/distribute');
      const data = await res.json();
      if (data.success) {
        setRecentDistributions(data.recentDistributions || []);
        setDistributionStats(data.stats || null);
      }
    } catch {}
  };

  useEffect(() => {
    fetchSettings();
    fetchDistributions();
  }, []);

  // Search users debounce
  useEffect(() => {
    if (!userSearchQuery.trim() || distTarget === 'ALL') {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/tokens/distribute?search=${encodeURIComponent(userSearchQuery.trim())}`
        );
        const data = await res.json();
        if (data.matchingUsers) {
          setSearchResults(data.matchingUsers);
        }
      } catch {}
    }, 250);

    return () => clearTimeout(timer);
  }, [userSearchQuery, distTarget]);

  // Save Branding
  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            SITE_NAME: siteName.trim() || 'PulseStream',
            SITE_TAGLINE: siteTagline.trim(),
            SITE_DESCRIPTION: siteDescription.trim(),
            SUPPORT_EMAIL: supportEmail.trim(),
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotice('success', 'Site Branding saved! Applied across the platform immediately.');
        reloadConfig();
      } else {
        showNotice('error', data.error || 'Failed to update branding');
      }
    } catch (err: any) {
      showNotice('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  // Reset Branding to Default
  const handleResetBranding = () => {
    setSiteName('PulseStream');
    setSiteTagline('Live Interactive Monetized Streaming Platform');
    setSiteDescription(
      'Public stream rooms, virtual currency economy, interactive tipping menus, and private shows.'
    );
    setSupportEmail('support@pulsestream.live');
  };

  // Save Token Packages & Pricing
  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            TOKEN_PACKAGES: tokenPackages,
            TOKEN_EXCHANGE_RATE_CENTS: exchangeRateCents,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotice('success', 'Token packages and pricing updated successfully!');
        reloadConfig();
      } else {
        showNotice('error', data.error || 'Failed to update pricing');
      }
    } catch (err: any) {
      showNotice('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  // Package modifiers
  const handleUpdatePackage = (index: number, field: keyof TokenPackage, value: any) => {
    setTokenPackages((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddPackage = () => {
    const newId = `pkg_${Date.now()}`;
    const newPkg: TokenPackage = {
      id: newId,
      tokens: 500,
      priceCents: 2499,
      label: '500 Tokens Pack',
      bonusTokens: 50,
      popular: false,
    };
    setTokenPackages((prev) => [...prev, newPkg]);
  };

  const handleRemovePackage = (index: number) => {
    setTokenPackages((prev) => prev.filter((_, i) => i !== index));
  };

  // Distribute Tokens
  const handleDistributeTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(distAmount, 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      showNotice('error', 'Please enter a valid positive token amount');
      return;
    }

    if (distTarget === 'SPECIFIC' && !selectedUser) {
      showNotice('error', 'Please select a recipient user');
      return;
    }

    const confirmMsg =
      distTarget === 'ALL'
        ? `Are you sure you want to distribute ${amountNum} tokens to ALL users?`
        : `Send ${amountNum} tokens to @${selectedUser.username}?`;

    if (!confirm(confirmMsg)) return;

    setDistributing(true);
    try {
      const res = await fetch('/api/admin/tokens/distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: distTarget,
          recipientId: selectedUser?.id,
          amount: amountNum,
          memo: distMemo,
          balanceType: distBalanceType,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotice('success', data.message || 'Tokens distributed successfully!');
        if (distTarget === 'SPECIFIC') {
          setSelectedUser(null);
          setUserSearchQuery('');
        }
        fetchDistributions();
      } else {
        showNotice('error', data.error || 'Distribution failed');
      }
    } catch (err: any) {
      showNotice('error', err.message);
    } finally {
      setDistributing(false);
    }
  };

  // Save Rules
  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            REVENUE_SPLIT_STREAMER_PERCENT: streamerSplit,
            MIN_PAYOUT_THRESHOLD_TOKENS: minPayoutTokens,
            CHAT_RATE_LIMIT_MESSAGES: chatRateLimit,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotice('success', 'Platform rules saved successfully!');
      } else {
        showNotice('error', data.error || 'Failed to save rules');
      }
    } catch (err: any) {
      showNotice('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const platformSplit = 100 - (parseInt(streamerSplit, 10) || 70);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surfaceBorder">
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
              <span>Platform Control & Settings</span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Customize platform branding, organize token packages, distribute tokens, and manage global economics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/ads"
            className="px-3.5 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder hover:border-gray-600 text-xs font-bold text-gray-300 flex items-center gap-1.5 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-tokenGold" />
            <span>Manage Advertisements</span>
          </Link>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
            notice.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-surfaceBorder overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('branding')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'branding'
              ? 'bg-brandPurple text-white shadow-lg shadow-brandPurple/20'
              : 'text-gray-400 hover:text-white hover:bg-surfaceLight'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Site Branding & Identity</span>
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'pricing'
              ? 'bg-brandPurple text-white shadow-lg shadow-brandPurple/20'
              : 'text-gray-400 hover:text-white hover:bg-surfaceLight'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Organize Token Pricing</span>
        </button>

        <button
          onClick={() => setActiveTab('distribute')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'distribute'
              ? 'bg-brandPurple text-white shadow-lg shadow-brandPurple/20'
              : 'text-gray-400 hover:text-white hover:bg-surfaceLight'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Distribute Tokens</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'rules'
              ? 'bg-brandPurple text-white shadow-lg shadow-brandPurple/20'
              : 'text-gray-400 hover:text-white hover:bg-surfaceLight'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Economics & Rules</span>
        </button>
      </div>

      {/* TAB 1: SITE BRANDING */}
      {activeTab === 'branding' && (
        <form onSubmit={handleSaveBranding} className="p-6 rounded-2xl glass-panel border border-surfaceBorder space-y-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-brandPurple" />
              <span>Site Branding & Identity</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Change the site title, slogan, description, and support email. Changes sync everywhere across Navbar,
              Footers, Modals, and Browser Title tabs in real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                Site Name (Brand Title) *
              </label>
              <input
                type="text"
                required
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="e.g., PulseStream"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white font-bold text-sm focus:outline-none focus:border-brandPurple"
              />
              <span className="text-[11px] text-gray-400">
                Visible in the navbar brand logo, meta headers, page titles, and wallet purchase titles.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                Support & Inquiries Email
              </label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="support@pulsestream.live"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white font-bold text-sm focus:outline-none focus:border-brandPurple"
              />
              <span className="text-[11px] text-gray-400">
                Shown in the website footer, terms, and payment receipts.
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white uppercase tracking-wider">
              Site Tagline / Slogan
            </label>
            <input
              type="text"
              value={siteTagline}
              onChange={(e) => setSiteTagline(e.target.value)}
              placeholder="e.g., Live Interactive Monetized Streaming Platform"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white uppercase tracking-wider">
              Site Meta Description
            </label>
            <textarea
              rows={3}
              value={siteDescription}
              onChange={(e) => setSiteDescription(e.target.value)}
              placeholder="Provide a description of your platform for search engines and social cards..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple resize-none"
            />
          </div>

          {/* Live Preview Card */}
          <div className="p-4 rounded-xl bg-surfaceLight/40 border border-surfaceBorder/80 space-y-2">
            <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
              Live Brand Preview
            </span>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brandPurple to-brandPink flex items-center justify-center font-black text-white text-sm shadow-md">
                {siteName.charAt(0) || 'P'}
              </div>
              <div>
                <span className="text-base font-black text-white tracking-wide">{siteName}</span>
                <p className="text-[11px] text-gray-400">{siteTagline}</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-surfaceBorder flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetBranding}
              className="px-3.5 py-2 rounded-xl bg-surfaceLight hover:bg-gray-700/50 text-gray-300 text-xs font-semibold transition"
            >
              Reset to Defaults
            </button>

            <button
              type="submit"
              disabled={saving}
              className="btn-glow-purple px-6 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Applying...' : 'Save & Publish Branding'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: ORGANIZE TOKEN PRICING */}
      {activeTab === 'pricing' && (
        <form onSubmit={handleSavePricing} className="p-6 rounded-2xl glass-panel border border-surfaceBorder space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Coins className="w-4 h-4 text-tokenGold" />
                <span>Token Pricing & Packages Organizer</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Customize token tiers, purchase prices in USD, bonus incentives, and popular flags.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddPackage}
              className="px-3.5 py-2 rounded-xl bg-brandPurple/20 hover:bg-brandPurple/30 border border-brandPurple/40 text-brandPurple text-xs font-bold flex items-center gap-1.5 transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Package</span>
            </button>
          </div>

          {/* Exchange Rate Parameter */}
          <div className="p-4 rounded-xl bg-surfaceLight/40 border border-surfaceBorder flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <label className="text-xs font-bold text-white">Baseline Token Exchange Value</label>
              <p className="text-[11px] text-gray-400">
                Estimated fiat equivalent per 1 token for streamer cashouts.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">1 Token = </span>
              <input
                type="number"
                min="1"
                max="100"
                value={exchangeRateCents}
                onChange={(e) => setExchangeRateCents(e.target.value)}
                className="w-16 px-2.5 py-1.5 rounded-lg bg-surfaceLight border border-surfaceBorder text-white text-xs font-bold text-center focus:outline-none focus:border-brandPurple"
              />
              <span className="text-xs font-bold text-emerald-400">¢ Cents ($0.05)</span>
            </div>
          </div>

          {/* Package Cards List */}
          <div className="space-y-3">
            {tokenPackages.map((pkg, idx) => (
              <div
                key={pkg.id || idx}
                className={`p-4 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  pkg.popular
                    ? 'bg-brandPurple/10 border-brandPurple/40 shadow-sm'
                    : 'bg-surfaceLight/50 border-surfaceBorder'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-tokenGold/10 border border-tokenGold/20 flex items-center justify-center font-bold text-tokenGold text-base">
                    🪙
                  </div>
                  <div>
                    <span className="text-xs font-black text-white">Tier #{idx + 1}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      {pkg.popular && (
                        <span className="px-2 py-0.5 rounded-full bg-brandPurple text-white text-[10px] font-extrabold uppercase">
                          POPULAR
                        </span>
                      )}
                      {pkg.bonusTokens && pkg.bonusTokens > 0 ? (
                        <span className="text-[11px] text-emerald-400 font-semibold">
                          +{pkg.bonusTokens} Bonus
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-center flex-1 max-w-xl">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Tokens</label>
                    <input
                      type="number"
                      min="10"
                      step="10"
                      value={pkg.tokens}
                      onChange={(e) => handleUpdatePackage(idx, 'tokens', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-surfaceLight border border-surfaceBorder text-white text-xs font-bold focus:outline-none focus:border-brandPurple"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Price (USD $)</label>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={((pkg.priceCents || 0) / 100).toString()}
                      onChange={(e) =>
                        handleUpdatePackage(
                          idx,
                          'priceCents',
                          Math.round((parseFloat(e.target.value) || 0) * 100)
                        )
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-surfaceLight border border-surfaceBorder text-emerald-400 text-xs font-bold focus:outline-none focus:border-brandPurple"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Bonus Tokens</label>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={pkg.bonusTokens || 0}
                      onChange={(e) => handleUpdatePackage(idx, 'bonusTokens', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-surfaceLight border border-surfaceBorder text-tokenGold text-xs font-bold focus:outline-none focus:border-brandPurple"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Featured</label>
                    <button
                      type="button"
                      onClick={() => handleUpdatePackage(idx, 'popular', !pkg.popular)}
                      className={`w-full py-1.5 rounded-lg text-xs font-bold transition border ${
                        pkg.popular
                          ? 'bg-brandPurple text-white border-brandPurple'
                          : 'bg-surfaceLight text-gray-400 border-surfaceBorder hover:text-white'
                      }`}
                    >
                      {pkg.popular ? '★ Highlighted' : 'Normal'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemovePackage(idx)}
                    className="p-2 rounded-lg bg-surfaceLight hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition"
                    title="Remove Package"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-surfaceBorder flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn-glow-purple px-6 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Pricing...' : 'Save & Publish Token Packages'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: DISTRIBUTE TOKENS */}
      {activeTab === 'distribute' && (
        <div className="space-y-6">
          <form
            onSubmit={handleDistributeTokens}
            className="p-6 rounded-2xl glass-panel border border-surfaceBorder space-y-6"
          >
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Gift className="w-4 h-4 text-emerald-400" />
                <span>Distribute / Airdrop Tokens</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Reward community members, run platform promos, or compensate users directly into their wallet balance.
              </p>
            </div>

            {/* Target Audience Toggle */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                Distribution Target
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                <button
                  type="button"
                  onClick={() => {
                    setDistTarget('SPECIFIC');
                    setSelectedUser(null);
                  }}
                  className={`p-3.5 rounded-xl border text-left transition ${
                    distTarget === 'SPECIFIC'
                      ? 'bg-brandPurple/20 border-brandPurple text-white'
                      : 'bg-surfaceLight/50 border-surfaceBorder text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="block font-bold text-xs">👤 Specific User</span>
                  <span className="text-[11px] text-gray-400 mt-0.5 block">
                    Credit a single viewer or streamer directly
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDistTarget('ALL');
                    setSelectedUser(null);
                  }}
                  className={`p-3.5 rounded-xl border text-left transition ${
                    distTarget === 'ALL'
                      ? 'bg-brandPurple/20 border-brandPurple text-white'
                      : 'bg-surfaceLight/50 border-surfaceBorder text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="block font-bold text-xs">🌐 All Users (Platform Airdrop)</span>
                  <span className="text-[11px] text-gray-400 mt-0.5 block">
                    Broadcast bonus tokens to every registered member
                  </span>
                </button>
              </div>
            </div>

            {/* If Specific User Selected */}
            {distTarget === 'SPECIFIC' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-white uppercase tracking-wider">
                  Select Recipient User *
                </label>

                {selectedUser ? (
                  <div className="p-3 rounded-xl bg-surfaceLight border border-brandPurple/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brandPurple/20 flex items-center justify-center text-brandPurple font-bold text-xs">
                        {selectedUser.username?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">@{selectedUser.username}</span>
                        <span className="text-[10px] text-gray-400">{selectedUser.email}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="text-xs text-red-400 hover:underline px-2"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type username or email..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />

                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 p-1 rounded-xl bg-[#13141f] border border-surfaceBorder shadow-xl z-20 max-h-48 overflow-y-auto space-y-1">
                        {searchResults.map((u) => (
                          <div
                            key={u.id}
                            onClick={() => {
                              setSelectedUser(u);
                              setUserSearchQuery('');
                              setSearchResults([]);
                            }}
                            className="p-2 rounded-lg hover:bg-surfaceLight cursor-pointer flex items-center justify-between text-xs text-gray-300 hover:text-white"
                          >
                            <div className="flex items-center gap-2">
                              <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                              <span className="font-bold text-white">@{u.username}</span>
                              <span className="text-[10px] text-gray-500">({u.email})</span>
                            </div>
                            <span className="text-[10px] text-tokenGold font-mono">
                              Bal: {u.wallet?.balance || 0} 🪙
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white uppercase tracking-wider">
                  Token Amount *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={distAmount}
                    onChange={(e) => setDistAmount(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-tokenGold font-black text-sm focus:outline-none focus:border-brandPurple"
                  />
                  <span className="absolute left-3 top-2.5 text-sm">🪙</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white uppercase tracking-wider">
                  Destination Wallet
                </label>
                <select
                  value={distBalanceType}
                  onChange={(e: any) => setDistBalanceType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple"
                >
                  <option value="viewer">Viewer Balance (For Tipping/Chats)</option>
                  <option value="streamer">Streamer Earned Balance (Cashable)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white uppercase tracking-wider">
                  Memo / Reason
                </label>
                <input
                  type="text"
                  value={distMemo}
                  onChange={(e) => setDistMemo(e.target.value)}
                  placeholder="e.g., Platform Welcome Gift"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-surfaceBorder flex justify-end">
              <button
                type="submit"
                disabled={distributing}
                className="btn-glow-purple px-6 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow"
              >
                <Gift className="w-4 h-4" />
                <span>{distributing ? 'Distributing Tokens...' : 'Execute Token Distribution'}</span>
              </button>
            </div>
          </form>

          {/* History of distributions */}
          <div className="p-6 rounded-2xl glass-panel border border-surfaceBorder space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Recent Distributions Log</h3>
                <p className="text-xs text-gray-400">
                  Total Distributed to date: {distributionStats?.totalDistributed?.toLocaleString() || 0} tokens
                </p>
              </div>
              <button
                type="button"
                onClick={fetchDistributions}
                className="p-2 rounded-lg bg-surfaceLight hover:bg-gray-700 text-gray-400 hover:text-white transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentDistributions.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-4">No token distributions recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="text-[11px] text-gray-400 uppercase border-b border-surfaceBorder">
                    <tr>
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5">Recipient</th>
                      <th className="py-2.5">Amount</th>
                      <th className="py-2.5">Memo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surfaceBorder/50">
                    {recentDistributions.map((d) => (
                      <tr key={d.id}>
                        <td className="py-2.5 text-gray-400 font-mono">
                          {new Date(d.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 font-bold text-white">
                          {d.recipient ? `@${d.recipient.username}` : 'Global Community (ALL)'}
                        </td>
                        <td className="py-2.5 font-bold text-tokenGold">+{d.amount} 🪙</td>
                        <td className="py-2.5 text-gray-400">{d.memo || 'Admin Gift'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ECONOMICS & RULES */}
      {activeTab === 'rules' && (
        <form onSubmit={handleSaveRules} className="p-6 rounded-2xl glass-panel border border-surfaceBorder space-y-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-brandPurple" />
              <span>Platform Economics & Rules</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Configure dynamic platform revenue splits, payout limits, and chat spam prevention.
            </p>
          </div>

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
              disabled={saving}
              className="btn-glow-purple px-6 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Changes...' : 'Save Platform Rules'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-4 py-16 text-center text-xs text-gray-500 animate-pulse">
          Loading platform settings...
        </div>
      }
    >
      <AdminSettingsContent />
    </React.Suspense>
  );
}

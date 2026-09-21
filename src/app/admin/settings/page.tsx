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
  Film,
  Shield,
  CreditCard,
  Smartphone,
  Bitcoin,
  Zap,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Copy,
  RotateCcw,
  Eye,
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { TokenPackage, TOKEN_PACKAGES as DEFAULT_PACKAGES } from '@/types';
import { useSiteConfig } from '@/context/SiteConfigContext';

function AdminSettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'branding';
  const [activeTab, setActiveTab] = useState<'branding' | 'pricing' | 'distribute' | 'rules' | 'payments'>(
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
  const [contentRating, setContentRating] = useState<'ADULT' | 'KIDS' | 'GENERAL'>('ADULT');

  // Economics & Rules State
  const [streamerSplit, setStreamerSplit] = useState('70');
  const [minPayoutTokens, setMinPayoutTokens] = useState('1000');
  const [chatRateLimit, setChatRateLimit] = useState('5');
  const [exchangeRateCents, setExchangeRateCents] = useState('5');

  // Token Packages State
  const [tokenPackages, setTokenPackages] = useState<TokenPackage[]>([]);

  // Payment Gateways & Methods State
  const [paymentMethods, setPaymentMethods] = useState<Record<string, boolean>>({
    SASPAY: true,
    VAULTPAY: true,
    CRYPTO: true,
    MOCK: false,
  });

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
  const [outboundIp, setOutboundIp] = useState<string>('');
  const [ipLoading, setIpLoading] = useState(false);
  const [sasPayTestResult, setSasPayTestResult] = useState<any>(null);
  const [testingSasPay, setTestingSasPay] = useState(false);

  const handleTestSasPay = async () => {
    setTestingSasPay(true);
    setSasPayTestResult(null);
    try {
      const res = await fetch('/api/admin/payments/test-saspay');
      const data = await res.json();
      setSasPayTestResult(data);
    } catch (err: any) {
      setSasPayTestResult({
        success: false,
        message: 'Failed to run diagnostic: ' + err.message,
      });
    } finally {
      setTestingSasPay(false);
    }
  };

  const fetchOutboundIp = async () => {
    setIpLoading(true);
    try {
      const res = await fetch('/api/admin/outbound-ip');
      const data = await res.json();
      if (data.outboundIp) {
        setOutboundIp(data.outboundIp);
      }
    } catch {
      showNotice('error', 'Failed to retrieve server outbound IP');
    } finally {
      setIpLoading(false);
    }
  };

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
        if (data.settings.SITE_CONTENT_RATING) {
          setContentRating(data.settings.SITE_CONTENT_RATING as any);
        }
        setStreamerSplit(data.settings.REVENUE_SPLIT_STREAMER_PERCENT || '70');
        setMinPayoutTokens(data.settings.MIN_PAYOUT_THRESHOLD_TOKENS || '1000');
        setChatRateLimit(data.settings.CHAT_RATE_LIMIT_MESSAGES || '5');
        setExchangeRateCents(data.settings.TOKEN_EXCHANGE_RATE_CENTS || '5');
        if (Array.isArray(data.settings.TOKEN_PACKAGES)) {
          setTokenPackages(data.settings.TOKEN_PACKAGES);
        }
        if (data.settings.PAYMENT_METHODS_CONFIG) {
          let parsed: any = data.settings.PAYMENT_METHODS_CONFIG;
          if (typeof parsed === 'string') {
            try {
              parsed = JSON.parse(parsed);
            } catch {}
          }
          if (typeof parsed === 'object' && parsed !== null) {
            setPaymentMethods((prev) => ({
              ...prev,
              SASPAY: parsed.SASPAY !== false,
              VAULTPAY: parsed.VAULTPAY !== false,
              CRYPTO: parsed.CRYPTO !== false,
              MOCK: parsed.MOCK === true,
            }));
          }
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

    let socket: Socket | null = null;
    try {
      socket = io();
      socket.on('site_settings_updated', (updated: any) => {
        if (!updated) return;
        const pkgs = updated.tokenPackages || updated.TOKEN_PACKAGES;
        if (pkgs) {
          try {
            const list = typeof pkgs === 'string' ? JSON.parse(pkgs) : pkgs;
            if (Array.isArray(list) && list.length > 0) {
              setTokenPackages(list);
            }
          } catch {}
        }
        const rate = updated.tokenExchangeRateCents || updated.TOKEN_EXCHANGE_RATE_CENTS;
        if (rate !== undefined) {
          setExchangeRateCents(String(rate));
        }
        if (updated.paymentMethods || updated.PAYMENT_METHODS_CONFIG) {
          try {
            const pm = updated.paymentMethods || updated.PAYMENT_METHODS_CONFIG;
            const parsed = typeof pm === 'string' ? JSON.parse(pm) : pm;
            if (typeof parsed === 'object' && parsed !== null) {
              setPaymentMethods((prev) => ({ ...prev, ...parsed }));
            }
          } catch {}
        }
      });
    } catch {}

    return () => {
      if (socket) socket.disconnect();
    };
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
            SITE_CONTENT_RATING: contentRating,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotice('success', 'Site Branding & Content Rating saved! Applied platform-wide immediately.');
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
    setContentRating('ADULT');
  };

  // Save Token Packages & Pricing with validation
  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenPackages || tokenPackages.length === 0) {
      showNotice('error', 'Please configure at least one token bundle package.');
      return;
    }

    // Validate and normalize packages
    const sanitizedPackages: TokenPackage[] = tokenPackages.map((pkg, idx) => {
      const tokens = Math.max(1, parseInt(String(pkg.tokens), 10) || 100);
      const priceCents = Math.max(1, parseInt(String(pkg.priceCents), 10) || 99);
      const bonusTokens = Math.max(0, parseInt(String(pkg.bonusTokens || 0), 10) || 0);
      const label = (pkg.label || '').trim() || `${tokens} Tokens Pack`;
      const id = (pkg.id || '').trim() || `pack-${tokens}-${idx}`;
      const badge = (pkg.badge || '').trim();

      return {
        id,
        tokens,
        priceCents,
        label,
        bonusTokens: bonusTokens > 0 ? bonusTokens : undefined,
        badge: badge ? badge : undefined,
        popular: !!pkg.popular,
      };
    });

    const parsedRate = Math.max(1, parseInt(exchangeRateCents, 10) || 5);

    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            TOKEN_PACKAGES: sanitizedPackages,
            TOKEN_EXCHANGE_RATE_CENTS: parsedRate,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTokenPackages(sanitizedPackages);
        showNotice('success', 'Token packages and pricing published live in real time!');
        await reloadConfig();
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

  // Reorder packages
  const handleMovePackage = (index: number, direction: 'up' | 'down') => {
    setTokenPackages((prev) => {
      const targetIdx = direction === 'up' ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  // Duplicate / Clone package
  const handleDuplicatePackage = (index: number) => {
    setTokenPackages((prev) => {
      const target = prev[index];
      if (!target) return prev;
      const copy = [...prev];
      const cloned: TokenPackage = {
        ...target,
        id: `pack-${Date.now()}`,
        label: `${target.label || `${target.tokens} Tokens`} (Copy)`,
        popular: false,
      };
      copy.splice(index + 1, 0, cloned);
      return copy;
    });
    showNotice('success', 'Package tier cloned');
  };

  // Reset to default recommended packages
  const handleResetPricingToDefaults = () => {
    if (confirm('Reset all token packages to platform recommended defaults? Click "Save & Publish" afterwards to apply.')) {
      setTokenPackages(JSON.parse(JSON.stringify(DEFAULT_PACKAGES)));
      setExchangeRateCents('5');
      showNotice('success', 'Packages reset to platform defaults (click Save & Publish to save)');
    }
  };

  const handleAddPackage = () => {
    const newId = `pack-${Date.now()}`;
    const newPkg: TokenPackage = {
      id: newId,
      tokens: 500,
      priceCents: 2499,
      label: '500 Tokens Pack',
      bonusTokens: 50,
      badge: '',
      popular: false,
    };
    setTokenPackages((prev) => [...prev, newPkg]);
  };

  const handleRemovePackage = (index: number) => {
    if (tokenPackages.length <= 1) {
      showNotice('error', 'You must have at least one active token package for user purchases');
      return;
    }
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

  // Toggle and Save Payment Methods
  const togglePaymentMethod = (key: string) => {
    setPaymentMethods((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSavePayments = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            PAYMENT_METHODS_CONFIG: paymentMethods,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotice('success', 'Payment gateway availability saved! Changes applied platform-wide instantly.');
        reloadConfig();
      } else {
        showNotice('error', data.error || 'Failed to update payment gateways');
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
            href="/vods"
            className="btn-glow-purple px-3.5 py-2 rounded-xl text-xs font-black text-white flex items-center gap-1.5 transition shadow"
          >
            <Film className="w-3.5 h-3.5" />
            <span>VOD CRUD</span>
          </Link>

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

        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'payments'
              ? 'bg-brandPurple text-white shadow-lg shadow-brandPurple/20'
              : 'text-gray-400 hover:text-white hover:bg-surfaceLight'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payment Gateways</span>
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

          {/* Platform Audience & Content Classification */}
          <div className="space-y-2 pt-2 border-t border-surfaceBorder">
            <div>
              <label className="text-xs font-bold text-white uppercase tracking-wider block">
                Platform Audience & Content Classification Mode *
              </label>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Determine the regulatory posture, age gates, compliance badges, and safety rules for the entire site.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {/* ADULT ONLY 18+ */}
              <div
                onClick={() => setContentRating('ADULT')}
                className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between gap-3 ${
                  contentRating === 'ADULT'
                    ? 'bg-rose-500/15 border-rose-500 text-white shadow-md'
                    : 'bg-surfaceLight/40 border-surfaceBorder text-gray-400 hover:border-gray-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg">🔞</span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        contentRating === 'ADULT' ? 'bg-rose-500 text-white' : 'bg-surfaceLight text-gray-400'
                      }`}
                    >
                      18+ Adult
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-white">Adult Only (18+)</h4>
                  <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">
                    Mandatory 18+ age verification gate, 18 U.S.C. § 2257 record-keeping statement, and adult economy disclaimers.
                  </p>
                </div>
                <div className="text-[10px] font-semibold text-rose-400">
                  • 18+ DOB Gate Active<br />
                  • 2257 Record-Keeping Active
                </div>
              </div>

              {/* KIDS & FAMILY SAFE */}
              <div
                onClick={() => setContentRating('KIDS')}
                className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between gap-3 ${
                  contentRating === 'KIDS'
                    ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md'
                    : 'bg-surfaceLight/40 border-surfaceBorder text-gray-400 hover:border-gray-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg">🧸</span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        contentRating === 'KIDS' ? 'bg-emerald-500 text-white' : 'bg-surfaceLight text-gray-400'
                      }`}
                    >
                      Kids Safe
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-white">Kids & Family Safe</h4>
                  <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">
                    Child & family safe streaming (cartoons, gaming, arts, learning). COPPA compliant, no 18+ gate popup.
                  </p>
                </div>
                <div className="text-[10px] font-semibold text-emerald-400">
                  • 18+ Gate Bypassed<br />
                  • Family Safety Rules Active
                </div>
              </div>

              {/* GENERAL AUDIENCE */}
              <div
                onClick={() => setContentRating('GENERAL')}
                className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between gap-3 ${
                  contentRating === 'GENERAL'
                    ? 'bg-blue-500/15 border-blue-500 text-white shadow-md'
                    : 'bg-surfaceLight/40 border-surfaceBorder text-gray-400 hover:border-gray-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg">🎮</span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        contentRating === 'GENERAL' ? 'bg-blue-500 text-white' : 'bg-surfaceLight text-gray-400'
                      }`}
                    >
                      All Ages
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-white">General / Standard (All Ages)</h4>
                  <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">
                    Twitch/YouTube style live broadcasts (gaming, music, podcasts, tech). Standard 13+ community guidelines.
                  </p>
                </div>
                <div className="text-[10px] font-semibold text-blue-400">
                  • Mainstream Live Stream<br />
                  • Standard 13+ Community Rules
                </div>
              </div>
            </div>
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
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-white tracking-wide">{siteName}</span>
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      contentRating === 'ADULT'
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        : contentRating === 'KIDS'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    }`}
                  >
                    {contentRating === 'ADULT'
                      ? '18+ ADULTS ONLY'
                      : contentRating === 'KIDS'
                      ? 'KIDS & FAMILY SAFE'
                      : 'ALL AGES'}
                  </span>
                </div>
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
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surfaceBorder">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-tokenGold" />
                <span>Token Pricing & Packages Organizer</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold tracking-wide">
                  REAL-TIME SYNC
                </span>
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Customize token tiers, purchase prices in USD, bonus incentives, badges, and reorder bundles. All changes sync immediately to active viewers.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResetPricingToDefaults}
                className="px-3 py-2 rounded-xl bg-surfaceLight hover:bg-gray-700/50 text-gray-300 text-xs font-semibold flex items-center gap-1.5 transition border border-surfaceBorder"
                title="Restore platform recommended packages"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>
              <button
                type="button"
                onClick={handleAddPackage}
                className="px-3.5 py-2 rounded-xl bg-brandPurple/20 hover:bg-brandPurple/30 border border-brandPurple/40 text-brandPurple text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Package</span>
              </button>
            </div>
          </div>

          {/* Exchange Rate Parameter & Economics Summary */}
          <div className="p-4 rounded-xl bg-surfaceLight/40 border border-surfaceBorder grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <span>Baseline Token Exchange Value</span>
                <span className="text-[10px] text-gray-400 font-normal">(Streamer Cashout Rate)</span>
              </label>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Conversion rate used when streamers request cashouts for received tip tokens.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-start md:justify-end gap-3">
              <div className="flex items-center gap-2 bg-surfaceLight px-3 py-1.5 rounded-lg border border-surfaceBorder">
                <span className="text-xs text-gray-400">1 Token =</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={exchangeRateCents}
                  onChange={(e) => setExchangeRateCents(e.target.value)}
                  className="w-14 px-2 py-1 rounded bg-black/40 border border-surfaceBorder text-white text-xs font-bold text-center focus:outline-none focus:border-brandPurple"
                />
                <span className="text-xs font-bold text-emerald-400">¢ Cents</span>
              </div>
              <div className="text-[11px] text-gray-400 bg-black/30 px-3 py-2 rounded-lg border border-surfaceBorder/60">
                1,000 Tokens = <strong className="text-white">${((1000 * (parseInt(exchangeRateCents, 10) || 5)) / 100).toFixed(2)} USD</strong>
              </div>
            </div>
          </div>

          {/* Package Cards List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                Configured Bundles ({tokenPackages.length})
              </span>
              <span className="text-[11px] text-gray-400">
                Use arrows to change display order for viewers
              </span>
            </div>

            {tokenPackages.map((pkg, idx) => {
              const totalTokens = (pkg.tokens || 0) + (pkg.bonusTokens || 0);
              const priceUsd = ((pkg.priceCents || 0) / 100);
              const unitRate = totalTokens > 0 ? (priceUsd / totalTokens).toFixed(4) : '0.0000';

              return (
                <div
                  key={pkg.id || idx}
                  className={`p-4 rounded-xl border transition space-y-3.5 ${
                    pkg.popular
                      ? 'bg-brandPurple/10 border-brandPurple/40 shadow-sm ring-1 ring-brandPurple/20'
                      : 'bg-surfaceLight/50 border-surfaceBorder'
                  }`}
                >
                  {/* Card Header: Reorder & Actions */}
                  <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-surfaceBorder/60">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-surfaceLight text-white text-xs font-black border border-surfaceBorder">
                        Tier #{idx + 1}
                      </span>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMovePackage(idx, 'up')}
                          className="p-1 rounded bg-surfaceLight hover:bg-surfaceLight/80 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === tokenPackages.length - 1}
                          onClick={() => handleMovePackage(idx, 'down')}
                          className="p-1 rounded bg-surfaceLight hover:bg-surfaceLight/80 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {pkg.popular && (
                        <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[9px] font-extrabold uppercase shadow-sm">
                          ★ FEATURED
                        </span>
                      )}
                      {pkg.badge && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-extrabold uppercase">
                          {pkg.badge}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-400 hidden sm:inline">
                        Unit Rate: <strong className="text-emerald-400">${unitRate}</strong> / tkn
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDuplicatePackage(idx)}
                        className="p-1.5 rounded-lg bg-surfaceLight hover:bg-brandPurple/20 text-gray-400 hover:text-brandPurple transition"
                        title="Duplicate this bundle"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemovePackage(idx)}
                        className="p-1.5 rounded-lg bg-surfaceLight hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition"
                        title="Delete this bundle"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Form Inputs Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
                    {/* 1. Label */}
                    <div className="space-y-1 lg:col-span-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Package Name / Title</label>
                      <input
                        type="text"
                        value={pkg.label || ''}
                        placeholder={`${pkg.tokens} Tokens Pack`}
                        onChange={(e) => handleUpdatePackage(idx, 'label', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-surfaceLight border border-surfaceBorder text-white text-xs font-bold focus:outline-none focus:border-brandPurple"
                      />
                    </div>

                    {/* 2. Custom Badge */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Custom Badge</label>
                      <input
                        type="text"
                        value={pkg.badge || ''}
                        placeholder="e.g. BEST VALUE"
                        onChange={(e) => handleUpdatePackage(idx, 'badge', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-surfaceLight border border-surfaceBorder text-amber-300 text-xs font-bold focus:outline-none focus:border-brandPurple"
                      />
                    </div>

                    {/* 3. Tokens Amount */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Tokens</label>
                      <input
                        type="number"
                        min="1"
                        step="10"
                        value={pkg.tokens}
                        onChange={(e) => handleUpdatePackage(idx, 'tokens', parseInt(e.target.value, 10) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-surfaceLight border border-surfaceBorder text-white text-xs font-bold focus:outline-none focus:border-brandPurple"
                      />
                    </div>

                    {/* 4. Price in USD */}
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

                    {/* 5. Bonus Tokens */}
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
                  </div>

                  {/* Featured / Popular Toggle */}
                  <div className="pt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdatePackage(idx, 'popular', !pkg.popular)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                          pkg.popular
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-400 shadow-sm'
                            : 'bg-surfaceLight text-gray-400 border-surfaceBorder hover:text-white'
                        }`}
                      >
                        <span>{pkg.popular ? '★ Highlighted / Popular Tier' : '☆ Normal Tier'}</span>
                      </button>
                      <span className="text-[11px] text-gray-400 hidden sm:inline">
                        {pkg.popular
                          ? 'Featured prominently with glowing card in checkout modal.'
                          : 'Displayed with standard border styling.'}
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-400">
                      Total Tokens: <strong className="text-tokenGold">{totalTokens}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Customer View Live Preview */}
          <div className="p-4 rounded-2xl bg-surfaceLight/30 border border-surfaceBorder space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Live Customer Checkout Preview
                </span>
              </div>
              <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20 font-semibold">
                Auto-Updates As You Edit
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              This preview shows exactly how viewers will see and select token packages in the checkout modal:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {tokenPackages.map((pkg, pIdx) => {
                const isSelected = pIdx === 0;
                return (
                  <div
                    key={pkg.id || pIdx}
                    className={`relative rounded-xl p-3 border flex flex-col justify-between transition ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/40'
                        : pkg.popular
                        ? 'border-brandPurple/60 bg-brandPurple/10 shadow-sm'
                        : 'border-surfaceBorder bg-surfaceLight/60'
                    }`}
                  >
                    {(pkg.badge || pkg.popular) && (
                      <span
                        className={`absolute -top-2 right-1.5 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow ${
                          pkg.popular
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-purple-500/20 ring-1 ring-purple-400/40'
                            : 'bg-gradient-to-r from-amber-500 to-amber-600 text-black'
                        }`}
                      >
                        {pkg.badge || 'POPULAR'}
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-gray-400 font-medium truncate">
                          {pkg.label || `${pkg.tokens} Tokens`}
                        </span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-tokenGold shrink-0" />}
                      </div>

                      <div className="flex items-baseline gap-1 my-0.5">
                        <Coins className="w-3.5 h-3.5 text-tokenGold shrink-0" />
                        <span className="text-lg font-black text-white">{pkg.tokens}</span>
                        <span className="text-[10px] text-tokenGold font-semibold">TKN</span>
                      </div>

                      {pkg.bonusTokens && pkg.bonusTokens > 0 ? (
                        <div className="text-[9px] text-emerald-400 font-medium flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 shrink-0" /> +{pkg.bonusTokens} Bonus
                        </div>
                      ) : (
                        <div className="text-[9px] text-gray-500">Standard Pack</div>
                      )}
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-surfaceBorder/60 flex justify-between items-center text-[11px]">
                      <span className="text-gray-400">Price</span>
                      <span className="font-bold text-white">${((pkg.priceCents || 0) / 100).toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Save Action Bar */}
          <div className="pt-4 border-t border-surfaceBorder flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-gray-400">
              Publishing will update packages across all connected browsers instantaneously.
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleAddPackage}
                className="px-4 py-2.5 rounded-xl bg-surfaceLight hover:bg-gray-700/50 text-gray-300 text-xs font-semibold flex items-center gap-1.5 transition border border-surfaceBorder"
              >
                <Plus className="w-4 h-4" />
                <span>Add Tier</span>
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-glow-purple px-6 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Publishing Live...' : 'Save & Publish Token Packages'}</span>
              </button>
            </div>
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

          {/* Payment Gateway & Whitelisting Diagnostic Card */}
          <div className="p-5 rounded-2xl bg-surfaceLight/50 border border-brandPurple/30 space-y-3 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-brandPurple" />
                  <span>Production Server Outbound IP (Payment Whitelist)</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Required by <strong>SasPay</strong>, <strong>VaultPay</strong>, and Banks to whitelist automated streamer payout requests.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchOutboundIp}
                disabled={ipLoading}
                className="btn-glow-purple px-3.5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${ipLoading ? 'animate-spin' : ''}`} />
                <span>{ipLoading ? 'Checking...' : 'Check Live Server IP'}</span>
              </button>
            </div>

            {outboundIp ? (
              <div className="p-3.5 rounded-xl bg-black/70 border border-surfaceBorder flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Live Egress / Outbound IP Address:</span>
                  <span className="text-base font-mono font-black text-emerald-400">{outboundIp}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(outboundIp);
                    showNotice('success', `Copied outbound IP: ${outboundIp}`);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-surfaceLight hover:bg-gray-700 text-xs font-bold text-white border border-surfaceBorder transition"
                >
                  Copy IP Address
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">
                Click <strong>"Check Live Server IP"</strong> above to detect the public IP address your production server uses when contacting SasPay.
              </p>
            )}
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

      {/* TAB 5: PAYMENT GATEWAYS & METHODS */}
      {activeTab === 'payments' && (
        <form onSubmit={handleSavePayments} className="p-6 rounded-2xl glass-panel border border-surfaceBorder space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surfaceBorder">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-brandPurple" />
                <span>Payment Gateways & Methods Management</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Enable or disable payment options in real-time. Deactivated methods are immediately hidden on user purchase modals and blocked at the API level.
              </p>
            </div>

            {/* Quick Status Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surfaceLight border border-surfaceBorder shrink-0">
              <span className="text-[11px] text-gray-400 font-medium">Active Channels:</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">
                {Object.values(paymentMethods).filter(Boolean).length} / 4
              </span>
            </div>
          </div>

          {/* Gateway Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. SASPAY (Mobile Money) */}
            <div
              className={`p-5 rounded-2xl border transition flex flex-col justify-between gap-4 ${
                paymentMethods.SASPAY
                  ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                  : 'bg-surfaceLight/30 border-surfaceBorder opacity-75'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>SasPay Mobile Money</span>
                        {paymentMethods.SASPAY ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-zinc-700/50 text-gray-400 text-[10px] font-bold">
                            DISABLED
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-emerald-400/80 font-mono">Gateway: saspay.me</p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => togglePaymentMethod('SASPAY')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      paymentMethods.SASPAY ? 'bg-emerald-500' : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                        paymentMethods.SASPAY ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    >
                      {paymentMethods.SASPAY ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <X className="w-3 h-3 text-gray-400" />
                      )}
                    </span>
                  </button>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">
                  African mobile money aggregator with instant STK push and payment links. Supports Côte d&apos;Ivoire, Sénégal, Bénin, Cameroun, Togo, Mali, Burkina Faso, Gabon, and DR Congo.
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['Wave', 'Orange Money', 'MTN MoMo', 'Moov Money', 'Djamo', 'Airtel Money'].map((op) => (
                    <span
                      key={op}
                      className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300/90 text-[10px] font-semibold border border-emerald-500/20"
                    >
                      {op}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-emerald-500/10 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-400">Supported Currencies:</span>
                  <span className="font-mono text-gray-200 font-medium">XOF, XAF, GNF, CDF</span>
                </div>

                {/* API Diagnostic Tester */}
                <div className="pt-2 border-t border-emerald-500/10">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-gray-400 font-semibold">Gateway Connection:</span>
                    <button
                      type="button"
                      disabled={testingSasPay}
                      onClick={handleTestSasPay}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1.5 transition"
                    >
                      {testingSasPay ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Pinging SasPay API...</span>
                        </>
                      ) : (
                        <span>Test SasPay Connection</span>
                      )}
                    </button>
                  </div>

                  {sasPayTestResult && (
                    <div
                      className={`mt-2 p-2.5 rounded-xl text-[11px] font-medium leading-relaxed border ${
                        sasPayTestResult.success
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-red-500/10 border-red-500/30 text-red-300'
                      }`}
                    >
                      <div className="flex items-start gap-1.5">
                        {sasPayTestResult.success ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-0.5">
                          <p className="font-bold">{sasPayTestResult.message}</p>
                          {sasPayTestResult.outboundIp && (
                            <p className="text-[10px] text-gray-400 font-mono">
                              Server Outbound IP: <strong className="text-white">{sasPayTestResult.outboundIp}</strong>
                            </p>
                          )}
                          {sasPayTestResult.maskedKey && (
                            <p className="text-[10px] text-gray-400 font-mono">
                              Key: <strong className="text-white">{sasPayTestResult.maskedKey}</strong>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. VAULTPAY (Credit & Debit Cards) */}
            <div
              className={`p-5 rounded-2xl border transition flex flex-col justify-between gap-4 ${
                paymentMethods.VAULTPAY
                  ? 'bg-cyan-950/20 border-cyan-500/40 shadow-lg shadow-cyan-500/5'
                  : 'bg-surfaceLight/30 border-surfaceBorder opacity-75'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>VaultPay Card Processing</span>
                        {paymentMethods.VAULTPAY ? (
                          <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-zinc-700/50 text-gray-400 text-[10px] font-bold">
                            DISABLED
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-cyan-400/80 font-mono">Gateway: vaultpay.me</p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => togglePaymentMethod('VAULTPAY')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      paymentMethods.VAULTPAY ? 'bg-cyan-500' : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                        paymentMethods.VAULTPAY ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    >
                      {paymentMethods.VAULTPAY ? (
                        <Check className="w-3 h-3 text-cyan-600" />
                      ) : (
                        <X className="w-3 h-3 text-gray-400" />
                      )}
                    </span>
                  </button>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">
                  International credit & debit card processing with 3D Secure verification. Allows global users from North America, Europe, and worldwide to purchase tokens smoothly.
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['Visa', 'Mastercard', 'Virtual Cards', '3D Secure 2.0'].map((op) => (
                    <span
                      key={op}
                      className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300/90 text-[10px] font-semibold border border-cyan-500/20"
                    >
                      {op}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-cyan-500/10 flex items-center justify-between text-[11px]">
                <span className="text-gray-400">Supported Currencies:</span>
                <span className="font-mono text-gray-200 font-medium">USD, EUR, GBP, CAD</span>
              </div>
            </div>

            {/* 3. CRYPTO (NOWPayments) */}
            <div
              className={`p-5 rounded-2xl border transition flex flex-col justify-between gap-4 ${
                paymentMethods.CRYPTO
                  ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-500/5'
                  : 'bg-surfaceLight/30 border-surfaceBorder opacity-75'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Bitcoin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>NOWPayments Crypto</span>
                        {paymentMethods.CRYPTO ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-zinc-700/50 text-gray-400 text-[10px] font-bold">
                            DISABLED
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-amber-400/80 font-mono">Gateway: nowpayments.io</p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => togglePaymentMethod('CRYPTO')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      paymentMethods.CRYPTO ? 'bg-amber-500' : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                        paymentMethods.CRYPTO ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    >
                      {paymentMethods.CRYPTO ? (
                        <Check className="w-3 h-3 text-amber-600" />
                      ) : (
                        <X className="w-3 h-3 text-gray-400" />
                      )}
                    </span>
                  </button>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">
                  Decentralized cryptocurrency payment gateway. Non-custodial token settlement with automated on-chain transaction confirmation and instant wallet crediting.
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['USDT (TRC20)', 'USDT (ERC20)', 'Bitcoin (BTC)', 'Ethereum (ETH)', 'Solana (SOL)', 'USDC'].map((op) => (
                    <span
                      key={op}
                      className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300/90 text-[10px] font-semibold border border-amber-500/20"
                    >
                      {op}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-amber-500/10 flex items-center justify-between text-[11px]">
                <span className="text-gray-400">Confirmation Speed:</span>
                <span className="font-mono text-gray-200 font-medium">1 - 5 mins (On-chain)</span>
              </div>
            </div>

            {/* 4. MOCK SANDBOX SIMULATOR */}
            <div
              className={`p-5 rounded-2xl border transition flex flex-col justify-between gap-4 ${
                paymentMethods.MOCK
                  ? 'bg-purple-950/20 border-purple-500/40 shadow-lg shadow-purple-500/5'
                  : 'bg-surfaceLight/30 border-surfaceBorder opacity-75'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Sandbox Test Simulator</span>
                        {paymentMethods.MOCK ? (
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-zinc-700/50 text-gray-400 text-[10px] font-bold">
                            DISABLED
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-purple-400/80 font-mono">Environment: Local QA / Mock</p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => togglePaymentMethod('MOCK')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      paymentMethods.MOCK ? 'bg-brandPurple' : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                        paymentMethods.MOCK ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    >
                      {paymentMethods.MOCK ? (
                        <Check className="w-3 h-3 text-brandPurple" />
                      ) : (
                        <X className="w-3 h-3 text-gray-400" />
                      )}
                    </span>
                  </button>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">
                  Virtual checkout simulator for development and staging testing. Users can test token crediting with zero real money. Keep disabled in production unless conducting QA testing.
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['Zero Cost', 'Instant Credit', 'Test Environment', 'Staging QA'].map((op) => (
                    <span
                      key={op}
                      className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300/90 text-[10px] font-semibold border border-purple-500/20"
                    >
                      {op}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-purple-500/10 flex items-center justify-between text-[11px]">
                <span className="text-gray-400">Safety Recommendation:</span>
                <span className="font-mono text-amber-400 font-medium">{paymentMethods.MOCK ? '⚠️ Keep off in live production' : '✅ Disabled (Safe)'}</span>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-surfaceBorder flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-gray-400">
              Saving updates the database configuration and broadcasts a <code className="text-brandPurple font-mono font-bold">site_settings_updated</code> event immediately.
            </p>
            <button
              type="submit"
              disabled={saving}
              className="btn-glow-purple px-6 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 shadow"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Gateways...' : 'Save Payment Gateways'}</span>
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

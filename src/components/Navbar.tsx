'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useSiteConfig } from '@/context/SiteConfigContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  Radio,
  Coins,
  Plus,
  Video,
  Shield,
  User,
  LogOut,
  ChevronDown,
  CheckCircle2,
  Film,
  Building2,
  Megaphone,
  LayoutGrid,
  Gamepad2,
  MessageSquare,
  Palette,
  Sparkles,
  Music,
  Tv,
  Menu,
  X,
} from 'lucide-react';
import AdPlacement from '@/components/ads/AdPlacement';

const ADULT_CATEGORIES = ['Gaming & Music', 'Creative Arts', 'Just Chatting', 'Interactive Shows'];
const KIDS_CATEGORIES = ['Cartoons & Animation', 'Family Gaming', 'Learning & Crafts', 'Music & Fun'];
const GENERAL_CATEGORIES = ['Gaming & Esports', 'Creative & Art', 'Music & Performance', 'Podcasts & Tech'];

const getCategoryIcon = (category: string) => {
  const lower = category.toLowerCase();
  if (lower.includes('game') || lower.includes('gaming') || lower.includes('esport')) return Gamepad2;
  if (lower.includes('chat') || lower.includes('discussion')) return MessageSquare;
  if (lower.includes('art') || lower.includes('creative') || lower.includes('craft')) return Palette;
  if (lower.includes('music') || lower.includes('fun')) return Music;
  if (lower.includes('cartoon') || lower.includes('show') || lower.includes('podcast')) return Tv;
  return Sparkles;
};

export default function Navbar() {
  const { user, logout, openPurchaseModal, openCampaignModal } = useAuth();
  const { siteName, siteTagline, contentRating } = useSiteConfig();
  const { t } = useLanguage();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const categoriesRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const categories =
    contentRating === 'KIDS'
      ? KIDS_CATEGORIES
      : contentRating === 'GENERAL'
      ? GENERAL_CATEGORIES
      : ADULT_CATEGORIES;

  // Handle click outside and Escape key to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoriesRef.current && !categoriesRef.current.contains(event.target as Node)) {
        setCategoriesOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setCategoriesOpen(false);
        setDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-surfaceBorder/80 glass-panel">
      <AdPlacement placement="HEADER_TOP" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Brand Logo & Navigation */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative p-2 rounded-xl bg-gradient-to-tr from-brandPurple to-brandPink text-white shadow-lg shadow-purple-500/20 group-hover:scale-105 transition">
              <Radio className="w-5 h-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background animate-ping" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5 uppercase">
                <span>{siteName}</span>
                {contentRating === 'ADULT' ? (
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    18+
                  </span>
                ) : contentRating === 'KIDS' ? (
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Kids
                  </span>
                ) : null}
              </span>
              <span className="text-[9px] tracking-widest text-gray-400 uppercase -mt-1 font-bold truncate max-w-[160px]">
                {siteTagline || (contentRating === 'KIDS' ? 'Kids & Family Safe' : contentRating === 'GENERAL' ? 'Live Streaming' : 'Live Cam')}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
            <Link href="/" className="text-gray-200 hover:text-white transition">
              {t('nav.liveDirectory', 'Live Directory')}
            </Link>
            <Link href="/explore" className="text-pink-400 hover:text-white flex items-center gap-1.5 transition font-semibold">
              <Radio className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
              <span>{t('nav.explore', 'Explore (Swipe Feed)')}</span>
            </Link>
            <Link href="/vods" className="text-purple-300 hover:text-white flex items-center gap-1.5 transition font-semibold">
              <Film className="w-3.5 h-3.5 text-brandPurple" />
              <span>{t('nav.vods', 'VODs & Replays')}</span>
            </Link>

            {/* Categories Dropdown Menu */}
            <div className="relative" ref={categoriesRef}>
              <button
                type="button"
                onClick={() => setCategoriesOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition ${
                  categoriesOpen
                    ? 'text-white bg-surfaceLight border border-surfaceBorder shadow-inner'
                    : 'text-gray-300 hover:text-white hover:bg-surfaceLight/60'
                }`}
                aria-expanded={categoriesOpen}
                aria-haspopup="true"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-brandPurple" />
                <span>{t('nav.categories', 'Categories')}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${categoriesOpen ? 'rotate-180' : ''}`} />
              </button>

              {categoriesOpen && (
                <div className="absolute left-0 mt-2 w-64 rounded-2xl glass-dropdown shadow-2xl p-2 z-50 animate-fade-in border border-surfaceBorder/80">
                  <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                    {contentRating === 'KIDS' ? 'Kids Categories' : contentRating === 'GENERAL' ? 'Browse Categories' : 'Live Categories'}
                  </div>
                  <div className="space-y-0.5 mt-1">
                    <Link
                      href="/"
                      onClick={() => setCategoriesOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-200 hover:text-white hover:bg-surfaceLight transition group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-brandPurple group-hover:scale-105 transition">
                        <Radio className="w-3.5 h-3.5 animate-pulse" />
                      </div>
                      <div>
                        <div className="font-bold text-white">{t('nav.allCategories', 'All Categories')}</div>
                        <div className="text-[10px] text-gray-400">Explore all live rooms</div>
                      </div>
                    </Link>

                    <div className="h-px bg-surfaceBorder/60 my-1" />

                    {categories.map((cat) => {
                      const Icon = getCategoryIcon(cat);
                      return (
                        <Link
                          key={cat}
                          href={`/?category=${encodeURIComponent(cat)}`}
                          onClick={() => setCategoriesOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-300 hover:text-white hover:bg-surfaceLight transition group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-surfaceLight border border-surfaceBorder flex items-center justify-center text-gray-400 group-hover:text-brandPurple group-hover:border-purple-500/30 transition">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-semibold">{cat}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right: Actions, Wallet, Studio, User Menu & Mobile Toggle */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {user ? (
            <>
              {/* Wallet Balance Pill */}
              <div className="flex items-center rounded-xl bg-surfaceLight border border-surfaceBorder p-1 pl-3 shadow-inner">
                <div className="flex items-center gap-1.5 mr-2">
                  <Coins className="w-4 h-4 text-tokenGold" />
                  <span className="text-sm font-extrabold text-white">
                    {user.wallet?.balance ?? 0}
                  </span>
                  <span className="text-[11px] text-tokenGold font-semibold hidden sm:inline">{t('nav.tokens', 'Tokens')}</span>
                </div>
                <button
                  onClick={openPurchaseModal}
                  title={t('nav.buyTokens', 'Buy Tokens')}
                  className="btn-glow-gold p-1.5 rounded-lg text-black hover:scale-105 transition flex items-center justify-center"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>

              {/* Streamer Studio Button */}
              {(user.role === 'STREAMER' || user.role === 'ADMIN') && (
                <Link
                  href="/dashboard/streamer"
                  className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 hover:text-white text-xs font-bold transition shadow-sm"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>{t('nav.studio', 'Go Live Studio')}</span>
                </Link>
              )}

              {/* Agency Portal Button */}
              {(user.role === 'AGENCY' || user.role === 'ADMIN') && (
                <Link
                  href="/dashboard/agency"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-600/30 hover:text-white text-xs font-bold transition shadow-sm"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Agency Portal</span>
                </Link>
              )}

              {/* Admin Panel Button */}
              {user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 text-xs font-bold transition"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{t('nav.admin', 'Admin')}</span>
                </Link>
              )}

              {/* User Dropdown */}
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder hover:border-gray-600 transition"
                  aria-expanded={dropdownOpen}
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                    {user.username.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-gray-200 hidden md:inline">{user.username}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-dropdown shadow-2xl py-2 z-50 animate-fade-in border border-surfaceBorder/80">
                    <div className="px-4 py-2 border-b border-surfaceBorder/60">
                      <p className="text-xs font-bold text-white flex items-center gap-1">
                        {user.username}
                        {user.ageVerified && (
                          <span title="Age Verified 18+">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-surfaceLight text-brandPurple border border-surfaceBorder uppercase">
                        {user.role}
                      </span>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          openPurchaseModal();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-amber-400 hover:bg-surfaceLight flex items-center gap-2 transition"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>{t('nav.getTokens', 'Get Tokens')}</span>
                      </button>

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          openCampaignModal();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-pink-300 hover:bg-surfaceLight hover:text-white flex items-center gap-2 transition"
                      >
                        <Megaphone className="w-3.5 h-3.5 text-pink-400" />
                        <span>Launch Ad Campaign</span>
                      </button>

                      {(user.role === 'STREAMER' || user.role === 'ADMIN') && (
                        <>
                          <Link
                            href="/dashboard/streamer"
                            onClick={() => setDropdownOpen(false)}
                            className="block px-4 py-2 text-xs text-gray-300 hover:bg-surfaceLight hover:text-white flex items-center gap-2 transition"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>{t('nav.broadcastStudio', 'Broadcast Studio')}</span>
                          </Link>
                          <Link
                            href="/dashboard/streamer/payouts"
                            onClick={() => setDropdownOpen(false)}
                            className="block px-4 py-2 text-xs text-gray-300 hover:bg-surfaceLight hover:text-white flex items-center gap-2 transition"
                          >
                            <Coins className="w-3.5 h-3.5" />
                            <span>{t('nav.earnings', 'Earnings & Payouts')}</span>
                          </Link>
                          <Link
                            href="/dashboard/streamer/vods"
                            onClick={() => setDropdownOpen(false)}
                            className="block px-4 py-2 text-xs text-purple-300 hover:bg-surfaceLight hover:text-white flex items-center gap-2 transition"
                          >
                            <Film className="w-3.5 h-3.5 text-brandPurple" />
                            <span>{t('nav.vodManager', 'VOD Manager')}</span>
                          </Link>
                        </>
                      )}

                      {(user.role === 'AGENCY' || user.role === 'ADMIN') && (
                        <Link
                          href="/dashboard/agency"
                          onClick={() => setDropdownOpen(false)}
                          className="block px-4 py-2 text-xs text-cyan-300 hover:bg-surfaceLight hover:text-white flex items-center gap-2 transition"
                        >
                          <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Agency Portal</span>
                        </Link>
                      )}

                      {user.role === 'ADMIN' && (
                        <Link
                          href="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="block px-4 py-2 text-xs text-red-400 hover:bg-surfaceLight flex items-center gap-2 transition"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>{t('nav.adminDashboard', 'Admin Dashboard')}</span>
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-surfaceBorder/60 pt-1">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t('nav.signout', 'Sign Out')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-surfaceLight transition"
              >
                {t('nav.login', 'Log In')}
              </Link>
              <Link
                href="/register"
                className="btn-glow-purple px-4 py-2 rounded-xl text-xs font-bold text-white transition shadow-sm"
              >
                {t('nav.signup', 'Sign Up (18+)')}
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-gray-300 hover:text-white transition"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-surfaceBorder/80 glass-dropdown p-4 space-y-3 animate-fade-in shadow-2xl">
          <div className="space-y-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-gray-200 hover:bg-surfaceLight transition"
            >
              <Radio className="w-4 h-4 text-brandPurple" />
              <span>{t('nav.liveDirectory', 'Live Directory')}</span>
            </Link>
            <Link
              href="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-pink-400 hover:bg-surfaceLight transition"
            >
              <Radio className="w-4 h-4 text-pink-400 animate-pulse" />
              <span>{t('nav.explore', 'Explore (Swipe Feed)')}</span>
            </Link>
            <Link
              href="/vods"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-purple-300 hover:bg-surfaceLight transition"
            >
              <Film className="w-4 h-4 text-brandPurple" />
              <span>{t('nav.vods', 'VODs & Replays')}</span>
            </Link>
          </div>

          <div className="pt-2 border-t border-surfaceBorder/60">
            <div className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <LayoutGrid className="w-3 h-3 text-brandPurple" />
              <span>{t('nav.categories', 'Categories')}</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-gray-300 hover:bg-surfaceLight hover:text-white transition"
              >
                <Radio className="w-3.5 h-3.5 text-brandPurple" />
                <span>{t('nav.allCategories', 'All Categories')}</span>
              </Link>
              {categories.map((cat) => {
                const Icon = getCategoryIcon(cat);
                return (
                  <Link
                    key={cat}
                    href={`/?category=${encodeURIComponent(cat)}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-gray-300 hover:bg-surfaceLight hover:text-white transition"
                  >
                    <Icon className="w-3.5 h-3.5 text-gray-400" />
                    <span className="truncate">{cat}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

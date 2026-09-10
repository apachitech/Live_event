'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Radio, Coins, Plus, Video, Shield, User, LogOut, ChevronDown, CheckCircle2, Film } from 'lucide-react';

export default function Navbar() {
  const { user, logout, openPurchaseModal } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-surfaceBorder/80 glass-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Brand Logo & Navigation */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative p-2 rounded-xl bg-gradient-to-tr from-brandPurple to-brandPink text-white shadow-lg shadow-purple-500/20 group-hover:scale-105 transition">
              <Radio className="w-5 h-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background animate-ping" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                PULSE<span className="text-brandPink font-light">STREAM</span>
              </span>
              <span className="text-[9px] tracking-widest text-gray-400 uppercase -mt-1 font-bold">Live Monetized Cam</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="text-gray-200 hover:text-white transition">
              Live Directory
            </Link>
            <Link href="/explore" className="text-pink-400 hover:text-white flex items-center gap-1.5 transition font-semibold">
              <Radio className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
              <span>Explore (Swipe Feed)</span>
            </Link>
            <Link href="/vods" className="text-purple-300 hover:text-white flex items-center gap-1.5 transition font-semibold">
              <Film className="w-3.5 h-3.5 text-brandPurple" />
              <span>VODs & Replays</span>
            </Link>
            <Link href="/?category=Gaming" className="text-gray-400 hover:text-gray-200 transition">
              Gaming
            </Link>
            <Link href="/?category=Chat" className="text-gray-400 hover:text-gray-200 transition">
              Chat
            </Link>
            <Link href="/?category=Creative" className="text-gray-400 hover:text-gray-200 transition">
              Creative
            </Link>
          </nav>
        </div>

        {/* Right: Actions, Wallet, Studio, and User Menu */}
        <div className="flex items-center gap-3.5">
          {user ? (
            <>
              {/* Wallet Balance Pill */}
              <div className="flex items-center rounded-xl bg-surfaceLight border border-surfaceBorder p-1 pl-3 shadow-inner">
                <div className="flex items-center gap-1.5 mr-2">
                  <Coins className="w-4 h-4 text-tokenGold" />
                  <span className="text-sm font-extrabold text-white">
                    {user.wallet?.balance ?? 0}
                  </span>
                  <span className="text-[11px] text-tokenGold font-semibold hidden sm:inline">Tokens</span>
                </div>
                <button
                  onClick={openPurchaseModal}
                  title="Buy Tokens"
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
                  <span>Go Live Studio</span>
                </Link>
              )}

              {/* Admin Panel Button */}
              {user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 text-xs font-bold transition"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </Link>
              )}

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder hover:border-gray-600 transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                    {user.username.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-gray-200 hidden md:inline">{user.username}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-dropdown shadow-2xl py-2 z-50 animate-fade-in">
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
                        <span>Get Tokens</span>
                      </button>

                      {(user.role === 'STREAMER' || user.role === 'ADMIN') && (
                        <>
                          <Link
                            href="/dashboard/streamer"
                            onClick={() => setDropdownOpen(false)}
                            className="block px-4 py-2 text-xs text-gray-300 hover:bg-surfaceLight hover:text-white flex items-center gap-2 transition"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Broadcast Studio</span>
                          </Link>
                          <Link
                            href="/dashboard/streamer/payouts"
                            onClick={() => setDropdownOpen(false)}
                            className="block px-4 py-2 text-xs text-gray-300 hover:bg-surfaceLight hover:text-white flex items-center gap-2 transition"
                          >
                            <Coins className="w-3.5 h-3.5" />
                            <span>Earnings & Payouts</span>
                          </Link>
                          <Link
                            href="/dashboard/streamer/vods"
                            onClick={() => setDropdownOpen(false)}
                            className="block px-4 py-2 text-xs text-purple-300 hover:bg-surfaceLight hover:text-white flex items-center gap-2 transition"
                          >
                            <Film className="w-3.5 h-3.5 text-brandPurple" />
                            <span>VOD Manager</span>
                          </Link>
                        </>
                      )}

                      {user.role === 'ADMIN' && (
                        <Link
                          href="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="block px-4 py-2 text-xs text-red-400 hover:bg-surfaceLight flex items-center gap-2 transition"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>Admin Dashboard</span>
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
                        <span>Sign Out</span>
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
                Log In
              </Link>
              <Link
                href="/register"
                className="btn-glow-purple px-4 py-2 rounded-xl text-xs font-bold text-white transition shadow-sm"
              >
                Sign Up (18+)
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

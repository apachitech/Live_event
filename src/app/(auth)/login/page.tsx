'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Radio, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername, password }),
      });

      const data = await res.json();
      if (res.ok) {
        await refreshUser();
        router.push('/');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err: any) {
      setError('Connection error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (email: string) => {
    setEmailOrUsername(email);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl glass-panel p-8 shadow-2xl relative border border-surfaceBorder">
        {/* Logo header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-brandPurple to-brandPink text-white mb-3 shadow-lg shadow-purple-500/20">
            <Radio className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Welcome Back</h1>
          <p className="text-xs text-gray-400 mt-1">Sign in to watch, chat, and support your favorite streamers</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Email or Username
            </label>
            <input
              type="text"
              required
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              placeholder="viewer@platform.live or username"
              className="w-full px-4 py-3 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-sm focus:outline-none focus:border-brandPurple transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-sm focus:outline-none focus:border-brandPurple transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-glow-purple py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Credentials for Fast Testing */}
        <div className="mt-6 pt-5 border-t border-surfaceBorder/80">
          <p className="text-[11px] font-semibold text-gray-400 mb-2 text-center uppercase tracking-wider">
            ⚡ 1-Click Sandbox Test Logins
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('viewer@platform.live')}
              className="px-2 py-1.5 rounded-lg bg-surfaceLight hover:bg-surfaceBorder text-[11px] text-gray-300 font-medium transition text-center"
            >
              Viewer (500🪙)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('streamer@platform.live')}
              className="px-2 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-[11px] text-purple-300 font-medium transition text-center"
            >
              Streamer 🎙️
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('admin@platform.live')}
              className="px-2 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-[11px] text-red-300 font-medium transition text-center"
            >
              Admin 🛡️
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-brandPurple hover:underline font-bold">
            Sign up (18+)
          </Link>
        </p>
      </div>
    </div>
  );
}

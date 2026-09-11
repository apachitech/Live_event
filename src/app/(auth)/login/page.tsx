'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Radio, Lock, Mail, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const { refreshUser } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedIdentifier = emailOrUsername.trim();
    if (!trimmedIdentifier || !password) {
      setError('Please enter your email or username and password');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrUsername: trimmedIdentifier,
          password,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        await refreshUser();
        // Redirect to intended page or home
        router.push(redirectUrl);
        router.refresh();
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err: any) {
      setError('Connection error: ' + (err.message || 'Please try again'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl glass-panel p-8 shadow-2xl relative border border-surfaceBorder">
      {/* Logo header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-brandPurple to-brandPink text-white mb-3 shadow-lg shadow-purple-500/20 hover:scale-105 transition-transform">
          <Radio className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-black text-white tracking-tight">Welcome Back</h1>
        <p className="text-xs text-gray-400 mt-1">Sign in to watch, chat, and support streamers</p>
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
            autoComplete="username"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            placeholder="Enter your email or username"
            className="w-full px-4 py-3 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-sm focus:outline-none focus:border-brandPurple transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 pr-11 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-sm focus:outline-none focus:border-brandPurple transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition p-1"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-glow-purple py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Authenticating...
            </span>
          ) : (
            <>
              Sign In
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-xs text-gray-400 mt-6 pt-5 border-t border-surfaceBorder/80">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-brandPurple hover:underline font-bold">
          Sign up (18+)
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="w-full max-w-md rounded-2xl glass-panel p-8 shadow-2xl border border-surfaceBorder text-center">
          <div className="w-6 h-6 border-2 border-brandPurple border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400 mt-3">Loading login...</p>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}

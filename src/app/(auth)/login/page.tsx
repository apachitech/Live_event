'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Radio, Lock, Mail, AlertCircle, CheckCircle2, ArrowRight, Eye, EyeOff } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
  const isResetSuccess = searchParams.get('reset') === 'success';
  const urlError = searchParams.get('error');

  const { refreshUser } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(urlError ? decodeURIComponent(urlError) : '');
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
      <div className="text-center mb-6">
        <Link href="/" className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-brandPurple to-brandPink text-white mb-3 shadow-lg shadow-purple-500/20 hover:scale-105 transition-transform">
          <Radio className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-black text-white tracking-tight">Welcome Back</h1>
        <p className="text-xs text-gray-400 mt-1">Sign in to watch, chat, and support streamers</p>
      </div>

      {isResetSuccess && (
        <div className="mb-5 p-3.5 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-green-400" />
          <span>Password reset successfully! Please sign in with your new password.</span>
        </div>
      )}

      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Google OAuth Login Button */}
      <a
        href={`/api/auth/google${redirectUrl !== '/' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
        className="w-full py-3 px-4 rounded-xl bg-surfaceLight hover:bg-white/10 border border-surfaceBorder hover:border-brandPurple/40 text-white text-sm font-semibold flex items-center justify-center gap-3 transition shadow-sm hover:shadow-lg hover:shadow-purple-500/10 group mb-5"
      >
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z"
          />
          <path
            fill="#4285F4"
            d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
          />
          <path
            fill="#FBBC05"
            d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.4s.2-1.6.4-2.4L1.6 7.4C.6 9.4 0 11.6 0 14s.6 4.6 1.6 6.6l3.7-2.9z"
          />
          <path
            fill="#34A853"
            d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 16c1.9 3.8 5.8 7 10.4 7z"
          />
        </svg>
        <span>Continue with Google</span>
      </a>

      {/* Divider */}
      <div className="relative flex py-1 items-center mb-5">
        <div className="flex-grow border-t border-surfaceBorder"></div>
        <span className="flex-shrink mx-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">or with credentials</span>
        <div className="flex-grow border-t border-surfaceBorder"></div>
      </div>

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
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-gray-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-brandPurple hover:text-brandPink hover:underline transition font-medium"
            >
              Forgot password?
            </Link>
          </div>
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

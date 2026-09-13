'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Radio, Lock, AlertCircle, CheckCircle2, ArrowRight, Eye, EyeOff } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Missing reset token. Please request a new password reset link.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify and try again.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login?reset=success');
        }, 2000);
      } else {
        setError(data.error || 'Failed to reset password. Token may be expired.');
      }
    } catch (err: any) {
      setError('Connection error: ' + (err.message || 'Please try again'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl glass-panel p-8 shadow-2xl relative border border-surfaceBorder">
      {/* Header */}
      <div className="text-center mb-8">
        <Link
          href="/"
          className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-brandPurple to-brandPink text-white mb-3 shadow-lg shadow-purple-500/20 hover:scale-105 transition-transform"
        >
          <Radio className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-black text-white tracking-tight">Set New Password</h1>
        <p className="text-xs text-gray-400 mt-1">Create a new secure password for your account</p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="space-y-4 text-center">
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-300 flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
            <p className="font-semibold text-green-200 text-sm">Password Reset Successful!</p>
            <p className="text-gray-300">Your password has been updated. Redirecting you to sign in...</p>
          </div>
          <Link
            href="/login"
            className="w-full btn-glow-purple py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition"
          >
            Sign In Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
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

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                className="w-full px-4 py-3 pr-11 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-sm focus:outline-none focus:border-brandPurple transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition p-1"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                Updating Password...
              </span>
            ) : (
              <>
                Reset Password
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      <p className="text-center text-xs text-gray-400 mt-6 pt-5 border-t border-surfaceBorder/80">
        Remember your password?{' '}
        <Link href="/login" className="text-brandPurple hover:underline font-bold">
          Sign In
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="w-full max-w-md rounded-2xl glass-panel p-8 shadow-2xl border border-surfaceBorder text-center">
            <div className="w-6 h-6 border-2 border-brandPurple border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-400 mt-3">Loading recovery...</p>
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}

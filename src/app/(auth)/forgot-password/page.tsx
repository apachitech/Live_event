'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Radio, Mail, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, ExternalLink } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setDevResetUrl(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your account email address');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(data.message || 'Password reset instructions have been generated.');
        if (data.devResetUrl) {
          setDevResetUrl(data.devResetUrl);
        }
      } else {
        setError(data.error || 'Failed to submit reset request. Please try again.');
      }
    } catch (err: any) {
      setError('Connection error: ' + (err.message || 'Please try again'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl glass-panel p-8 shadow-2xl relative border border-surfaceBorder">
        {/* Logo header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-brandPurple to-brandPink text-white mb-3 shadow-lg shadow-purple-500/20 hover:scale-105 transition-transform"
          >
            <Radio className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-black text-white tracking-tight">Forgot Password</h1>
          <p className="text-xs text-gray-400 mt-1">
            Enter your email to receive recovery instructions
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-300 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-400 mt-0.5" />
              <div>
                <p className="font-semibold text-green-200">Recovery Instructions Sent</p>
                <p className="text-gray-300 mt-1">{successMessage}</p>
              </div>
            </div>

            {devResetUrl && (
              <div className="p-3.5 rounded-xl bg-brandPurple/10 border border-brandPurple/30 text-xs text-purple-200 space-y-2">
                <div className="flex items-center justify-between font-bold text-brandPurple">
                  <span>Development Reset Link:</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
                <Link
                  href={devResetUrl}
                  className="block font-mono text-[11px] bg-black/40 p-2.5 rounded-lg text-brandPink hover:underline break-all"
                >
                  {devResetUrl}
                </Link>
                <p className="text-[10px] text-gray-400">Click the link above to proceed directly to resetting your password.</p>
              </div>
            )}

            <div className="pt-2">
              <Link
                href="/login"
                className="w-full btn-glow-purple py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Registered Email Address
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-3 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-sm focus:outline-none focus:border-brandPurple transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-glow-purple py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending Request...
                </span>
              ) : (
                <>
                  Send Recovery Link
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="text-center text-xs text-gray-400 mt-6 pt-5 border-t border-surfaceBorder/80 flex items-center justify-center gap-2">
          <Link href="/login" className="text-gray-400 hover:text-white flex items-center gap-1.5 transition">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

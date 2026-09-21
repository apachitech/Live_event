'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Radio, Lock, Mail, User, Calendar, ShieldCheck, AlertCircle, Sparkles, Video, Building2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'VIEWER' | 'STREAMER' | 'AGENCY'>('VIEWER');
  const [agencyName, setAgencyName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!agreeTerms) {
      setError('You must confirm under penalty of law that you are at least 18 years of age.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          password,
          role,
          agencyName: role === 'AGENCY' ? (agencyName || username) : undefined,
          birthDate,
          agreeAgeVerification: agreeTerms,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        await refreshUser();
        router.push(
          role === 'STREAMER'
            ? '/dashboard/streamer'
            : role === 'AGENCY'
            ? '/dashboard/agency'
            : '/'
        );
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err: any) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-lg rounded-2xl glass-panel p-8 shadow-2xl relative border border-surfaceBorder">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-brandPurple to-brandPink text-white mb-3 shadow-lg shadow-purple-500/20">
            <Radio className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Create Your Account</h1>
          <p className="text-xs text-gray-400 mt-1">Join PulseStream — 100 Starter Tokens included upon signup!</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Google OAuth Signup Button */}
        <a
          href={`/api/auth/google?role=${role}`}
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
          <span>Sign up with Google</span>
        </a>

        {/* Divider */}
        <div className="relative flex py-1 items-center mb-5">
          <div className="flex-grow border-t border-surfaceBorder"></div>
          <span className="flex-shrink mx-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">or sign up with email</span>
          <div className="flex-grow border-t border-surfaceBorder"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Role Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">I want to join as a:</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setRole('VIEWER')}
                className={`p-3 rounded-xl border flex items-center sm:flex-col sm:items-start gap-2.5 transition text-left ${
                  role === 'VIEWER'
                    ? 'border-brandPurple bg-purple-600/15 text-white shadow-sm'
                    : 'border-surfaceBorder bg-surfaceLight/60 text-gray-400 hover:border-gray-600'
                }`}
              >
                <Sparkles className="w-4 h-4 text-brandPurple shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">Viewer</div>
                  <div className="text-[10px] text-gray-400">Watch, tip & chat</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('STREAMER')}
                className={`p-3 rounded-xl border flex items-center sm:flex-col sm:items-start gap-2.5 transition text-left ${
                  role === 'STREAMER'
                    ? 'border-brandPink bg-pink-600/15 text-white shadow-sm'
                    : 'border-surfaceBorder bg-surfaceLight/60 text-gray-400 hover:border-gray-600'
                }`}
              >
                <Video className="w-4 h-4 text-brandPink shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">Streamer</div>
                  <div className="text-[10px] text-gray-400">Broadcast & earn</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('AGENCY')}
                className={`p-3 rounded-xl border flex items-center sm:flex-col sm:items-start gap-2.5 transition text-left ${
                  role === 'AGENCY'
                    ? 'border-cyan-400 bg-cyan-600/15 text-white shadow-sm'
                    : 'border-surfaceBorder bg-surfaceLight/60 text-gray-400 hover:border-gray-600'
                }`}
              >
                <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">Agency</div>
                  <div className="text-[10px] text-gray-400">Manage talent & roster</div>
                </div>
              </button>
            </div>
          </div>

          {role === 'AGENCY' && (
            <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-1.5 animate-fade-in">
              <label className="block text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Agency / Management Company Name
              </label>
              <input
                type="text"
                required
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="e.g. Nexus Talent Global, Prime Creators..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs font-semibold focus:outline-none focus:border-cyan-400 placeholder:text-gray-500"
              />
              <p className="text-[10px] text-gray-400">
                You will be granted access to the Agency Portal to recruit broadcasters, track talent performances, and earn agency commissions.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="CyberStreamer"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-sm focus:outline-none focus:border-brandPurple transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-sm focus:outline-none focus:border-brandPurple transition"
              />
            </div>
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
              placeholder="Minimum 8 characters"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-sm focus:outline-none focus:border-brandPurple transition"
            />
          </div>

          {/* Age Verification Gate */}
          <div className="p-4 rounded-xl bg-surfaceLight/70 border border-surfaceBorder space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <ShieldCheck className="w-4 h-4 text-tokenGold" />
              <span>Mandatory 18+ Verification Check</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Date of Birth
              </label>
              <input
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-surface border border-surfaceBorder text-white text-xs focus:outline-none focus:border-brandPurple transition"
              />
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-300">
              <input
                type="checkbox"
                required
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-1 rounded text-brandPurple focus:ring-0"
              />
              <span>
                I confirm that I am at least 18 years old and agree to the Terms of Service, Privacy Policy, and virtual currency guidelines.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-glow-purple py-3.5 rounded-xl font-bold text-white text-sm transition shadow-lg mt-2"
          >
            {loading ? 'Registering Account...' : 'Complete 18+ Registration'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-brandPurple hover:underline font-bold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

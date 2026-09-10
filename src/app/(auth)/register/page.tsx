'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Radio, Lock, Mail, User, Calendar, ShieldCheck, AlertCircle, Sparkles, Video } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'VIEWER' | 'STREAMER'>('VIEWER');
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
          birthDate,
          agreeAgeVerification: agreeTerms,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        await refreshUser();
        router.push(role === 'STREAMER' ? '/dashboard/streamer' : '/');
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Role Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">I want to join as a:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('VIEWER')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition text-left ${
                  role === 'VIEWER'
                    ? 'border-brandPurple bg-purple-600/15 text-white'
                    : 'border-surfaceBorder bg-surfaceLight/60 text-gray-400 hover:border-gray-600'
                }`}
              >
                <Sparkles className="w-4 h-4 text-brandPurple" />
                <div>
                  <div className="text-xs font-bold text-white">Viewer</div>
                  <div className="text-[10px] text-gray-400">Watch, tip & chat</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('STREAMER')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition text-left ${
                  role === 'STREAMER'
                    ? 'border-brandPink bg-pink-600/15 text-white'
                    : 'border-surfaceBorder bg-surfaceLight/60 text-gray-400 hover:border-gray-600'
                }`}
              >
                <Video className="w-4 h-4 text-brandPink" />
                <div>
                  <div className="text-xs font-bold text-white">Streamer</div>
                  <div className="text-[10px] text-gray-400">Broadcast & earn</div>
                </div>
              </button>
            </div>
          </div>

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

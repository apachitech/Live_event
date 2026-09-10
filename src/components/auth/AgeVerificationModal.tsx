'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, CheckSquare, Square, Calendar, AlertCircle } from 'lucide-react';

export default function AgeVerificationModal() {
  const { user, isAgeModalOpen, closeAgeModal, refreshUser } = useAuth();
  const [birthDate, setBirthDate] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If user is already age verified or modal is closed, don't show
  if (!isAgeModalOpen && (!user || user.ageVerified)) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!birthDate) {
      setError('Please provide your date of birth.');
      return;
    }

    if (!agreed) {
      setError('You must confirm that you are at least 18 years of age and agree to the Terms of Service.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/age-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDate,
          agreeAgeVerification: agreed,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        await refreshUser();
        closeAgeModal();
      } else {
        setError(data.error || 'Verification rejected');
      }
    } catch (err: any) {
      setError(err.message || 'Network error during verification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-surface border border-surfaceBorder p-6 shadow-2xl relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-red-500/20 text-red-400">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Age Verification Required</h2>
            <p className="text-xs text-gray-400">Mandatory 18+ Access Compliance</p>
          </div>
        </div>

        <p className="text-sm text-gray-300 mb-5 leading-relaxed">
          In accordance with platform safety and regulatory requirements, you must confirm that you are at least 18 years old to view broadcasts, interact in chat, and participate in the virtual economy.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Date of Birth
            </label>
            <input
              type="date"
              required
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-sm focus:outline-none focus:border-brandPurple transition"
            />
          </div>

          <div
            onClick={() => setAgreed(!agreed)}
            className="flex items-start gap-3 p-3 rounded-xl bg-surfaceLight/50 border border-surfaceBorder cursor-pointer hover:bg-surfaceLight transition"
          >
            <button type="button" className="mt-0.5 text-brandPurple">
              {agreed ? <CheckSquare className="w-5 h-5 text-brandPurple" /> : <Square className="w-5 h-5 text-gray-500" />}
            </button>
            <span className="text-xs text-gray-300 leading-snug">
              I solemnly affirm under penalty of law that I am at least 18 years of age, and I agree to the platform Terms of Service and Privacy Policy.
            </span>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-glow-purple py-3 rounded-xl font-bold text-white text-sm transition"
            >
              {loading ? 'Verifying...' : 'Verify Age & Enter Platform'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

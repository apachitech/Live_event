'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Coins,
  DollarSign,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  ShieldCheck,
  ShieldAlert,
  FileText,
  UploadCloud,
  X,
  Lock,
} from 'lucide-react';

export default function StreamerPayoutsPage() {
  const { user, refreshUser } = useAuth();
  const [tokensToCashout, setTokensToCashout] = useState<number>(1000);
  const [payoutMethod, setPayoutMethod] = useState('STRIPE_CONNECT');
  const [accountEmail, setAccountEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // KYC States
  const [kycData, setKycData] = useState<{
    status: string;
    submittedAt?: string;
    verifiedAt?: string;
    details?: any;
  } | null>(null);
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [kycError, setKycError] = useState('');
  const [kycSuccess, setKycSuccess] = useState('');

  // KYC Form fields
  const [kycForm, setKycForm] = useState({
    legalFirstName: '',
    legalLastName: '',
    country: 'United States',
    idType: 'PASSPORT' as 'PASSPORT' | 'NATIONAL_ID' | 'DRIVERS_LICENSE',
    idNumber: '',
    residentialAddress: '',
    dateOfBirth: '',
    agreed: false,
  });

  const earnedTokens = user?.wallet?.earnedBalance ?? 0;
  const estimatedUSD = (tokensToCashout * 0.05).toFixed(2);
  const minRequiredTokens = 1000;
  const isKycVerified = kycData?.status === 'VERIFIED';
  const canRequest = isKycVerified && earnedTokens >= minRequiredTokens && earnedTokens >= tokensToCashout;

  const fetchPayouts = async () => {
    try {
      const res = await fetch('/api/admin/payouts');
      const data = await res.json();
      if (data.payouts) {
        setPayouts(data.payouts.filter((p: any) => p.streamer?.user?.username === user?.username));
      }
    } catch {}
  };

  const fetchKycStatus = async () => {
    try {
      const res = await fetch('/api/streamer/kyc');
      const data = await res.json();
      if (data.success && data.kyc) {
        setKycData(data.kyc);
        if (data.kyc.details) {
          setKycForm((prev) => ({
            ...prev,
            legalFirstName: data.kyc.details.legalFirstName || '',
            legalLastName: data.kyc.details.legalLastName || '',
            country: data.kyc.details.country || 'United States',
            idType: data.kyc.details.idType || 'PASSPORT',
            idNumber: data.kyc.details.idNumber || '',
            residentialAddress: data.kyc.details.residentialAddress || '',
            dateOfBirth: data.kyc.details.dateOfBirth || '',
          }));
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchPayouts();
    fetchKycStatus();
  }, [user]);

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setKycError('');
    setKycSuccess('');

    if (!kycForm.agreed) {
      setKycError('You must attest under penalty of perjury that the submitted information is accurate.');
      return;
    }

    if (!kycForm.legalFirstName || !kycForm.legalLastName || !kycForm.idNumber) {
      setKycError('Please complete all required fields.');
      return;
    }

    setKycSubmitting(true);
    try {
      const res = await fetch('/api/streamer/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kycForm),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setKycSuccess('KYC documents submitted successfully! Our compliance team will review them within 12–24h.');
        await fetchKycStatus();
        await refreshUser();
        setTimeout(() => setKycModalOpen(false), 2000);
      } else {
        setKycError(data.error || 'Failed to submit KYC documents');
      }
    } catch (err: any) {
      setKycError(err.message);
    } finally {
      setKycSubmitting(false);
    }
  };

  const handleSubmitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isKycVerified) {
      setError('You must complete and have an approved KYC verification before requesting cashouts.');
      return;
    }

    if (tokensToCashout < minRequiredTokens) {
      setError(`Minimum payout request is ${minRequiredTokens} tokens ($50.00 USD).`);
      return;
    }

    if (!accountEmail) {
      setError('Please provide your recipient email or account ID.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/payout/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokensToCashout,
          payoutMethod,
          payoutDetails: { accountEmail },
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(`Payout request for $${estimatedUSD} USD (${tokensToCashout} tokens) submitted!`);
        await refreshUser();
        await fetchPayouts();
      } else {
        setError(data.error || 'Payout request failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-emerald-400" />
          <span>Streamer Earnings & Cashouts</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Convert your earned stream tokens into real-world fiat currency via direct processor payout.
        </p>
      </div>

      {/* KYC Compliance Status Banner */}
      <div className="rounded-2xl p-5 border transition">
        {kycData?.status === 'VERIFIED' ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white">KYC Identity Verified & Approved</h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                    COMPLIANT
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-1">
                  Your broadcaster account is in full compliance with international anti-money laundering (AML) and financial regulations. You can submit cashout requests at any time.
                </p>
              </div>
            </div>
          </div>
        ) : kycData?.status === 'PENDING' ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white">KYC Verification In Progress</h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                    PENDING REVIEW
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-1">
                  Your identity documents were submitted on{' '}
                  <strong className="text-white">
                    {kycData?.submittedAt ? new Date(kycData.submittedAt).toLocaleDateString() : 'recent date'}
                  </strong>{' '}
                  and are currently under review by our compliance team (typically approved within 12–24h). Cashouts will unlock automatically upon approval.
                </p>
              </div>
            </div>
            <button
              onClick={() => setKycModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-surfaceLight hover:bg-surfaceLight/80 text-gray-300 text-xs font-bold border border-surfaceBorder transition shrink-0"
            >
              View Submission
            </button>
          </div>
        ) : kycData?.status === 'REJECTED' ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-red-500/20 text-red-400 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white">KYC Verification Rejected</h3>
                  <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold">
                    ACTION REQUIRED
                  </span>
                </div>
                <p className="text-xs text-red-300 mt-1">
                  Reason:{' '}
                  <strong>
                    {kycData?.details?.rejectionReason || 'Document details did not match or were unreadable.'}
                  </strong>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Please update your information and resubmit valid government photo ID to enable cashouts.
                </p>
              </div>
            </div>
            <button
              onClick={() => setKycModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition shadow shrink-0"
            >
              Resubmit KYC Documents
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-900/30 to-brandPurple/20 border border-brandPurple/40 p-4 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-brandPurple/20 text-brandPurple shrink-0">
                <Lock className="w-5 h-5 text-brandPurple" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white">KYC Verification Required Before Cashouts</h3>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                    MANDATORY COMPLIANCE
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-1">
                  To comply with international financial crime regulations, Anti-Money Laundering (AML) standards, and proof-of-majority laws, all broadcasters must verify their identity before submitting cashout requests.
                </p>
              </div>
            </div>
            <button
              onClick={() => setKycModalOpen(true)}
              className="btn-glow-purple px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition shadow shrink-0"
            >
              <FileText className="w-4 h-4" />
              <span>Complete KYC (2 Mins)</span>
            </button>
          </div>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl glass-panel border border-surfaceBorder">
          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-2">
            <span>Cashable Token Balance</span>
            <Coins className="w-4 h-4 text-tokenGold" />
          </div>
          <div className="text-3xl font-black text-tokenGold flex items-baseline gap-1.5">
            {earnedTokens}
            <span className="text-xs font-semibold text-gray-400">Tokens</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Tokens tipped or earned from private shows & VODs</p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-surfaceBorder">
          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-2">
            <span>Estimated Cashout Value</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">
            ${(earnedTokens * 0.05).toFixed(2)}
            <span className="text-xs font-semibold text-gray-400 ml-1">USD</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Fixed exchange rate: 1 Token = $0.05 USD</p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-surfaceBorder">
          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-2">
            <span>Minimum Threshold</span>
            <Building2 className="w-4 h-4 text-brandPurple" />
          </div>
          <div className="text-3xl font-black text-white">
            1,000
            <span className="text-xs font-semibold text-gray-400 ml-1">Tokens ($50 USD)</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            {earnedTokens >= 1000 ? (
              <span className="text-emerald-400 font-bold">✓ Threshold met! Ready to cashout.</span>
            ) : (
              <span className="text-amber-400">Need {1000 - earnedTokens} more tokens to cash out.</span>
            )}
          </p>
        </div>
      </div>

      {/* Payout Request Form */}
      <div className="p-6 rounded-2xl glass-panel border border-surfaceBorder">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold text-white">Request New Payout</h2>
          {!isKycVerified && (
            <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-semibold flex items-center gap-1">
              <Lock className="w-3 h-3" /> KYC Required
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mb-5">Admin approvals are processed within 24–48 business hours.</p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {!isKycVerified && (
          <div className="mb-5 p-4 rounded-xl bg-surfaceLight/60 border border-surfaceBorder text-xs text-gray-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-400">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Payout form is locked until your identity verification is approved.</span>
            </div>
            <button
              type="button"
              onClick={() => setKycModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-brandPurple/20 hover:bg-brandPurple/30 border border-brandPurple/40 text-brandPurple font-bold text-xs transition"
            >
              Verify Identity Now
            </button>
          </div>
        )}

        <form onSubmit={handleSubmitPayout} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Tokens to Cash Out</label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder">
                <Coins className="w-4 h-4 text-tokenGold" />
                <input
                  type="number"
                  min="1000"
                  max={earnedTokens}
                  disabled={!isKycVerified}
                  value={tokensToCashout}
                  onChange={(e) => setTokensToCashout(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-transparent text-white font-bold text-sm focus:outline-none disabled:opacity-40"
                />
              </div>
              <span className="text-[11px] text-gray-400 mt-1 block">
                Cashout value: <strong className="text-emerald-400">${estimatedUSD} USD</strong>
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Payout Method</label>
              <select
                disabled={!isKycVerified}
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs font-semibold focus:outline-none focus:border-brandPurple disabled:opacity-40"
              >
                <optgroup label="Virtual Card & Digital Banking">
                  <option value="VAULTPAY_CARD">💳 VaultPay Virtual Visa Card (Direct Disbursement)</option>
                </optgroup>
                <optgroup label="Cryptocurrency (Instant / Global)">
                  <option value="CRYPTO_USDT_TRC20">🪙 USDT (TRON TRC-20 - Lowest Fees)</option>
                  <option value="CRYPTO_SOL">🪙 Solana (SOL - Ultra Fast)</option>
                  <option value="CRYPTO_BTC">🪙 Bitcoin (BTC)</option>
                  <option value="CRYPTO_ETH">🪙 Ethereum (ETH)</option>
                  <option value="CRYPTO_USDT_ERC20">🪙 USDT (Ethereum ERC-20)</option>
                </optgroup>
                <optgroup label="Traditional & Bank Transfer">
                  <option value="STRIPE_CONNECT">Stripe Connect (Bank Transfer / US / EU)</option>
                  <option value="PAYPAL">PayPal Payouts</option>
                  <option value="CCBILL_WIRE">CCBill / Wire Transfer</option>
                </optgroup>
                <optgroup label="Mobile Money (Africa)">
                  <option value="MOBILE_MONEY_DRC">📱 DR Congo Mobile Money (Vodacom M-Pesa / Orange / Airtel / Afrimoney)</option>
                  <option value="MOBILE_MONEY_MPESA">📱 M-Pesa (Kenya / Tanzania)</option>
                  <option value="MOBILE_MONEY_MTN">📱 MTN Mobile Money (Ghana / Uganda / Cameroon / Côte d’Ivoire)</option>
                  <option value="MOBILE_MONEY_ORANGE">📱 Orange Money (Senegal / Côte d’Ivoire / Cameroon)</option>
                  <option value="MOBILE_MONEY_WAVE">📱 Wave Mobile Money (Senegal / Côte d’Ivoire)</option>
                  <option value="MOBILE_MONEY_AIRTEL">📱 Airtel Money (East & Central Africa)</option>
                </optgroup>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
              {payoutMethod.startsWith('CRYPTO_')
                ? `Recipient ${payoutMethod.replace('CRYPTO_', '').replace('_', ' ')} Wallet Address`
                : payoutMethod === 'VAULTPAY_CARD'
                ? 'Recipient VaultPay Virtual Card Number (16 digits) or Phone'
                : 'Recipient Account Email / Identifier'}
            </label>
            <input
              type="text"
              required
              disabled={!isKycVerified}
              placeholder={
                payoutMethod === 'VAULTPAY_CARD'
                  ? 'e.g. 4111 2222 3333 4444 or registered VaultPay phone'
                  : payoutMethod.includes('TRC20')
                  ? 'e.g. TNPeeaaTKFSLt2qW6yR4F26zX5h5cW64r7 (TRON address)'
                  : payoutMethod.includes('ERC20') || payoutMethod === 'CRYPTO_ETH'
                  ? 'e.g. 0x71C836472dC91C800A61AC92281BC4502d93e824 (Ethereum address)'
                  : payoutMethod === 'CRYPTO_BTC'
                  ? 'e.g. bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh (Bitcoin address)'
                  : payoutMethod === 'CRYPTO_SOL'
                  ? 'e.g. 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU (Solana address)'
                  : 'e.g. payout@streamer.com or bank routing ID'
              }
              value={accountEmail}
              onChange={(e) => setAccountEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs font-mono focus:outline-none focus:border-brandPurple disabled:opacity-40"
            />
          </div>

          <button
            type="submit"
            disabled={!canRequest || loading}
            className="btn-glow-gold px-6 py-2.5 rounded-xl text-xs font-bold text-black flex items-center gap-1.5 disabled:opacity-40 transition"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>
              {!isKycVerified
                ? 'KYC Verification Required to Cashout'
                : loading
                ? 'Submitting Request...'
                : `Submit Payout Request ($${estimatedUSD})`}
            </span>
          </button>
        </form>
      </div>

      {/* KYC Verification Modal */}
      {kycModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl glass-panel border border-surfaceBorder p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surfaceBorder">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brandPurple" />
                <h3 className="text-base font-bold text-white">Broadcaster KYC Identity Verification</h3>
              </div>
              <button
                onClick={() => setKycModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-surfaceLight transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              In accordance with international financial compliance and anti-money laundering (AML) laws, you must complete this one-time verification to activate cashouts. Your data is encrypted and securely reviewed only by authorized platform compliance officers.
            </p>

            {kycError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{kycError}</span>
              </div>
            )}

            {kycSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{kycSuccess}</span>
              </div>
            )}

            <form onSubmit={handleKycSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Legal First Name</label>
                  <input
                    type="text"
                    required
                    value={kycForm.legalFirstName}
                    onChange={(e) => setKycForm({ ...kycForm, legalFirstName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs font-semibold focus:outline-none focus:border-brandPurple"
                    placeholder="e.g. Jane"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Legal Last Name</label>
                  <input
                    type="text"
                    required
                    value={kycForm.legalLastName}
                    onChange={(e) => setKycForm({ ...kycForm, legalLastName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs font-semibold focus:outline-none focus:border-brandPurple"
                    placeholder="e.g. Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Country of Residence</label>
                  <input
                    type="text"
                    required
                    value={kycForm.country}
                    onChange={(e) => setKycForm({ ...kycForm, country: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs font-semibold focus:outline-none focus:border-brandPurple"
                    placeholder="e.g. United States, France, etc."
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={kycForm.dateOfBirth}
                    onChange={(e) => setKycForm({ ...kycForm, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs font-semibold focus:outline-none focus:border-brandPurple"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Government ID Type</label>
                  <select
                    value={kycForm.idType}
                    onChange={(e) => setKycForm({ ...kycForm, idType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs font-semibold focus:outline-none focus:border-brandPurple"
                  >
                    <option value="PASSPORT">Passport</option>
                    <option value="NATIONAL_ID">National ID Card</option>
                    <option value="DRIVERS_LICENSE">Driver's License</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Document / ID Number</label>
                  <input
                    type="text"
                    required
                    value={kycForm.idNumber}
                    onChange={(e) => setKycForm({ ...kycForm, idNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs font-semibold focus:outline-none focus:border-brandPurple"
                    placeholder="e.g. A12345678"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Residential Street Address</label>
                <input
                  type="text"
                  required
                  value={kycForm.residentialAddress}
                  onChange={(e) => setKycForm({ ...kycForm, residentialAddress: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs font-semibold focus:outline-none focus:border-brandPurple"
                  placeholder="Street, City, Postal Code"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={kycForm.agreed}
                    onChange={(e) => setKycForm({ ...kycForm, agreed: e.target.checked })}
                    className="mt-0.5 rounded border-surfaceBorder text-brandPurple focus:ring-brandPurple"
                  />
                  <span className="text-[11px] text-gray-400 leading-snug">
                    I certify under penalty of perjury that the identification details and proof provided are authentic, true, and correspond to my legal identity.
                  </span>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setKycModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surfaceLight text-gray-400 hover:text-white text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={kycSubmitting}
                  className="btn-glow-purple px-5 py-2 rounded-xl text-xs font-bold text-white shadow transition"
                >
                  {kycSubmitting ? 'Submitting...' : 'Submit Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payout History Table */}
      <div className="p-6 rounded-2xl glass-panel border border-surfaceBorder">
        <h2 className="text-base font-bold text-white mb-4">Payout History</h2>
        {payouts.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No past payout requests found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="text-[11px] text-gray-400 uppercase border-b border-surfaceBorder">
                <tr>
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Tokens</th>
                  <th className="py-2.5">Amount (USD)</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surfaceBorder/60">
                {payouts.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 font-mono">{new Date(p.requestedAt).toLocaleDateString()}</td>
                    <td className="py-3 font-bold text-tokenGold">{p.tokensDeducted} 🪙</td>
                    <td className="py-3 font-bold text-emerald-400">${(p.payoutAmountCents / 100).toFixed(2)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        p.status === 'COMPLETED'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : p.status === 'REJECTED'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400 font-mono text-[11px]">{p.paymentReference || 'Pending Approval'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

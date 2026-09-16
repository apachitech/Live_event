'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Coins, DollarSign, ArrowUpRight, Clock, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';

export default function StreamerPayoutsPage() {
  const { user, refreshUser } = useAuth();
  const [tokensToCashout, setTokensToCashout] = useState<number>(1000);
  const [payoutMethod, setPayoutMethod] = useState('STRIPE_CONNECT');
  const [accountEmail, setAccountEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const earnedTokens = user?.wallet?.earnedBalance ?? 0;
  const estimatedUSD = (tokensToCashout * 0.05).toFixed(2);
  const minRequiredTokens = 1000;
  const canRequest = earnedTokens >= minRequiredTokens && earnedTokens >= tokensToCashout;

  const fetchPayouts = async () => {
    try {
      const res = await fetch('/api/admin/payouts');
      const data = await res.json();
      if (data.payouts) {
        setPayouts(data.payouts.filter((p: any) => p.streamer?.user?.username === user?.username));
      }
    } catch {}
  };

  useEffect(() => {
    fetchPayouts();
  }, [user]);

  const handleSubmitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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
          <p className="text-[11px] text-gray-400 mt-2">Tokens tipped or earned from private shows</p>
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
        <h2 className="text-base font-bold text-white mb-1">Request New Payout</h2>
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
                  value={tokensToCashout}
                  onChange={(e) => setTokensToCashout(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-transparent text-white font-bold text-sm focus:outline-none"
                />
              </div>
              <span className="text-[11px] text-gray-400 mt-1 block">
                Cashout value: <strong className="text-emerald-400">${estimatedUSD} USD</strong>
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Payout Method</label>
              <select
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs font-semibold focus:outline-none focus:border-brandPurple"
              >
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
                : 'Recipient Account Email / Identifier'}
            </label>
            <input
              type="text"
              required
              placeholder={
                payoutMethod.includes('TRC20')
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
              className="w-full px-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs font-mono focus:outline-none focus:border-brandPurple"
            />
            {payoutMethod.startsWith('CRYPTO_') && (
              <span className="text-[10px] text-amber-400/90 mt-1 block">
                ⚠️ Verify your address carefully. Crypto transactions on the blockchain cannot be reversed.
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={!canRequest || loading}
            className="btn-glow-gold px-6 py-2.5 rounded-xl text-xs font-bold text-black flex items-center gap-1.5 disabled:opacity-40 transition"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>{loading ? 'Submitting Request...' : `Submit Payout Request ($${estimatedUSD})`}</span>
          </button>
        </form>
      </div>

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

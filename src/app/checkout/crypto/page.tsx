'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Coins,
  Copy,
  Check,
  Clock,
  ShieldCheck,
  ExternalLink,
  ArrowLeft,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { SUPPORTED_CRYPTO_CURRENCIES } from '@/lib/payment/cryptoAdapter';

function CryptoCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = searchParams.get('session_id') || `crypto_${Date.now()}`;
  const tokens = parseInt(searchParams.get('tokens') || '100', 10);
  const fiatCents = parseInt(searchParams.get('fiat_cents') || '999', 10);
  const initialCurrency = (searchParams.get('pay_currency') || 'usdttrc20').toLowerCase();
  const returnUrl = searchParams.get('return_url') || '/';

  const [selectedCurrency, setSelectedCurrency] = useState(initialCurrency);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Find active currency metadata
  const activeCoin =
    SUPPORTED_CRYPTO_CURRENCIES.find((c) => c.code === selectedCurrency) ||
    SUPPORTED_CRYPTO_CURRENCIES[0];

  // Calculate live amount based on currency
  const fiatDollars = (fiatCents / 100).toFixed(2);
  const rates: Record<string, number> = {
    usdttrc20: 1.0,
    usdterc20: 1.0,
    usdc: 1.0,
    btc: 64500.0,
    eth: 3450.0,
    sol: 145.0,
  };
  const rate = rates[selectedCurrency] || 1.0;
  const rawCryptoAmount = (fiatCents / 100) / rate;
  const displayCryptoAmount = selectedCurrency.includes('usdt') || selectedCurrency.includes('usdc')
    ? rawCryptoAmount.toFixed(2)
    : rawCryptoAmount.toFixed(6);

  // Address
  const depositAddress = activeCoin.sampleAddress;

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Simulate on-chain payment or complete payment
  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    try {
      // Trigger completion directly
      const completeUrl = new URL('/api/wallet/complete', window.location.origin);
      completeUrl.searchParams.set('session_id', sessionId);
      completeUrl.searchParams.set('tokens', String(tokens));
      completeUrl.searchParams.set('fiat_cents', String(fiatCents));

      const res = await fetch(completeUrl.toString());
      if (res.ok || res.redirected) {
        setIsConfirmed(true);
        setTimeout(() => {
          window.location.href = `/?purchased_tokens=${tokens}&provider=crypto`;
        }, 1500);
      } else {
        alert('Failed to complete crypto payment confirmation');
        setIsProcessing(false);
      }
    } catch (e: any) {
      alert('Error verifying payment: ' + e.message);
      setIsProcessing(false);
    }
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    depositAddress
  )}&bgcolor=141622&color=F59E0B&margin=8`;

  return (
    <div className="min-h-screen bg-[#0d0e15] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-xl rounded-3xl bg-[#141622] border border-surfaceBorder p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-surfaceBorder">
          <button
            onClick={() => router.push(returnUrl)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-amber-500/20 text-tokenGold">
              <Coins className="w-5 h-5" />
            </span>
            <span className="text-sm font-black tracking-wide uppercase text-gray-200">Crypto Checkout</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surfaceLight border border-surfaceBorder text-xs text-amber-400 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTimer(timeLeft)}</span>
          </div>
        </div>

        {/* Order Summary Banner */}
        <div className="p-4 rounded-2xl bg-surfaceLight/70 border border-surfaceBorder flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs text-gray-400">Purchasing Token Package</span>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-tokenGold" />
              <span className="text-2xl font-black text-white">{tokens.toLocaleString()}</span>
              <span className="text-xs font-bold text-tokenGold uppercase">Tokens</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-400">Total Price</span>
            <div className="text-2xl font-black text-emerald-400">${fiatDollars}</div>
          </div>
        </div>

        {/* Currency Tabs */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Pay With Cryptocurrency:
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {SUPPORTED_CRYPTO_CURRENCIES.map((coin) => {
              const isSelected = selectedCurrency === coin.code;
              return (
                <button
                  key={coin.code}
                  type="button"
                  onClick={() => setSelectedCurrency(coin.code)}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/20 text-white font-bold shadow-lg shadow-amber-500/10'
                      : 'border-surfaceBorder bg-surfaceLight/50 text-gray-400 hover:border-gray-600 hover:text-gray-200'
                  }`}
                >
                  <span className="text-lg leading-none">{coin.icon}</span>
                  <span className="text-[10px] uppercase font-bold tracking-tight">{coin.code.replace('trc20', '').replace('erc20', '')}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount & Network Detail */}
        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2 text-center">
          <div className="text-xs text-gray-400 font-medium">Send exact amount</div>
          <div className="text-3xl font-black text-white font-mono flex items-center justify-center gap-2">
            <span>{displayCryptoAmount}</span>
            <span className="text-sm font-bold text-amber-400 uppercase">{activeCoin.name}</span>
          </div>
          <div className="text-xs font-medium text-amber-400/90 flex items-center justify-center gap-1">
            <span>Network: <strong>{activeCoin.network}</strong></span>
          </div>
        </div>

        {/* QR Code and Address Card */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-surfaceLight/50 border border-surfaceBorder">
          <div className="flex-shrink-0 p-2 rounded-xl bg-[#141622] border border-amber-500/30 shadow-md">
            <img
              src={qrCodeUrl}
              alt="Crypto Deposit QR"
              width={160}
              height={160}
              className="rounded-lg"
            />
          </div>

          <div className="w-full space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                Deposit Wallet Address ({activeCoin.network})
              </label>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0d0e15] border border-surfaceBorder">
                <span className="font-mono text-xs text-gray-300 break-all select-all flex-1">
                  {depositAddress}
                </span>
                <button
                  onClick={handleCopy}
                  title="Copy Address"
                  className="p-1.5 rounded-lg bg-surfaceLight hover:bg-surfaceBorder text-gray-300 hover:text-white transition flex-shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>Send only {activeCoin.name} on {activeCoin.network}. Automatic detection.</span>
            </div>
          </div>
        </div>

        {/* Status / Confirmation section */}
        {isConfirmed ? (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-center space-y-2 animate-fade-in">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Payment Confirmed!</h3>
            <p className="text-xs text-emerald-300">
              {tokens.toLocaleString()} tokens credited to your wallet. Redirecting to platform...
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleSimulatePayment}
              disabled={isProcessing}
              className="w-full btn-glow-gold py-3.5 rounded-2xl font-black text-black text-sm flex items-center justify-center gap-2 shadow-lg"
            >
              {isProcessing ? (
                <span>Confirming on blockchain... ⏳</span>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-black" />
                  <span>Simulate Instant On-Chain Confirmation (Sandbox)</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-gray-500 text-center">
              In production, the blockchain listener automatically credits tokens upon network confirmation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CryptoCheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0d0e15] flex items-center justify-center text-white">Loading crypto gateway...</div>}>
      <CryptoCheckoutContent />
    </Suspense>
  );
}

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { TOKEN_PACKAGES, TokenPackage } from '@/types';
import { SupportedPaymentMethod } from '@/lib/payment';
import { SUPPORTED_CRYPTO_CURRENCIES } from '@/lib/payment/cryptoAdapter';
import { SAMPLE_VAULTPAY_CARDS } from '@/lib/payment/vaultPayAdapter';
import {
  Coins,
  X,
  CheckCircle,
  ShieldCheck,
  Sparkles,
  CreditCard,
  Zap,
  Bitcoin,
} from 'lucide-react';

export default function TokenPurchaseModal() {
  const { isPurchaseModalOpen, closePurchaseModal } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage>(TOKEN_PACKAGES[1]);
  const [paymentMethod, setPaymentMethod] = useState<SupportedPaymentMethod>('CRYPTO');

  // Cryptocurrency state
  const [selectedCrypto, setSelectedCrypto] = useState('usdttrc20');

  // VaultPay Virtual Card state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  const [loading, setLoading] = useState(false);

  if (!isPurchaseModalOpen) return null;

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/wallet/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          paymentMethod,
          cryptoOptions:
            paymentMethod === 'CRYPTO'
              ? {
                  payCurrency: selectedCrypto,
                }
              : undefined,
          vaultPayOptions:
            paymentMethod === 'VAULTPAY'
              ? {
                  cardNumber,
                  cardExpiry,
                  cardCvv,
                  cardholderName,
                  isVirtualCard: true,
                }
              : undefined,
        }),
      });

      const data = await res.json();
      if (data.checkout?.checkoutUrl) {
        window.location.href = data.checkout.checkoutUrl;
      } else {
        alert(data.error || 'Checkout initiation failed');
        setLoading(false);
      }
    } catch (e: any) {
      alert('Checkout error: ' + e.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-surface border border-surfaceBorder p-6 shadow-2xl overflow-hidden my-6">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surfaceBorder">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-tokenGold">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Get Stream Tokens</h2>
              <p className="text-xs text-gray-400">Tipping, tip menus, fan club subs & private 1:1 shows</p>
            </div>
          </div>
          <button
            onClick={closePurchaseModal}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surfaceLight transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Package Selection Grid */}
        <div className="grid grid-cols-2 gap-2.5 my-4">
          {TOKEN_PACKAGES.map((pkg) => {
            const isSelected = selectedPackage.id === pkg.id;
            return (
              <div
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg)}
                className={`relative cursor-pointer rounded-xl p-3.5 transition-all duration-200 border ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                    : 'border-surfaceBorder bg-surfaceLight/60 hover:border-gray-600'
                }`}
              >
                {pkg.badge && (
                  <span className="absolute -top-2 right-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {pkg.badge}
                  </span>
                )}

                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400 font-medium">{pkg.label}</span>
                  {isSelected && <CheckCircle className="w-3.5 h-3.5 text-tokenGold" />}
                </div>

                <div className="flex items-baseline gap-1.5">
                  <Coins className="w-4 h-4 text-tokenGold" />
                  <span className="text-xl font-black text-white">{pkg.tokens}</span>
                  <span className="text-[11px] text-tokenGold font-semibold">Tokens</span>
                </div>

                {pkg.bonusTokens && (
                  <div className="text-[10px] text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> +{pkg.bonusTokens} Bonus included
                  </div>
                )}

                <div className="mt-2 pt-2 border-t border-surfaceBorder/60 flex justify-between items-center text-xs">
                  <span className="text-gray-400 text-[11px]">Price</span>
                  <span className="font-bold text-white">${(pkg.priceCents / 100).toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 2. Payment Method Selector Tabs */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
            Select Payment Method:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('CRYPTO')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${
                paymentMethod === 'CRYPTO'
                  ? 'border-amber-500 bg-amber-500/20 text-white font-bold shadow-sm shadow-amber-500/20 ring-1 ring-amber-500/50'
                  : 'border-surfaceBorder bg-surfaceLight/50 text-gray-400 hover:border-gray-600'
              }`}
            >
              <Bitcoin className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-semibold">Crypto (USDT/BTC)</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('VAULTPAY')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${
                paymentMethod === 'VAULTPAY'
                  ? 'border-cyan-400 bg-cyan-500/20 text-white font-bold shadow-sm shadow-cyan-500/20 ring-1 ring-cyan-400/50'
                  : 'border-surfaceBorder bg-surfaceLight/50 text-gray-400 hover:border-gray-600'
              }`}
            >
              <CreditCard className="w-5 h-5 text-cyan-400" />
              <span className="text-xs font-semibold">VaultPay Card</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('MOCK')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${
                paymentMethod === 'MOCK'
                  ? 'border-purple-500 bg-purple-500/20 text-white font-bold'
                  : 'border-surfaceBorder bg-surfaceLight/50 text-gray-400 hover:border-gray-600'
              }`}
            >
              <Zap className="w-5 h-5 text-tokenGold" />
              <span className="text-xs font-semibold">Instant Sandbox</span>
            </button>
          </div>
        </div>

        {/* 2.1 VaultPay Virtual Card Input Panel */}
        {paymentMethod === 'VAULTPAY' && (
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 mb-4 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                <CreditCard className="w-4 h-4" />
                <span>VaultPay Virtual Visa Card Ingest</span>
              </div>
              <span className="text-[10px] text-cyan-300/70 uppercase tracking-widest font-semibold">
                Luhn-Verified • High-Risk Enabled
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                  Cardholder Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe / Streamer VIP"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-cyan-400 placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                  VaultPay Virtual Card Number (16 digits)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={19}
                    placeholder="4000 1234 5678 9010"
                    value={cardNumber}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                      const formatted = v.match(/.{1,4}/g)?.join(' ') || v;
                      setCardNumber(formatted);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs tracking-wider font-mono focus:outline-none focus:border-cyan-400 placeholder:text-gray-500"
                  />
                  <span className="absolute right-3 top-2 text-[10px] font-bold text-cyan-400">
                    VISA
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Expiration (MM/YY)
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="12/28"
                    value={cardExpiry}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^0-9]/g, '');
                      if (val.length >= 2) {
                        val = val.substring(0, 2) + '/' + val.substring(2, 4);
                      }
                      setCardExpiry(val);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs font-mono focus:outline-none focus:border-cyan-400 placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    CVV (3 digits)
                  </label>
                  <input
                    type="password"
                    maxLength={3}
                    placeholder="888"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs font-mono focus:outline-none focus:border-cyan-400 placeholder:text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Quick Test Card Helper */}
            <div className="pt-2 border-t border-cyan-500/20 flex items-center justify-between">
              <span className="text-[10px] text-gray-400">Sample Test Card:</span>
              <button
                type="button"
                onClick={() => {
                  const sample = SAMPLE_VAULTPAY_CARDS[0];
                  setCardNumber(sample.number);
                  setCardExpiry(sample.expiry);
                  setCardCvv(sample.cvv);
                  setCardholderName('VIP Supporter');
                }}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-medium"
              >
                Auto-fill Sandbox Card
              </button>
            </div>
          </div>
        )}

        {/* 2.2 Cryptocurrency Selection Panel */}
        {paymentMethod === 'CRYPTO' && (
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 mb-4 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <Bitcoin className="w-4 h-4" />
                <span>Pay with Crypto (Zero KYC / Instant Token Credit)</span>
              </div>
              <span className="text-[10px] text-amber-300/70 uppercase tracking-wider font-semibold">
                NOWPayments Rail
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-300 mb-1.5">
                Choose Cryptocurrency:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SUPPORTED_CRYPTO_CURRENCIES.map((coin) => {
                  const isCoinSelected = selectedCrypto === coin.code;
                  return (
                    <button
                      key={coin.code}
                      type="button"
                      onClick={() => setSelectedCrypto(coin.code)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition ${
                        isCoinSelected
                          ? 'border-amber-400 bg-amber-500/20 text-white shadow-sm ring-1 ring-amber-400/50'
                          : 'border-surfaceBorder bg-surfaceLight text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      <span className="text-base">{coin.icon}</span>
                      <span className="text-xs font-bold">{coin.name}</span>
                      <span className="text-[9px] text-gray-400 truncate max-w-full">{coin.network}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed pt-1">
              You will receive an exact deposit address and QR code. Your tokens are automatically added to your wallet within seconds of blockchain confirmation.
            </p>
          </div>
        )}

        {/* Security & Summary Notice */}
        <div className="p-3 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs text-gray-400 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Secure 256-Bit Encrypted Payment • Instant Token Credit</span>
          </div>
          <span className="text-gray-300 font-medium">1 Token ≈ $0.10</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={closePurchaseModal}
            className="px-4 py-2.5 rounded-xl text-xs font-medium text-gray-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="btn-glow-gold px-6 py-2.5 rounded-xl text-xs font-bold text-black flex items-center gap-2 shadow"
          >
            {loading ? (
              <span>Connecting to Gateway...</span>
            ) : (
              <>
                <Coins className="w-4 h-4 text-black" />
                <span>
                  Buy {selectedPackage.tokens} Tokens with{' '}
                  {paymentMethod === 'VAULTPAY'
                    ? 'VaultPay Virtual Card'
                    : paymentMethod === 'CRYPTO'
                    ? `Crypto (${selectedCrypto.toUpperCase().replace('TRC20', ' TRC-20').replace('ERC20', ' ERC-20')})`
                    : 'Sandbox'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

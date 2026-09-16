'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { TOKEN_PACKAGES, TokenPackage } from '@/types';
import { SupportedPaymentMethod, AFRICAN_MOBILE_MONEY_NETWORKS } from '@/lib/payment';
import { SUPPORTED_CRYPTO_CURRENCIES } from '@/lib/payment/cryptoAdapter';
import { SAMPLE_VAULTPAY_CARDS } from '@/lib/payment/vaultPayAdapter';
import {
  Coins,
  X,
  CheckCircle,
  ShieldCheck,
  Sparkles,
  CreditCard,
  Smartphone,
  Shield,
  Zap,
  Bitcoin,
} from 'lucide-react';

export default function TokenPurchaseModal() {
  const { isPurchaseModalOpen, closePurchaseModal, refreshUser } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage>(TOKEN_PACKAGES[1]);
  const [paymentMethod, setPaymentMethod] = useState<SupportedPaymentMethod>('LEMON_SQUEEZY');

  // African Mobile Money state
  const [selectedCountryCode, setSelectedCountryCode] = useState('KE');
  const [selectedNetwork, setSelectedNetwork] = useState('M-Pesa (Safaricom)');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Cryptocurrency state
  const [selectedCrypto, setSelectedCrypto] = useState('usdttrc20');

  // VaultPay Virtual Card state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  const [loading, setLoading] = useState(false);

  if (!isPurchaseModalOpen) return null;

  const currentCountry =
    AFRICAN_MOBILE_MONEY_NETWORKS.find((c) => c.code === selectedCountryCode) ||
    AFRICAN_MOBILE_MONEY_NETWORKS[0];

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountryCode(countryCode);
    const countryObj = AFRICAN_MOBILE_MONEY_NETWORKS.find((c) => c.code === countryCode);
    if (countryObj && countryObj.networks.length > 0) {
      setSelectedNetwork(countryObj.networks[0]);
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/wallet/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          paymentMethod,
          mobileMoneyOptions:
            paymentMethod === 'MOBILE_MONEY'
              ? {
                  country: selectedCountryCode,
                  network: selectedNetwork,
                  phoneNumber,
                  currency: currentCountry.currency,
                }
              : undefined,
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('CRYPTO')}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition ${
                paymentMethod === 'CRYPTO'
                  ? 'border-amber-500 bg-amber-500/20 text-white font-bold shadow-sm shadow-amber-500/20 ring-1 ring-amber-500/50'
                  : 'border-surfaceBorder bg-surfaceLight/50 text-gray-400 hover:border-gray-600'
              }`}
            >
              <Bitcoin className="w-4 h-4 text-amber-400" />
              <span className="text-[11px]">Crypto</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('LEMON_SQUEEZY')}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition ${
                paymentMethod === 'LEMON_SQUEEZY'
                  ? 'border-yellow-400 bg-yellow-400/20 text-white font-bold shadow-sm shadow-yellow-500/20'
                  : 'border-surfaceBorder bg-surfaceLight/50 text-gray-400 hover:border-gray-600'
              }`}
            >
              <span className="text-sm leading-none">🍋</span>
              <span className="text-[11px]">Lemon Squeezy</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('STRIPE')}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition ${
                paymentMethod === 'STRIPE'
                  ? 'border-brandPurple bg-purple-600/20 text-white font-bold'
                  : 'border-surfaceBorder bg-surfaceLight/50 text-gray-400 hover:border-gray-600'
              }`}
            >
              <CreditCard className="w-4 h-4 text-brandPurple" />
              <span className="text-[11px]">Card / Stripe</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('MOBILE_MONEY')}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition ${
                paymentMethod === 'MOBILE_MONEY'
                  ? 'border-emerald-500 bg-emerald-500/20 text-white font-bold'
                  : 'border-surfaceBorder bg-surfaceLight/50 text-gray-400 hover:border-gray-600'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px]">Mobile Money</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('VAULTPAY')}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition ${
                paymentMethod === 'VAULTPAY'
                  ? 'border-cyan-400 bg-cyan-500/20 text-white font-bold shadow-sm shadow-cyan-500/20 ring-1 ring-cyan-400/50'
                  : 'border-surfaceBorder bg-surfaceLight/50 text-gray-400 hover:border-gray-600'
              }`}
            >
              <CreditCard className="w-4 h-4 text-cyan-400" />
              <span className="text-[11px]">VaultPay</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('CCBILL')}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition ${
                paymentMethod === 'CCBILL'
                  ? 'border-pink-500 bg-pink-500/20 text-white font-bold'
                  : 'border-surfaceBorder bg-surfaceLight/50 text-gray-400 hover:border-gray-600'
              }`}
            >
              <Shield className="w-4 h-4 text-pink-400" />
              <span className="text-[11px]">CCBill</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('MOCK')}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition ${
                paymentMethod === 'MOCK'
                  ? 'border-amber-500 bg-amber-500/20 text-white font-bold'
                  : 'border-surfaceBorder bg-surfaceLight/50 text-gray-400 hover:border-gray-600'
              }`}
            >
              <Zap className="w-4 h-4 text-tokenGold" />
              <span className="text-[11px]">Instant Sandbox</span>
            </button>
          </div>
        </div>

        {/* 2.4 VaultPay Virtual Card Input Panel */}
        {paymentMethod === 'VAULTPAY' && (
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 mb-4 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                <CreditCard className="w-4 h-4" />
                <span>VaultPay Virtual Visa & Mastercard</span>
              </div>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-mono font-bold">
                Virtual Visa Accepted
              </span>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1">Cardholder Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jean Kabamba"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1">Card Number (16 digits)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={19}
                    placeholder="4111 2222 3333 4444"
                    value={cardNumber}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 16);
                      const formatted = v.match(/.{1,4}/g)?.join(' ') || v;
                      setCardNumber(formatted);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs font-mono tracking-wider focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">Expiry Date</label>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => {
                      let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                      if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
                      setCardExpiry(v);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs font-mono text-center focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">Security Code (CVV)</label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="CVC"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs font-mono text-center focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Sample Virtual Card Fast-Fill */}
              <div className="pt-2 border-t border-cyan-500/20">
                <span className="text-[10px] text-gray-400 block mb-1.5 font-medium">Quick Fill Sample VaultPay Cards (Test Mode):</span>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_VAULTPAY_CARDS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCardNumber(sample.number);
                        setCardExpiry(sample.expiry);
                        setCardCvv(sample.cvv);
                        setCardholderName('VaultPay Tester');
                      }}
                      className="text-[10px] px-2 py-1 rounded-lg bg-surfaceLight hover:bg-cyan-500/20 text-cyan-300 border border-surfaceBorder hover:border-cyan-500/40 transition flex items-center gap-1 font-mono"
                    >
                      <span>💳</span>
                      <span>{sample.number.slice(0, 4)}...{sample.number.slice(-4)} ({sample.label.split(' ')[0]})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2.5 Crypto Currency Selection Panel */}
        {paymentMethod === 'CRYPTO' && (
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 mb-4 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <Bitcoin className="w-4 h-4" />
                <span>Select Cryptocurrency & Network</span>
              </div>
              <span className="text-[10px] text-amber-300 font-mono">BTC • ETH • USDT • SOL</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SUPPORTED_CRYPTO_CURRENCIES.map((coin) => {
                const isSelected = selectedCrypto === coin.code;
                return (
                  <div
                    key={coin.code}
                    onClick={() => setSelectedCrypto(coin.code)}
                    className={`cursor-pointer p-2.5 rounded-xl border transition flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/20 text-white shadow-sm shadow-amber-500/10'
                        : 'border-surfaceBorder bg-surfaceLight/60 text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base font-bold">{coin.icon}</span>
                      {coin.recommended && (
                        <span className="text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1 py-0.5 rounded font-bold uppercase">
                          Low Fee
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{coin.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono truncate">{coin.network}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-gray-400">
              ⚡ Instant blockchain confirmations. Scan QR code or copy deposit address on next screen.
            </p>
          </div>
        )}

        {/* 3. African Mobile Money Configuration Panel */}
        {paymentMethod === 'MOBILE_MONEY' && (
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 mb-4 space-y-3 animate-fade-in">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <Smartphone className="w-4 h-4" />
              <span>African Mobile Money Ingest (M-Pesa, MTN, Orange, Wave)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1">Country</label>
                <select
                  value={selectedCountryCode}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  {AFRICAN_MOBILE_MONEY_NETWORKS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.country} ({c.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1">Mobile Network</label>
                <select
                  value={selectedNetwork}
                  onChange={(e) => setSelectedNetwork(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  {currentCountry.networks.map((net) => (
                    <option key={net} value={net}>
                      {net}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                Mobile Money Phone Number (for USSD / Push notification)
              </label>
              <input
                type="tel"
                placeholder="e.g. +254 712 345 678 or 0712345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
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
                    : paymentMethod === 'LEMON_SQUEEZY'
                    ? 'Lemon Squeezy'
                    : paymentMethod === 'MOBILE_MONEY'
                    ? `${selectedNetwork}`
                    : paymentMethod === 'CCBILL'
                    ? 'CCBill'
                    : paymentMethod === 'MOCK'
                    ? 'Sandbox'
                    : 'Card'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

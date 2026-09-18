'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSiteConfig } from '@/context/SiteConfigContext';
import { TOKEN_PACKAGES as FALLBACK_PACKAGES, TokenPackage } from '@/types';
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
  Smartphone,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function TokenPurchaseModal() {
  const { isPurchaseModalOpen, closePurchaseModal } = useAuth();
  const { tokenPackages: dynamicPackages, siteName } = useSiteConfig();
  const activePackages = dynamicPackages && dynamicPackages.length > 0 ? dynamicPackages : FALLBACK_PACKAGES;

  const [selectedPackage, setSelectedPackage] = useState<TokenPackage>(activePackages[1] || activePackages[0]);
  const [paymentMethod, setPaymentMethod] = useState<SupportedPaymentMethod>('CRYPTO');

  // Keep selectedPackage synced if admin updates packages dynamically
  useEffect(() => {
    if (activePackages.length > 0) {
      const found = activePackages.find((p) => p.id === selectedPackage?.id);
      if (!found) {
        setSelectedPackage(activePackages[1] || activePackages[0]);
      }
    }
  }, [activePackages]);

  // Cryptocurrency state
  const [selectedCrypto, setSelectedCrypto] = useState('usdttrc20');
  const [showMobileMoneyHelp, setShowMobileMoneyHelp] = useState(false);

  // VaultPay Virtual Card state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  const [loading, setLoading] = useState(false);

  const cleanNumber = cardNumber.replace(/\D/g, '');
  const isVisa = cleanNumber.startsWith('4');
  const isMastercard = /^(5[1-5]|2[2-7])/.test(cleanNumber);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="relative w-full max-w-xl md:max-w-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col rounded-2xl bg-surface border border-surfaceBorder shadow-2xl overflow-hidden my-auto animate-fade-in">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Header (Sticky Top) */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-surfaceBorder bg-surface/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-tokenGold">
              <Coins className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-white">Get Stream Tokens</h2>
              <p className="text-[11px] sm:text-xs text-gray-400">Tipping, tip menus, fan club subs & private 1:1 shows</p>
            </div>
          </div>
          <button
            onClick={closePurchaseModal}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surfaceLight transition"
            aria-label="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Scrollable Body (Adaptive Proportions & Custom Scrollbar) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-4 space-y-4 text-xs scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900/40">
          {/* 2.1 Package Selection Grid (Proportional 2x2 on Mobile, 4 Columns on Tablet/Desktop) */}
          <div>
            <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-2">
              1. Select Token Bundle:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
              {activePackages.map((pkg) => {
                const isSelected = selectedPackage.id === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`relative cursor-pointer rounded-xl p-3 transition-all duration-200 border flex flex-col justify-between hover:scale-[1.02] active:scale-95 ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                        : 'border-surfaceBorder bg-surfaceLight/60 hover:border-gray-500 hover:bg-surfaceLight'
                    }`}
                  >
                    {pkg.badge && (
                      <span className="absolute -top-2 right-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                        {pkg.badge}
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] sm:text-xs text-gray-400 font-medium truncate">{pkg.label}</span>
                        {isSelected && <CheckCircle className="w-3.5 h-3.5 text-tokenGold shrink-0" />}
                      </div>

                      <div className="flex items-baseline gap-1 my-0.5">
                        <Coins className="w-3.5 h-3.5 text-tokenGold shrink-0" />
                        <span className="text-lg sm:text-xl font-black text-white">{pkg.tokens}</span>
                        <span className="text-[10px] text-tokenGold font-semibold">TKN</span>
                      </div>

                      {pkg.bonusTokens ? (
                        <div className="text-[9px] text-emerald-400 font-medium flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 shrink-0" /> +{pkg.bonusTokens} Bonus
                        </div>
                      ) : (
                        <div className="text-[9px] text-gray-500">Standard Pack</div>
                      )}
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-surfaceBorder/60 flex justify-between items-center text-[11px]">
                      <span className="text-gray-400">Price</span>
                      <span className="font-bold text-white">${(pkg.priceCents / 100).toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2.2 Payment Method Selector Tabs */}
          <div>
            <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-2">
              2. Choose Payment Method:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('CRYPTO')}
                className={`p-2.5 sm:p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition transform hover:scale-[1.01] active:scale-95 ${
                  paymentMethod === 'CRYPTO'
                    ? 'border-amber-500 bg-amber-500/20 text-white font-bold shadow-sm shadow-amber-500/20 ring-1 ring-amber-500/50'
                    : 'border-surfaceBorder bg-surfaceLight/50 text-gray-400 hover:border-gray-600 hover:text-gray-200'
                }`}
              >
                <Bitcoin className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                <span className="text-[11px] sm:text-xs font-semibold">Crypto (USDT/BTC)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('VAULTPAY')}
                className={`p-2.5 sm:p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition transform hover:scale-[1.01] active:scale-95 ${
                  paymentMethod === 'VAULTPAY'
                    ? 'border-cyan-400 bg-cyan-500/20 text-white font-bold shadow-sm shadow-cyan-500/20 ring-1 ring-cyan-400/50'
                    : 'border-surfaceBorder bg-surfaceLight/50 text-gray-400 hover:border-gray-600 hover:text-gray-200'
                }`}
              >
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                <span className="text-[11px] sm:text-xs font-semibold">Pay with Card (Visa | MC)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('MOCK')}
                className={`p-2.5 sm:p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition transform hover:scale-[1.01] active:scale-95 ${
                  paymentMethod === 'MOCK'
                    ? 'border-purple-500 bg-purple-500/20 text-white font-bold ring-1 ring-purple-500/50'
                    : 'border-surfaceBorder bg-surfaceLight/50 text-gray-400 hover:border-gray-600 hover:text-gray-200'
                }`}
              >
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-tokenGold" />
                <span className="text-[11px] sm:text-xs font-semibold">Sandbox Test</span>
              </button>
            </div>
          </div>

          {/* 2.3 Cryptocurrency Selection Panel & Mobile Money Helper */}
          {paymentMethod === 'CRYPTO' && (
            <div className="p-3.5 sm:p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <Bitcoin className="w-4 h-4" />
                  <span>Pay with Crypto (Instant Token Credit)</span>
                </div>
                <span className="text-[10px] text-amber-300/80 uppercase tracking-wider font-semibold">
                  Zero KYC
                </span>
              </div>

              {/* Supported Coins Grid */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1.5">
                  Select Blockchain / Coin:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SUPPORTED_CRYPTO_CURRENCIES.map((coin) => {
                    const isCoinSelected = selectedCrypto === coin.code;
                    return (
                      <button
                        key={coin.code}
                        type="button"
                        onClick={() => setSelectedCrypto(coin.code)}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition transform hover:scale-[1.02] ${
                          isCoinSelected
                            ? 'border-amber-400 bg-amber-500/25 text-white shadow-sm ring-1 ring-amber-400/50 font-bold'
                            : 'border-surfaceBorder bg-surfaceLight text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        <span className="text-base">{coin.icon}</span>
                        <span className="text-[11px] font-bold">{coin.name}</span>
                        <span className="text-[9px] text-gray-400 truncate max-w-full">{coin.network}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 📱 Mobile Money ➔ Binance P2P Bridge Helper */}
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3 space-y-2">
                <div
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() => setShowMobileMoneyHelp(!showMobileMoneyHelp)}
                >
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-[11px] sm:text-xs">
                    <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Using Mobile Money? (Vodacom M-Pesa, Orange, Airtel, MTN)</span>
                  </div>
                  <button
                    type="button"
                    className="text-emerald-400 hover:text-emerald-300 p-0.5"
                    aria-label="Toggle Mobile Money Help"
                  >
                    {showMobileMoneyHelp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {showMobileMoneyHelp ? (
                  <div className="pt-2 border-t border-emerald-500/20 text-[11px] text-gray-300 space-y-2 leading-relaxed animate-fade-in">
                    <p className="text-gray-300">
                      You can convert your local Mobile Money to USDT in 2 minutes with <strong>0% fees</strong> on Binance:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-300 pl-1">
                      <li>Open the <strong>Binance App</strong> &gt; tap <strong>P2P Trading &gt; Buy USDT</strong>.</li>
                      <li>Select your local currency (<code>CDF</code>, <code>KES</code>, <code>XAF</code>, <code>XOF</code>, <code>GHS</code>, <code>USD</code>) and pay via your phone.</li>
                      <li>Once your USDT arrives, select <strong>USDT TRC-20</strong> above, click <strong>Buy Tokens</strong>, and scan the QR code to finish.</li>
                    </ol>
                    <div className="flex items-center justify-between pt-1 border-t border-emerald-500/20">
                      <span className="text-[10px] text-emerald-300/80 font-medium">⚡ Instant settlement via escrow</span>
                      <a
                        href="https://p2p.binance.com"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-bold underline"
                      >
                        Open Binance P2P <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <p
                    className="text-[10px] text-emerald-400/90 cursor-pointer flex items-center justify-between"
                    onClick={() => setShowMobileMoneyHelp(true)}
                  >
                    <span>Click here to see how to pay with M-Pesa, Orange Money, or Airtel via Binance P2P</span>
                    <span className="text-emerald-400 font-semibold underline">Show steps &rarr;</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 2.4 Virtual Card (Visa & Mastercard) Input Panel */}
          {paymentMethod === 'VAULTPAY' && (
            <div className="p-3.5 sm:p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                  <CreditCard className="w-4 h-4" />
                  <span>Pay with Card (Visa | MC)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded transition ${isVisa ? 'bg-blue-600 text-white shadow ring-1 ring-blue-400' : 'bg-surfaceLight text-gray-500'}`}>
                    VISA
                  </span>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded transition ${isMastercard ? 'bg-amber-600 text-white shadow ring-1 ring-amber-400' : 'bg-surfaceLight text-gray-500'}`}>
                    MASTERCARD
                  </span>
                </div>
              </div>

              {/* Supported Physical & Virtual Cards Banner */}
              <div className="rounded-xl bg-cyan-900/25 border border-cyan-500/25 p-2.5 text-[11px] text-cyan-200/90 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  Accepts all <strong>physical bank cards</strong> (Debit/Credit from any bank) and <strong>mobile money virtual cards</strong> (M-Pesa GlobalPay, Airtel, Chipper Cash, Pyypl, VaultPay).
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Cardholder Full Name (as on card or app)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe / Cardholder Name"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs focus:outline-none focus:border-cyan-400 placeholder:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Card Number (16 digits — Physical or Virtual)
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
                    <span className={`absolute right-3 top-2 text-[10px] font-black uppercase tracking-wider ${
                      isVisa ? 'text-blue-400' : isMastercard ? 'text-amber-400' : 'text-cyan-400'
                    }`}>
                      {isVisa ? 'VISA' : isMastercard ? 'MASTERCARD' : 'CARD'}
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
              <div className="pt-2 border-t border-cyan-500/20 flex items-center justify-between text-[10px]">
                <span className="text-gray-400">Sandbox Test Cards:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const sample = SAMPLE_VAULTPAY_CARDS[0];
                      setCardNumber(sample.number);
                      setCardExpiry(sample.expiry);
                      setCardCvv(sample.cvv);
                      setCardholderName('Alex Cardholder');
                    }}
                    className="text-cyan-400 hover:text-cyan-300 underline font-medium"
                  >
                    Test Visa (Bank / M-Pesa)
                  </button>
                  <span className="text-gray-600">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      const sample = SAMPLE_VAULTPAY_CARDS[2];
                      setCardNumber(sample.number);
                      setCardExpiry(sample.expiry);
                      setCardCvv(sample.cvv);
                      setCardholderName('Morgan Cardholder');
                    }}
                    className="text-amber-400 hover:text-amber-300 underline font-medium"
                  >
                    Test Mastercard (Bank / Airtel)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2.5 Security Guarantee Banner */}
          <div className="p-3 rounded-xl bg-surfaceLight/80 border border-surfaceBorder text-[11px] text-gray-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>256-Bit Encrypted • Instant Wallet Balance Credit</span>
            </div>
            <span className="text-gray-300 font-semibold shrink-0">1 Token ≈ $0.10</span>
          </div>
        </div>

        {/* 3. Sticky Footer Action Bar (Always Visible on Any Screen Height) */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 border-t border-surfaceBorder bg-surface/95 backdrop-blur z-10">
          <button
            onClick={closePurchaseModal}
            className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white transition hover:bg-surfaceLight"
          >
            Cancel
          </button>
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="btn-glow-gold px-5 sm:px-7 py-2.5 rounded-xl text-xs sm:text-sm font-black text-black flex items-center gap-2 shadow transition transform active:scale-95"
          >
            {loading ? (
              <span>Connecting to Gateway...</span>
            ) : (
              <>
                <Coins className="w-4 h-4 text-black shrink-0" />
                <span>
                  Buy {selectedPackage.tokens} Tokens with{' '}
                  {paymentMethod === 'VAULTPAY'
                    ? 'Card (Visa | MC)'
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

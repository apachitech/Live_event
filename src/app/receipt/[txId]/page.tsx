'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Printer, CheckCircle2, ArrowLeft, ShieldCheck, Download, Coins, Share2 } from 'lucide-react';

export default function ReceiptSlipPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const txId = params?.txId as string;
  const isPayout = searchParams.get('type') === 'payout';

  const [slip, setSlip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!txId) return;
    const url = `/api/receipt/${txId}${isPayout ? '?type=payout' : ''}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.slip) {
          setSlip(data.slip);
        } else {
          setError(data.error || 'Slip not found');
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [txId, isPayout]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0c10] text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-brandPurple border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400">Retrieving official payment slip...</p>
        </div>
      </div>
    );
  }

  if (error || !slip) {
    return (
      <div className="min-h-screen bg-[#0b0c10] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl glass-panel border border-surfaceBorder text-center space-y-4">
          <h2 className="text-lg font-black text-red-400">Payment Slip Unavailable</h2>
          <p className="text-xs text-gray-400">{error || 'Unable to locate transaction record.'}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surfaceLight hover:bg-gray-700 text-xs font-bold text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Platform</span>
          </Link>
        </div>
      </div>
    );
  }

  const fiatUSD = slip.fiatAmountCents ? (slip.fiatAmountCents / 100).toFixed(2) : '0.00';
  const fiatCFA = Math.round(Number(fiatUSD) * 600).toLocaleString();

  return (
    <div className="min-h-screen bg-[#08090d] text-gray-200 py-10 px-4 print:p-0 print:bg-white print:text-black">
      {/* Top Action Bar (hidden on print) */}
      <div className="max-w-2xl mx-auto mb-6 flex items-center justify-between gap-4 print:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surfaceLight hover:bg-gray-700 text-xs font-bold text-gray-300 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="btn-glow-purple px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Receipt Voucher */}
      <div className="max-w-2xl mx-auto bg-[#111219] border border-[#232430] rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden print:border-none print:shadow-none print:bg-white print:p-4">
        {/* Watermark / Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#232430] print:border-gray-300">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-black uppercase tracking-wider mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Official Electronic Payment Slip</span>
            </div>
            <h1 className="text-2xl font-black text-white print:text-black tracking-tight">
              {slip.siteName}
            </h1>
            <p className="text-xs text-gray-400 print:text-gray-600 mt-0.5">
              Secure Ledger & Payment Settlement Voucher
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <span className="text-[10px] text-gray-400 print:text-gray-600 uppercase tracking-wider font-bold block">
              Slip Reference:
            </span>
            <span className="text-sm font-mono font-black text-purple-300 print:text-purple-700">
              {slip.slipNumber}
            </span>
            <span className="text-[11px] text-gray-400 print:text-gray-500 block">
              {new Date(slip.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Transaction Overview Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6 p-5 rounded-2xl bg-black/40 border border-[#232430] print:bg-gray-50 print:border-gray-200">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 print:text-gray-500 uppercase tracking-wider font-bold">
              Account / Customer:
            </span>
            <p className="text-sm font-bold text-white print:text-black">{slip.payerName}</p>
            <p className="text-xs text-gray-400 print:text-gray-600 truncate">{slip.payerEmail}</p>
          </div>

          <div className="space-y-1 sm:text-right">
            <span className="text-[10px] text-gray-400 print:text-gray-500 uppercase tracking-wider font-bold">
              Payment Gateway & Method:
            </span>
            <p className="text-sm font-bold text-emerald-400 print:text-emerald-700">
              {slip.paymentMethod}
            </p>
            <p className="text-[11px] font-mono text-gray-400 print:text-gray-500 truncate">
              Ref: {slip.paymentReference}
            </p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="my-6">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#232430] print:border-gray-300 text-gray-400 print:text-gray-600 uppercase text-[10px] tracking-wider">
                <th className="py-3 font-bold">Item Description</th>
                <th className="py-3 font-bold text-center">Tokens</th>
                <th className="py-3 font-bold text-right">Settled Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232430] print:divide-gray-200 text-gray-200 print:text-black">
              <tr>
                <td className="py-4">
                  <p className="font-bold text-sm text-white print:text-black">{slip.itemDescription}</p>
                  <p className="text-[11px] text-gray-400 print:text-gray-500 mt-0.5">
                    {slip.type === 'PAYOUT' ? 'Disbursed to Mobile Money' : 'Instant Wallet Credit & Verification'}
                  </p>
                </td>
                <td className="py-4 text-center font-bold text-tokenGold print:text-amber-700">
                  🪙 {slip.tokens.toLocaleString()}
                </td>
                <td className="py-4 text-right">
                  <span className="font-black text-sm text-white print:text-black">${fiatUSD} USD</span>
                  <span className="block text-[11px] text-gray-400 print:text-gray-600 mt-0.5">
                    (≈ {fiatCFA} FCFA)
                  </span>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#333446] print:border-gray-400 text-sm font-black">
                <td className="py-4 text-white print:text-black">TOTAL SETTLED</td>
                <td className="py-4 text-center text-tokenGold print:text-amber-700">
                  {slip.tokens.toLocaleString()} Tokens
                </td>
                <td className="py-4 text-right text-emerald-400 print:text-emerald-700">
                  ${fiatUSD} USD
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Verification & Security Footer */}
        <div className="pt-6 border-t border-[#232430] print:border-gray-300 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 print:text-gray-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400 print:text-emerald-700" />
            <div>
              <p className="font-bold text-white print:text-black">Cryptographically Verified Slip</p>
              <p className="text-[11px]">Ledger ID: {slip.transactionId}</p>
            </div>
          </div>

          <div className="text-center sm:text-right text-[11px]">
            <p>For questions or support, contact:</p>
            <a href={`mailto:${slip.supportEmail}`} className="text-purple-400 print:text-purple-700 font-bold">
              {slip.supportEmail}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

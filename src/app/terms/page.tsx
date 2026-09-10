import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Shield, CheckCircle } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 animate-fade-in text-gray-300">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Platform</span>
      </Link>

      <div className="space-y-3 pb-6 border-b border-surfaceBorder">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-bold uppercase tracking-wider">
          <FileText className="w-4 h-4 text-brandPurple" />
          <span>User Agreement</span>
        </div>
        <h1 className="text-3xl font-black text-white">Terms of Service</h1>
        <p className="text-xs text-gray-400">Effective Date: January 1, 2026</p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">1. Eligibility & Age Restriction</h2>
          <p>
            You must be at least 18 years of age or the age of legal majority in your jurisdiction to create an account, purchase tokens, view streams, or broadcast content on PulseStream. By accessing the service, you affirmatively represent and warrant that you are 18 or older.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">2. Token Economy & Virtual Currency</h2>
          <p>
            Tokens purchased on PulseStream are limited, revocable licenses for in-app interactivity (including tips, chat unlocks, private shows, and VOD access). Tokens are non-refundable, cannot be exchanged for fiat currency by viewers, and do not represent an investment, deposit, or property right.
          </p>
          <p>
            Streamers earn cashable token credits through tips and paid interactive shows, subject to platform revenue splits, minimum payout thresholds ($50.00 USD), and approved KYC identity verification.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">3. Broadcaster Conduct & Prohibited Content</h2>
          <p>
            Broadcasters must adhere strictly to community guidelines. The following content is categorically prohibited and subject to immediate account termination, wallet forfeiture, and reporting to law enforcement:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-xs text-gray-300">
            <li>Any depiction or participation of individuals under 18 years of age.</li>
            <li>Non-consensual content, harassment, stalking, or hate speech.</li>
            <li>Violent, dangerous, or illegal activities.</li>
            <li>Copyright or trademark infringement without authorization.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">4. Payouts & Taxes</h2>
          <p>
            Streamers are independent contractors responsible for all applicable local, national, and international taxes arising from earned income. Payout requests are processed through authorized payment providers (including Mobile Money networks and bank transfers) upon review.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">5. DMCA & Copyright Takedown Procedure</h2>
          <p>
            If you are a copyright owner or an agent thereof and believe that any content infringes upon your copyright, you may submit a notification pursuant to the Digital Millennium Copyright Act (DMCA) by providing our designated Copyright Agent with written notice at <a href="mailto:dmca@platform.live" className="text-brandPurple underline">dmca@platform.live</a>.
          </p>
        </section>
      </div>
    </div>
  );
}

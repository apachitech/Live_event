import React from 'react';
import Link from 'next/link';
import { ShieldCheck, FileText, ArrowLeft, AlertCircle } from 'lucide-react';

export default function Compliance2257Page() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 animate-fade-in text-gray-300">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Platform</span>
      </Link>

      <div className="space-y-3 pb-6 border-b border-surfaceBorder">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-brandPurple" />
          <span>Statutory Notice & Record-Keeping</span>
        </div>
        <h1 className="text-3xl font-black text-white">
          18 U.S.C. § 2257 Record-Keeping Compliance Statement
        </h1>
        <p className="text-xs text-gray-400">
          Last Updated & Reviewed: January 1, 2026
        </p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed">
        <section className="space-y-2.5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>1. Operator Notice & Exemption Disclosures</span>
          </h2>
          <p>
            All broadcasters, performers, and content creators appearing in any visual depiction, live stream, video recording, or photographic content made available on this platform are required to be at least 18 years of age (or the age of majority in their jurisdiction of residence).
          </p>
          <p>
            The operator of this service strictly requires government-issued photographic identification and self-attestation verification prior to enabling live broadcast or monetized interactive capabilities.
          </p>
        </section>

        <section className="space-y-2.5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>2. Custodian of Records</span>
          </h2>
          <p>
            Pursuant to 18 U.S.C. § 2257 and 28 C.F.R. Part 75, records required to be maintained for all content produced or broadcast directly on this platform are maintained by the designated Custodian of Records:
          </p>
          <div className="p-4 rounded-xl glass-panel border border-surfaceBorder font-mono text-xs space-y-1 text-gray-200">
            <div><strong>Custodian:</strong> PulseStream Legal & Compliance Dept.</div>
            <div><strong>Physical Address:</strong> 100 Innovation Way, Suite 400</div>
            <div><strong>Location:</strong> Wilmington, DE 19801, United States</div>
            <div><strong>Compliance Email:</strong> compliance@platform.live</div>
          </div>
        </section>

        <section className="space-y-2.5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>3. Age Verification & KYC Mandate</span>
          </h2>
          <p>
            All performers who produce content must submit verifiable identification credentials (including valid passport, national ID card, or state driver’s license) alongside real-time facial verification before any payout or broadcast room may be activated.
          </p>
        </section>

        <section className="space-y-2.5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>4. Reporting Violations & Inquiries</span>
          </h2>
          <p>
            The platform maintains a zero-tolerance policy regarding underage content or unauthorized depictions. If you believe any content on this service violates these policies, immediately contact our 24/7 moderation team at <a href="mailto:safety@platform.live" className="text-brandPurple underline font-bold">safety@platform.live</a> or submit an on-screen report.
          </p>
        </section>
      </div>
    </div>
  );
}

import React from 'react';
import Link from 'next/link';
import { Lock, ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 animate-fade-in text-gray-300">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Platform</span>
      </Link>

      <div className="space-y-3 pb-6 border-b border-surfaceBorder">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-bold uppercase tracking-wider">
          <Lock className="w-4 h-4 text-brandPurple" />
          <span>Data Protection & Privacy</span>
        </div>
        <h1 className="text-3xl font-black text-white">Privacy Policy</h1>
        <p className="text-xs text-gray-400">Effective Date: January 1, 2026</p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">1. Information We Collect</h2>
          <p>
            We collect personal information necessary to deliver live interactive streaming, process token purchases, and comply with regulatory requirements:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-xs text-gray-300">
            <li><strong>Account Information:</strong> Email address, username, password hash, and date of birth.</li>
            <li><strong>KYC & Identity Data:</strong> Government-issued photo identification and facial verification data for streamers.</li>
            <li><strong>Payment & Transaction Records:</strong> Token purchase history and transaction amounts. Raw credit card numbers are handled directly by PCI-DSS certified processors (Stripe, CCBill, Flutterwave) and are never stored on our servers.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">2. How We Use Your Data</h2>
          <p>
            Your information is used strictly to provide the streaming platform, verify age eligibility, compute platform revenue splits, prevent fraud and chargebacks, and comply with applicable statutory laws (including 18 U.S.C. 2257).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">3. GDPR & CCPA Rights</h2>
          <p>
            Depending on your location, you possess rights under the General Data Protection Regulation (GDPR) or California Consumer Privacy Act (CCPA), including the right to access, rectify, port, or request the deletion of your personal data. To exercise these rights, email <a href="mailto:privacy@platform.live" className="text-brandPurple underline font-bold">privacy@platform.live</a>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">4. Cookies & Local Storage</h2>
          <p>
            We use secure HTTP-only cookies and browser storage strictly to maintain authentication sessions, remember age verification status, and manage real-time WebSocket room connections.
          </p>
        </section>
      </div>
    </div>
  );
}

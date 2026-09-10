'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-800 bg-slate-950 text-slate-400 text-xs py-10 px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="font-bold text-white text-base tracking-wider bg-gradient-to-r from-rose-500 to-indigo-500 bg-clip-text text-transparent">
              LIVE PLATFORM
            </span>
            <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full">
              18+ ADULTS ONLY
            </span>
          </div>
          <p className="text-slate-500 max-w-md text-xs">
            Global interactive live broadcast & content economy platform. All performers are verified adults aged 18 or older.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 font-medium">
          <Link href="/compliance-2257" className="hover:text-white transition-colors">
            18 U.S.C. 2257 Statement
          </Link>
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <Link href="/explore" className="hover:text-pink-400 transition-colors">
            Explore Feed
          </Link>
          <Link href="/vods" className="hover:text-white transition-colors">
            VOD Directory
          </Link>
          <a href="/api/health" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            System Health
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-slate-900 mt-6 pt-6 flex flex-col sm:flex-row items-center justify-between text-slate-600 gap-4 text-center">
        <p>© {new Date().getFullYear()} Live Interactive Media Inc. All rights reserved.</p>
        <p>Zero tolerance policy for illegal or non-consensual content.</p>
      </div>
    </footer>
  );
}

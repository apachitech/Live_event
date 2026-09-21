'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useSiteConfig } from '@/context/SiteConfigContext';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { Megaphone } from 'lucide-react';

export function Footer() {
  const { openCampaignModal } = useAuth();
  const { siteName, siteDescription, contentRating } = useSiteConfig();
  const { t } = useLanguage();

  const isAdult = contentRating === 'ADULT';
  const isKids = contentRating === 'KIDS';

  const defaultDescription = isKids
    ? 'Family & youth safe live broadcast platform. Encouraging creativity, learning, and fun for all ages.'
    : isAdult
    ? 'Global interactive live broadcast & content economy platform. All performers are verified adults aged 18 or older.'
    : 'Global interactive live broadcast platform for gaming, creative arts, music, podcasts, and community.';

  return (
    <footer className="w-full border-t border-slate-800 bg-slate-950 text-slate-400 text-xs py-10 px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="font-bold text-white text-base tracking-wider bg-gradient-to-r from-rose-500 to-indigo-500 bg-clip-text text-transparent uppercase">
              {siteName}
            </span>
            {isAdult ? (
              <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-black px-2 py-0.5 rounded-full">
                18+ ADULTS ONLY
              </span>
            ) : isKids ? (
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded-full">
                KIDS & FAMILY SAFE
              </span>
            ) : (
              <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-black px-2 py-0.5 rounded-full">
                ALL AGES
              </span>
            )}
          </div>
          <p className="text-slate-500 max-w-md text-xs">
            {siteDescription || defaultDescription}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 font-medium">
          {isAdult ? (
            <Link href="/compliance-2257" className="hover:text-white transition-colors">
              18 U.S.C. 2257 Statement
            </Link>
          ) : isKids ? (
            <Link href="/terms" className="hover:text-emerald-400 transition-colors">
              Child Safety & Family Policy
            </Link>
          ) : (
            <Link href="/terms" className="hover:text-blue-400 transition-colors">
              Community Guidelines
            </Link>
          )}
          <Link href="/terms" className="hover:text-white transition-colors">
            {t('footer.terms', 'Terms of Service')}
          </Link>
          <Link href="/privacy" className="hover:text-white transition-colors">
            {t('footer.privacy', 'Privacy Policy')}
          </Link>
          <Link href="/explore" className="hover:text-pink-400 transition-colors">
            {t('footer.explore', 'Explore Feed')}
          </Link>
          <Link href="/vods" className="hover:text-white transition-colors">
            {t('footer.vods', 'VOD Directory')}
          </Link>
          <button
            onClick={openCampaignModal}
            className="flex items-center gap-1 text-pink-400 hover:text-pink-300 transition-colors font-semibold"
            title="Launch Sponsored Advertising Campaign"
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Launch Ad Campaign</span>
          </button>
          <a href="/api/health" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {t('footer.health', 'System Health')}
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-slate-900 mt-6 pt-6 flex flex-col sm:flex-row items-center justify-between text-slate-500 gap-4 text-center">
        <p>© {new Date().getFullYear()} {siteName} Media Inc. {t('footer.rights', 'All rights reserved.')}</p>

        {/* Dedicated Language Switcher in Footer */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-400 font-medium">{t('lang.title', 'Language')}:</span>
          <LanguageSwitcher variant="pill" />
        </div>

        <p>{t('footer.policy', 'Zero tolerance policy for illegal or non-consensual content.')}</p>
      </div>
    </footer>
  );
}

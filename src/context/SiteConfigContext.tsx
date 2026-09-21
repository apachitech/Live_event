'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { TokenPackage, TOKEN_PACKAGES as DEFAULT_PACKAGES } from '@/types';

export type ContentRatingMode = 'ADULT' | 'KIDS' | 'GENERAL';

export interface PaymentMethodsState {
  SASPAY: boolean;
  VAULTPAY: boolean;
  CRYPTO: boolean;
  MOCK: boolean;
}

export const DEFAULT_PAYMENT_METHODS: PaymentMethodsState = {
  SASPAY: true,
  VAULTPAY: true,
  CRYPTO: true,
  MOCK: false,
};

interface SiteConfigContextType {
  siteName: string;
  siteTagline: string;
  siteDescription: string;
  supportEmail: string;
  contentRating: ContentRatingMode;
  tokenPackages: TokenPackage[];
  paymentMethods: PaymentMethodsState;
  tokenExchangeRateCents: number;
  revenueSplitStreamerPercent: number;
  minPayoutTokens: number;
  loading: boolean;
  refreshConfig: () => Promise<void>;
  reloadConfig: () => Promise<void>;
}

const SiteConfigContext = createContext<SiteConfigContextType>({
  siteName: 'PulseStream',
  siteTagline: 'Live Interactive Monetized Streaming Platform',
  siteDescription: 'Public stream rooms, virtual currency economy, interactive tipping menus, and private shows.',
  supportEmail: 'support@pulsestream.live',
  contentRating: 'ADULT',
  tokenPackages: DEFAULT_PACKAGES,
  paymentMethods: DEFAULT_PAYMENT_METHODS,
  tokenExchangeRateCents: 5,
  revenueSplitStreamerPercent: 70,
  minPayoutTokens: 1000,
  loading: true,
  refreshConfig: async () => {},
  reloadConfig: async () => {},
});

export function SiteConfigProvider({ children }: { children: React.ReactNode }) {
  const [siteName, setSiteName] = useState<string>('PulseStream');
  const [siteTagline, setSiteTagline] = useState<string>('Live Interactive Monetized Streaming Platform');
  const [siteDescription, setSiteDescription] = useState<string>(
    'Public stream rooms, virtual currency economy, interactive tipping menus, and private shows.'
  );
  const [supportEmail, setSupportEmail] = useState<string>('support@pulsestream.live');
  const [contentRating, setContentRating] = useState<ContentRatingMode>('ADULT');
  const [tokenPackages, setTokenPackages] = useState<TokenPackage[]>(DEFAULT_PACKAGES);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodsState>(DEFAULT_PAYMENT_METHODS);
  const [tokenExchangeRateCents, setTokenExchangeRateCents] = useState<number>(5);
  const [revenueSplitStreamerPercent, setRevenueSplitStreamerPercent] = useState<number>(70);
  const [minPayoutTokens, setMinPayoutTokens] = useState<number>(1000);
  const [loading, setLoading] = useState<boolean>(true);

  const applySettings = useCallback((settings: any) => {
    if (!settings) return;
    if (settings.siteName || settings.SITE_NAME) {
      const name = settings.siteName || settings.SITE_NAME;
      setSiteName(name);
      if (typeof document !== 'undefined') {
        const currentTitle = document.title;
        if (!currentTitle || currentTitle.includes('PulseStream') || currentTitle.includes('|')) {
          const parts = currentTitle.split('|');
          if (parts.length > 1) {
            document.title = `${parts[0].trim()} | ${name}`;
          } else {
            document.title = `${name} | ${settings.siteTagline || settings.SITE_TAGLINE || 'Live Interactive Streaming'}`;
          }
        }
      }
    }
    if (settings.siteTagline || settings.SITE_TAGLINE) {
      setSiteTagline(settings.siteTagline || settings.SITE_TAGLINE);
    }
    if (settings.siteDescription || settings.SITE_DESCRIPTION) {
      setSiteDescription(settings.siteDescription || settings.SITE_DESCRIPTION);
    }
    if (settings.supportEmail || settings.SUPPORT_EMAIL) {
      setSupportEmail(settings.supportEmail || settings.SUPPORT_EMAIL);
    }
    if (settings.tokenPackages || settings.TOKEN_PACKAGES) {
      const pkgs = settings.tokenPackages || settings.TOKEN_PACKAGES;
      if (Array.isArray(pkgs)) {
        setTokenPackages(pkgs);
      } else if (typeof pkgs === 'string') {
        try {
          const parsed = JSON.parse(pkgs);
          if (Array.isArray(parsed) && parsed.length > 0) setTokenPackages(parsed);
        } catch {}
      }
    }
    if (settings.tokenExchangeRateCents || settings.TOKEN_EXCHANGE_RATE_CENTS) {
      setTokenExchangeRateCents(
        parseInt(settings.tokenExchangeRateCents || settings.TOKEN_EXCHANGE_RATE_CENTS, 10) || 5
      );
    }
    if (settings.revenueSplitStreamerPercent || settings.REVENUE_SPLIT_STREAMER_PERCENT) {
      setRevenueSplitStreamerPercent(
        parseInt(settings.revenueSplitStreamerPercent || settings.REVENUE_SPLIT_STREAMER_PERCENT, 10) || 70
      );
    }
    if (settings.contentRating || settings.SITE_CONTENT_RATING || settings.CONTENT_RATING) {
      const rating = String(settings.contentRating || settings.SITE_CONTENT_RATING || settings.CONTENT_RATING).toUpperCase();
      if (['ADULT', 'KIDS', 'GENERAL'].includes(rating)) {
        setContentRating(rating as any);
      }
    }
    if (settings.paymentMethods || settings.PAYMENT_METHODS_CONFIG) {
      const pm = settings.paymentMethods || settings.PAYMENT_METHODS_CONFIG;
      if (typeof pm === 'object') {
        setPaymentMethods((prev) => ({ ...prev, ...pm }));
      } else if (typeof pm === 'string') {
        try {
          const parsed = JSON.parse(pm);
          if (parsed && typeof parsed === 'object') {
            setPaymentMethods((prev) => ({ ...prev, ...parsed }));
          }
        } catch {}
      }
    }
  }, []);

  const refreshConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/public', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          applySettings(data.settings);
        }
      }
    } catch (err) {
      console.warn('Notice: loading dynamic site config fallback:', err);
    } finally {
      setLoading(false);
    }
  }, [applySettings]);

  useEffect(() => {
    refreshConfig();

    const socket: Socket = io();
    socket.on('site_settings_updated', (updatedSettings: any) => {
      applySettings(updatedSettings);
    });

    const onFocus = () => {
      refreshConfig();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus);
    }

    return () => {
      socket.disconnect();
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', onFocus);
      }
    };
  }, [refreshConfig, applySettings]);

  return (
    <SiteConfigContext.Provider
      value={{
        siteName,
        siteTagline,
        siteDescription,
        supportEmail,
        contentRating,
        tokenPackages,
        paymentMethods,
        tokenExchangeRateCents,
        revenueSplitStreamerPercent,
        minPayoutTokens,
        loading,
        refreshConfig,
        reloadConfig: refreshConfig,
      }}
    >
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}

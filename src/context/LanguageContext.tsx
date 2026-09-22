'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Locale = 'en' | 'fr';

export interface Translations {
  [key: string]: {
    en: string;
    fr: string;
  };
}

export const TRANSLATIONS: Translations = {
  // Navigation
  'nav.liveDirectory': { en: 'Live Directory', fr: 'Répertoire en Direct' },
  'nav.explore': { en: 'Explore (Swipe Feed)', fr: 'Explorer (Flux Vidéo)' },
  'nav.vods': { en: 'VODs & Replays', fr: 'Vidéos & Rediffusions' },
  'nav.categories': { en: 'Categories', fr: 'Catégories' },
  'nav.allCategories': { en: 'All Categories', fr: 'Toutes les catégories' },
  'nav.gaming': { en: 'Gaming', fr: 'Jeux Vidéo' },
  'nav.chat': { en: 'Chat', fr: 'Discussion' },
  'nav.creative': { en: 'Creative', fr: 'Créatif' },
  'nav.tokens': { en: 'Tokens', fr: 'Jetons' },
  'nav.buyTokens': { en: 'Buy Tokens', fr: 'Acheter des Jetons' },
  'nav.getTokens': { en: 'Get Tokens', fr: 'Obtenir des Jetons' },
  'nav.studio': { en: 'Go Live Studio', fr: 'Studio de Direct' },
  'nav.admin': { en: 'Admin', fr: 'Administration' },
  'nav.adminDashboard': { en: 'Admin Dashboard', fr: 'Tableau de Bord Admin' },
  'nav.broadcastStudio': { en: 'Broadcast Studio', fr: 'Studio de Diffusion' },
  'nav.earnings': { en: 'Earnings & Payouts', fr: 'Revenus & Retraits' },
  'nav.vodManager': { en: 'VOD Manager', fr: 'Gestionnaire VOD' },
  'nav.login': { en: 'Log In', fr: 'Connexion' },
  'nav.signup': { en: 'Sign Up (18+)', fr: "S'inscrire (18+)" },
  'nav.signout': { en: 'Sign Out', fr: 'Déconnexion' },

  // Language selector
  'lang.title': { en: 'Language', fr: 'Langue' },
  'lang.en': { en: 'English', fr: 'English' },
  'lang.fr': { en: 'Français', fr: 'Français' },

  // Token Purchase Modal
  'modal.title': { en: 'Get Stream Tokens', fr: 'Acheter des Jetons de Direct' },
  'modal.subtitle': {
    en: 'Tipping, tip menus, fan club subs & private 1:1 shows',
    fr: 'Pourboires, menus interactifs, abonnements et salons privés 1:1',
  },
  'modal.step1': { en: '1. Select Token Bundle:', fr: '1. Choisissez votre Pack de Jetons :' },
  'modal.step2': { en: '2. Choose Payment Method:', fr: '2. Choisissez le Moyen de Paiement :' },
  'modal.price': { en: 'Price', fr: 'Prix' },
  'modal.bonus': { en: 'Bonus', fr: 'Bonus' },
  'modal.standardPack': { en: 'Standard Pack', fr: 'Pack Standard' },
  'modal.saspayTab': { en: 'Mobile Money (SasPay)', fr: 'Mobile Money (SasPay)' },
  'modal.cryptoTab': { en: 'Crypto (USDT/BTC)', fr: 'Crypto (USDT/BTC)' },
  'modal.cardTab': { en: 'Pay with Card (Visa | MC)', fr: 'Carte (Visa | Mastercard)' },
  'modal.sandboxTab': { en: 'Sandbox Test', fr: 'Test Sandbox' },
  'modal.saspayHeader': { en: 'Mobile Money & Cards (saspay.me)', fr: 'Mobile Money & Cartes (saspay.me)' },
  'modal.selectOperator': {
    en: 'Select Mobile Money Operator or Card:',
    fr: "Sélectionnez l'opérateur Mobile Money ou la carte :",
  },
  'modal.phonePrompt': {
    en: 'Mobile Money Phone Number (Optional for Instant Push):',
    fr: 'Numéro Mobile Money (Optionnel pour notification USSD push) :',
  },
  'modal.phoneHelp': {
    en: 'Leave blank to complete payment on the official SasPay Hosted Checkout page.',
    fr: 'Laissez vide pour régler sur la page de paiement sécurisée SasPay.',
  },
  'modal.cryptoHeader': { en: 'Pay with Crypto (Instant Token Credit)', fr: 'Paiement Crypto (Crédit Instantané)' },
  'modal.cryptoSelect': { en: 'Select Blockchain / Coin:', fr: 'Sélectionnez la Blockchain / Crypto :' },
  'modal.cardHeader': { en: 'Instant Card Checkout', fr: 'Paiement Sécurisé par Carte' },
  'modal.cardNum': {
    en: 'Card Number (16 digits — Physical or Virtual)',
    fr: 'Numéro de Carte (16 chiffres — Physique ou Virtuelle)',
  },
  'modal.cardExpiry': { en: 'Expiration (MM/YY)', fr: 'Expiration (MM/AA)' },
  'modal.cardCvv': { en: 'CVV (3 digits)', fr: 'CVV (3 chiffres)' },
  'modal.security': {
    en: '256-Bit Encrypted • Instant Wallet Balance Credit',
    fr: 'Chiffrement 256-Bit • Crédit immédiat du solde portefeuille',
  },
  'modal.cancel': { en: 'Cancel', fr: 'Annuler' },
  'modal.connecting': { en: 'Connecting to Gateway...', fr: 'Connexion à la passerelle...' },
  'modal.buyWith': { en: 'Buy', fr: 'Acheter' },
  'modal.tokensWith': { en: 'Tokens with', fr: 'Jetons avec' },

  // Streams & Categories
  'stream.live': { en: 'LIVE', fr: 'EN DIRECT' },
  'stream.viewers': { en: 'viewers', fr: 'spectateurs' },
  'stream.allCategories': { en: 'All Categories', fr: 'Toutes les catégories' },
  'stream.searchPlaceholder': { en: 'Search streams or performers...', fr: 'Rechercher un direct ou streamer...' },
  'stream.tip': { en: 'Send Tip', fr: 'Envoyer un pourboire' },
  'stream.follow': { en: 'Follow', fr: 'Suivre' },
  'stream.following': { en: 'Following', fr: 'Abonné' },
  'stream.tipMenu': { en: 'Tip Menu', fr: 'Menu de pourboires' },
  'stream.privateShow': { en: 'Private Show', fr: 'Salon Privé' },
  'stream.chat': { en: 'Live Chat', fr: 'Chat en Direct' },
  'stream.send': { en: 'Send', fr: 'Envoyer' },
  'stream.noStreams': { en: 'No live streams currently active.', fr: 'Aucun direct actuellement en cours.' },

  // Footer
  'footer.terms': { en: 'Terms of Service', fr: "Conditions d'Utilisation" },
  'footer.privacy': { en: 'Privacy Policy', fr: 'Politique de Confidentialité' },
  'footer.explore': { en: 'Explore Feed', fr: 'Flux Vidéo' },
  'footer.vods': { en: 'VOD Directory', fr: 'Répertoire VOD' },
  'footer.health': { en: 'System Health', fr: 'État du Système' },
  'footer.rights': { en: 'All rights reserved.', fr: 'Tous droits réservés.' },
  'footer.policy': {
    en: 'Zero tolerance policy for illegal or non-consensual content.',
    fr: 'Tolérance zéro pour les contenus illégaux ou non consentis.',
  },
};

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  setLocale: () => {},
  toggleLocale: () => {},
  t: (key, fallback) => fallback || key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  // Load saved language on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('app_locale') as Locale | null;
      if (saved === 'en' || saved === 'fr') {
        setLocaleState(saved);
        document.documentElement.lang = saved;
        return;
      }

      // Auto-detect browser language if French
      const browserLang = navigator.language?.toLowerCase() || '';
      if (browserLang.startsWith('fr')) {
        setLocaleState('fr');
        document.documentElement.lang = 'fr';
      }
    } catch {
      // Ignore localStorage access errors
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem('app_locale', newLocale);
      document.documentElement.lang = newLocale;
      // Set cookie so server-side can also detect locale if needed
      document.cookie = `app_locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Ignore cookie/storage errors
    }
  };

  const toggleLocale = () => {
    setLocale(locale === 'en' ? 'fr' : 'en');
  };

  const t = (key: string, fallback?: string): string => {
    const item = TRANSLATIONS[key];
    if (item && item[locale]) {
      return item[locale];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, toggleLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

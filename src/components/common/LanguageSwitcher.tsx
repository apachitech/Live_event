'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, Locale } from '@/context/LanguageContext';
import { Globe, Check, ChevronDown } from 'lucide-react';

interface LanguageSwitcherProps {
  variant?: 'pill' | 'dropdown' | 'compact';
  className?: string;
}

export default function LanguageSwitcher({
  variant = 'pill',
  className = '',
}: LanguageSwitcherProps) {
  const { locale, setLocale, toggleLocale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Pill variant: Sleek inline switcher [ 🇬🇧 EN | 🇫🇷 FR ]
  if (variant === 'pill') {
    return (
      <div
        className={`inline-flex items-center p-0.5 rounded-xl bg-surfaceLight border border-surfaceBorder/80 text-xs font-bold shadow-inner ${className}`}
        role="group"
        aria-label="Language selector"
      >
        <button
          type="button"
          onClick={() => setLocale('en')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all duration-200 ${
            locale === 'en'
              ? 'bg-gradient-to-r from-brandPurple to-brandPink text-white shadow-sm font-extrabold'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          title="Switch to English"
        >
          <span className="text-xs">🇬🇧</span>
          <span className="text-[11px] tracking-wide">EN</span>
        </button>

        <button
          type="button"
          onClick={() => setLocale('fr')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all duration-200 ${
            locale === 'fr'
              ? 'bg-gradient-to-r from-brandPurple to-brandPink text-white shadow-sm font-extrabold'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          title="Passer en Français"
        >
          <span className="text-xs">🇫🇷</span>
          <span className="text-[11px] tracking-wide">FR</span>
        </button>
      </div>
    );
  }

  // 2. Compact single toggle button with Globe
  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={toggleLocale}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surfaceLight border border-surfaceBorder hover:border-gray-500 text-xs font-bold text-gray-200 hover:text-white transition shadow-sm ${className}`}
        title={locale === 'en' ? 'Passer en Français' : 'Switch to English'}
        aria-label="Toggle language"
      >
        <Globe className="w-3.5 h-3.5 text-brandPurple" />
        <span>{locale === 'en' ? '🇬🇧 EN' : '🇫🇷 FR'}</span>
      </button>
    );
  }

  // 3. Dropdown Menu Variant
  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surfaceLight border border-surfaceBorder hover:border-gray-600 text-xs font-semibold text-gray-200 hover:text-white transition shadow-sm"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Globe className="w-3.5 h-3.5 text-brandPurple" />
        <span>{locale === 'en' ? '🇬🇧 English' : '🇫🇷 Français'}</span>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 sm:bottom-auto sm:top-full sm:mt-2 w-36 rounded-2xl glass-dropdown shadow-2xl py-1 z-50 animate-fade-in">
          <button
            type="button"
            onClick={() => {
              setLocale('en');
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2 text-xs transition ${
              locale === 'en'
                ? 'text-brandPurple font-bold bg-surfaceLight'
                : 'text-gray-300 hover:bg-surfaceLight hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>🇬🇧</span>
              <span>English</span>
            </div>
            {locale === 'en' && <Check className="w-3.5 h-3.5 text-brandPurple" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setLocale('fr');
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2 text-xs transition ${
              locale === 'fr'
                ? 'text-brandPurple font-bold bg-surfaceLight'
                : 'text-gray-300 hover:bg-surfaceLight hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>🇫🇷</span>
              <span>Français</span>
            </div>
            {locale === 'fr' && <Check className="w-3.5 h-3.5 text-brandPurple" />}
          </button>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { TipAlertPayload } from '@/types';
import { Sparkles, Coins } from 'lucide-react';

export default function TipAlertOverlay({ alert }: { alert: TipAlertPayload | null }) {
  const [visible, setVisible] = useState(false);
  const [currentAlert, setCurrentAlert] = useState<TipAlertPayload | null>(null);

  useEffect(() => {
    if (alert) {
      setCurrentAlert(alert);
      setVisible(true);

      const timer = setTimeout(() => {
        setVisible(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [alert]);

  if (!visible || !currentAlert) return null;

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-slide-up">
      <div className="relative rounded-2xl bg-gradient-to-r from-amber-500/90 via-purple-600/90 to-pink-600/90 p-[2px] shadow-2xl shadow-amber-500/30">
        <div className="rounded-[14px] bg-[#0c0d14]/95 backdrop-blur-md px-6 py-4 flex items-center gap-4 text-center">
          <div className="p-3 rounded-full bg-amber-500/20 text-tokenGold animate-bounce-short">
            <Coins className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 justify-center">
              <span className="font-extrabold text-white text-base">{currentAlert.senderUsername}</span>
              <span className="text-xs text-amber-300 font-medium">tipped</span>
              <span className="text-base font-black text-amber-400 flex items-center gap-1">
                {currentAlert.amount} Tokens
              </span>
            </div>

            {currentAlert.menuItemLabel && (
              <div className="mt-0.5 text-xs text-purple-300 font-semibold flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Action: {currentAlert.menuItemLabel}
              </div>
            )}

            {currentAlert.message && (
              <div className="mt-1 text-xs text-gray-200 italic max-w-xs truncate">
                &ldquo;{currentAlert.message}&rdquo;
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

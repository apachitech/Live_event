'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Clock, Coins, PhoneOff, AlertTriangle } from 'lucide-react';

interface PrivateShowMeterBannerProps {
  streamId: string;
  ratePerMin: number;
  isStreamer: boolean;
  onEndShow?: () => void;
}

export default function PrivateShowMeterBanner({
  streamId,
  ratePerMin,
  isStreamer,
  onEndShow,
}: PrivateShowMeterBannerProps) {
  const { user, refreshUser } = useAuth();
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Debit every 60 seconds (executed by viewer or server verification)
  useEffect(() => {
    if (!isStreamer && secondsElapsed > 0 && secondsElapsed % 60 === 0) {
      const minuteNumber = secondsElapsed / 60;
      fetch('/api/stream/private/meter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId, minuteNumber }),
      })
        .then((res) => res.json())
        .then((data) => {
          refreshUser();
          if (data.ended) {
            alert('Your token balance has run out. Exiting private show.');
            if (onEndShow) onEndShow();
          }
        })
        .catch(() => {});
    }
  }, [secondsElapsed, isStreamer, streamId, refreshUser, onEndShow]);

  const handleEnd = async () => {
    try {
      await fetch('/api/stream/private/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId, action: 'end' }),
      });
      if (onEndShow) onEndShow();
    } catch {}
  };

  const minutes = Math.floor(secondsElapsed / 60);
  const seconds = secondsElapsed % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="w-full rounded-xl bg-gradient-to-r from-pink-600/20 via-purple-600/20 to-pink-600/20 border border-pink-500/40 p-3 shadow-lg flex items-center justify-between animate-pulse-subtle">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-pink-500/20 text-brandPink">
          <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
        </div>
        <div>
          <div className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span>🔒 Private Show Active</span>
            <span className="text-pink-400 font-mono text-sm">{formattedTime}</span>
          </div>
          <div className="text-[11px] text-gray-300 flex items-center gap-2 mt-0.5">
            <span className="flex items-center gap-1 text-tokenGold font-bold">
              <Coins className="w-3.5 h-3.5" /> {ratePerMin} Tokens/min
            </span>
            <span>•</span>
            <span>{isStreamer ? 'You are broadcasting 1:1' : 'Private session in progress'}</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleEnd}
        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow"
      >
        <PhoneOff className="w-3.5 h-3.5" />
        <span>End Show</span>
      </button>
    </div>
  );
}

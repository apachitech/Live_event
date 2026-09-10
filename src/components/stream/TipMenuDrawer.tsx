'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, Coins, Plus, Check } from 'lucide-react';

interface TipMenuItem {
  id: string;
  label: string;
  tokenCost: number;
  description?: string;
}

interface TipMenuDrawerProps {
  streamId: string;
  streamerName: string;
  items: TipMenuItem[];
  onTriggerAction?: (item: TipMenuItem) => void;
}

export default function TipMenuDrawer({
  streamId,
  streamerName,
  items,
  onTriggerAction,
}: TipMenuDrawerProps) {
  const { user, openPurchaseModal, refreshUser } = useAuth();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [successItem, setSuccessItem] = useState<string | null>(null);

  const handleTrigger = async (item: TipMenuItem) => {
    if (!user) {
      alert('Please log in to trigger menu items.');
      return;
    }

    if ((user.wallet?.balance ?? 0) < item.tokenCost) {
      openPurchaseModal();
      return;
    }

    setLoadingId(item.id);
    try {
      const res = await fetch(`/api/stream/${streamId}/tip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenAmount: item.tokenCost,
          menuItemLabel: item.label,
          message: `Triggered: ${item.label}`,
        }),
      });

      if (res.ok) {
        await refreshUser();
        setSuccessItem(item.id);
        setTimeout(() => setSuccessItem(null), 3000);
        if (onTriggerAction) onTriggerAction(item);
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to trigger item');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoadingId(null);
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="w-full rounded-2xl bg-surfaceLight/80 border border-surfaceBorder p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-surfaceBorder/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/20 text-brandPurple">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Interactive Tip Menu</h4>
            <p className="text-[10px] text-gray-400">Trigger real-time actions on {streamerName}&apos;s stream</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {items.map((item) => {
          const isTriggering = loadingId === item.id;
          const isSuccess = successItem === item.id;
          return (
            <div
              key={item.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-surfaceBorder hover:border-gray-600 transition"
            >
              <div className="min-w-0 pr-2">
                <div className="text-xs font-bold text-white truncate">{item.label}</div>
                {item.description && (
                  <div className="text-[10px] text-gray-400 truncate">{item.description}</div>
                )}
              </div>

              <button
                onClick={() => handleTrigger(item)}
                disabled={isTriggering}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  isSuccess
                    ? 'bg-emerald-500 text-black'
                    : 'btn-glow-gold text-black'
                }`}
              >
                {isSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Sent!</span>
                  </>
                ) : isTriggering ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <Coins className="w-3.5 h-3.5" />
                    <span>{item.tokenCost}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

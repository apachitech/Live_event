'use client';

import React from 'react';
import { TipGoalPayload } from '@/types';
import { Target, CheckCircle2 } from 'lucide-react';

export default function TipGoalProgressBar({ goal }: { goal: TipGoalPayload | null }) {
  if (!goal) return null;

  const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));

  return (
    <div className="w-full rounded-xl bg-surfaceLight/80 border border-surfaceBorder/80 p-3 shadow-md">
      <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
        <div className="flex items-center gap-1.5 text-gray-200">
          <Target className="w-3.5 h-3.5 text-tokenGold" />
          <span>{goal.label}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-tokenGold font-black">{goal.currentAmount}</span>
          <span className="text-gray-400">/ {goal.targetAmount} tokens</span>
          <span className="text-xs text-gray-400 ml-1">({percent}%)</span>
        </div>
      </div>

      <div className="w-full h-3 rounded-full bg-surface border border-surfaceBorder overflow-hidden relative">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 via-purple-500 to-pink-500 transition-all duration-500 relative"
          style={{ width: `${percent}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse-subtle" />
        </div>
      </div>

      {goal.reached && (
        <div className="mt-1.5 flex items-center justify-center gap-1 text-[11px] text-emerald-400 font-bold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Goal Reached! Thank you for the community support!</span>
        </div>
      )}
    </div>
  );
}

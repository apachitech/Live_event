'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BarChart3, Coins, Check, X, Sparkles, Trophy } from 'lucide-react';

export interface PollOptionItem {
  id: string;
  text: string;
  voteCount: number;
  percentage: number;
}

export interface PollData {
  id: string;
  question: string;
  tokenCost: number;
  active: boolean;
  totalVotes: number;
  userVotedOptionId?: string | null;
  options: PollOptionItem[];
}

interface StreamPollCardProps {
  streamId: string;
  poll: PollData | null;
  isStreamer: boolean;
  onPollClosed?: () => void;
  onVoteCast?: (optionId: string) => void;
}

export default function StreamPollCard({
  streamId,
  poll,
  isStreamer,
  onPollClosed,
  onVoteCast,
}: StreamPollCardProps) {
  const { user, openPurchaseModal } = useAuth();
  const [votingOptionId, setVotingOptionId] = useState<string | null>(null);
  const [votedOptionId, setVotedOptionId] = useState<string | null>(poll?.userVotedOptionId || null);

  if (!poll || !poll.active) return null;

  const handleVote = async (optionId: string) => {
    if (!user) {
      alert('Please log in to participate in the poll.');
      return;
    }

    if (poll.tokenCost > 0 && (user.wallet?.balance ?? 0) < poll.tokenCost) {
      openPurchaseModal();
      return;
    }

    setVotingOptionId(optionId);
    try {
      const res = await fetch(`/api/stream/${streamId}/polls/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId: poll.id,
          optionId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setVotedOptionId(optionId);
        if (onVoteCast) onVoteCast(optionId);
      } else {
        alert(data.error || 'Failed to vote');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setVotingOptionId(null);
    }
  };

  const handleClosePoll = async () => {
    try {
      await fetch(`/api/stream/${streamId}/polls`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId: poll.id }),
      });
      if (onPollClosed) onPollClosed();
    } catch {}
  };

  const hasVoted = Boolean(votedOptionId);

  return (
    <div className="w-full rounded-2xl bg-gradient-to-tr from-purple-950/40 via-surface to-surface border border-brandPurple/40 p-4 shadow-xl animate-fade-in relative overflow-hidden">
      {/* Decorative pulse glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-surfaceBorder/60 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/20 text-brandPurple">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-brandPurple">
                Live Community Poll
              </span>
              {poll.tokenCost > 0 ? (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-tokenGold text-[10px] font-bold flex items-center gap-1">
                  <Coins className="w-3 h-3" /> {poll.tokenCost} Tokens/vote
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  Free Vote
                </span>
              )}
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-white mt-0.5">{poll.question}</h4>
          </div>
        </div>

        {isStreamer && (
          <button
            onClick={handleClosePoll}
            className="px-2.5 py-1 rounded-lg bg-surfaceLight hover:bg-surfaceBorder text-gray-400 hover:text-white text-[11px] font-semibold transition"
          >
            End Poll
          </button>
        )}
      </div>

      {/* Options List */}
      <div className="space-y-2">
        {poll.options.map((option) => {
          const isSelected = votedOptionId === option.id;
          const isVoting = votingOptionId === option.id;

          return (
            <div
              key={option.id}
              onClick={() => (!hasVoted ? handleVote(option.id) : null)}
              className={`relative rounded-xl p-2.5 border transition overflow-hidden ${
                hasVoted
                  ? isSelected
                    ? 'border-brandPurple bg-purple-600/15'
                    : 'border-surfaceBorder bg-surfaceLight/40'
                  : 'cursor-pointer border-surfaceBorder bg-surfaceLight/60 hover:border-brandPurple hover:bg-purple-600/10'
              }`}
            >
              {/* Animated fill progress bar */}
              {hasVoted && (
                <div
                  className={`absolute inset-0 transition-all duration-500 -z-0 ${
                    isSelected ? 'bg-brandPurple/25' : 'bg-white/5'
                  }`}
                  style={{ width: `${option.percentage}%` }}
                />
              )}

              <div className="relative z-10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {isSelected && <Check className="w-3.5 h-3.5 text-brandPurple font-bold" />}
                  <span className={`font-semibold ${isSelected ? 'text-white font-bold' : 'text-gray-200'}`}>
                    {option.text}
                  </span>
                </div>

                <div className="flex items-center gap-2 font-mono text-[11px]">
                  {hasVoted && (
                    <span className="text-gray-400">
                      {option.voteCount} {option.voteCount === 1 ? 'vote' : 'votes'} ({option.percentage}%)
                    </span>
                  )}
                  {!hasVoted && (
                    <button
                      disabled={isVoting}
                      className="btn-glow-purple px-3 py-1 rounded-lg text-[10px] font-bold text-white shadow"
                    >
                      {isVoting ? 'Voting...' : poll.tokenCost > 0 ? `Vote (${poll.tokenCost}🪙)` : 'Vote Free'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer count */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400 font-medium">
        <span>{poll.totalVotes} total votes submitted</span>
        {hasVoted && <span className="text-brandPurple font-bold">✓ Your vote has been counted</span>}
      </div>
    </div>
  );
}

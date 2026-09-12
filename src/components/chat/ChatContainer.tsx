'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { ChatMessagePayload } from '@/types';
import { Send, Sparkles, AlertCircle, MessageSquare, Pin, X } from 'lucide-react';
import BadgePill from '@/components/badges/BadgePill';

interface ChatContainerProps {
  streamId: string;
  initialMessages?: ChatMessagePayload[];
}

export default function ChatContainer({ streamId, initialMessages = [] }: ChatContainerProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessagePayload[]>(initialMessages);
  const [pinnedAnnouncement, setPinnedAnnouncement] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [rateLimitWarning, setRateLimitWarning] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const isModerator = user?.role === 'STREAMER' || user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  // Sync initialMessages when passed or updated from parent
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const combined = [...prev];
        for (const m of initialMessages) {
          if (!existingIds.has(m.id)) {
            combined.push(m);
            existingIds.add(m.id);
          }
        }
        return combined.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      });
    }
  }, [initialMessages]);

  // Load persisted chat history from server
  useEffect(() => {
    if (streamId) {
      fetch(`/api/stream/${streamId}/chat`)
        .then((res) => res.json())
        .then((data) => {
          if (data.messages && data.messages.length > 0) {
            setMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const combined = [...prev];
              for (const m of data.messages) {
                if (!existingIds.has(m.id)) {
                  combined.push(m);
                  existingIds.add(m.id);
                }
              }
              return combined.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            });
          }
        })
        .catch(() => {});
    }
  }, [streamId]);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.emit('join_room', {
      streamId,
      user: user
        ? { id: user.id, username: user.username, role: user.role }
        : { id: 'guest', username: 'Guest', role: 'VIEWER' },
    });

    socket.on('new_chat_message', (msg: ChatMessagePayload) => {
      setMessages((prev) => {
        // Prevent duplicate messages if already present
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev.slice(-100), msg];
      });
    });

    socket.on('pinned_announcement', (announcement: string | null) => {
      setPinnedAnnouncement(announcement);
    });

    socket.on('chat_error', ({ message }: { message: string }) => {
      setRateLimitWarning(message);
      setTimeout(() => setRateLimitWarning(null), 4000);
    });

    return () => {
      socket.emit('leave_room', { streamId });
      socket.disconnect();
    };
  }, [streamId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    if (!user) {
      alert('Please sign in to participate in the live chat.');
      return;
    }

    setInputText('');

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('send_chat_message', {
        streamId,
        user: {
          userId: user.id,
          username: user.username,
          role: user.role,
        },
        body: text,
      });
    } else {
      // Fallback to REST API for guaranteed hard-copying
      try {
        const res = await fetch(`/api/stream/${streamId}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: text }),
        });
        const data = await res.json();
        if (data.message) {
          setMessages((prev) => [...prev.slice(-100), data.message]);
        }
      } catch (err: any) {
        setRateLimitWarning('Failed to deliver message. Please retry.');
      }
    }
  };

  const handleUnpin = () => {
    if (socketRef.current) {
      socketRef.current.emit('pinned_announcement', { streamId, announcement: null });
    }
    setPinnedAnnouncement(null);
  };

  return (
    <div className="flex flex-col h-full rounded-2xl bg-surface border border-surfaceBorder overflow-hidden shadow-xl">
      {/* Chat Room Header */}
      <div className="px-4 py-3 border-b border-surfaceBorder bg-surfaceLight/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-brandPurple" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Live Stream Chat</h3>
        </div>
        <span className="text-[10px] text-gray-400 font-medium">Filtered & Rate-Limited</span>
      </div>

      {/* Pinned Announcement Sticky Banner */}
      {pinnedAnnouncement && (
        <div className="px-3.5 py-2 bg-gradient-to-r from-purple-950/70 to-pink-950/60 border-b border-purple-500/30 flex items-start gap-2 text-xs text-purple-200 animate-fade-in">
          <Pin className="w-3.5 h-3.5 text-tokenGold flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-semibold text-white leading-snug">
            {pinnedAnnouncement}
          </div>
          {isModerator && (
            <button
              onClick={handleUnpin}
              className="p-1 rounded text-gray-400 hover:text-white transition"
              title="Remove Pinned Announcement"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Message Feed */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 py-8">
            <Sparkles className="w-6 h-6 mb-1 text-gray-600" />
            <p className="text-xs">Chat is quiet. Say hello to the streamer!</p>
          </div>
        ) : (
          messages.map((m) => {
            const isStreamer = m.role === 'STREAMER';
            const isAdmin = m.role === 'ADMIN';
            const badgeType =
              m.badge || (isAdmin ? 'ADMIN' : isStreamer ? 'STREAMER' : m.isSubscriber ? 'Subscriber' : null);

            return (
              <div key={m.id} className="text-xs leading-relaxed flex items-start gap-1.5 break-words">
                <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                  {badgeType && <BadgePill type={badgeType} size="sm" />}
                  <span
                    className={`font-bold ${
                      isAdmin
                        ? 'text-red-400'
                        : isStreamer
                        ? 'text-purple-300'
                        : 'text-gray-300'
                    }`}
                  >
                    {m.username}:
                  </span>
                </div>

                <span className={m.flagged ? 'text-gray-500 italic' : 'text-gray-100'}>
                  {m.body}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Rate limit warning banner */}
      {rateLimitWarning && (
        <div className="px-3 py-1.5 bg-red-500/10 border-t border-red-500/20 text-[11px] text-red-400 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{rateLimitWarning}</span>
        </div>
      )}

      {/* Chat Input Bar */}
      <form
        onSubmit={handleSendMessage}
        className="p-2.5 border-t border-surfaceBorder bg-surfaceLight/30 flex items-center gap-2"
      >
        <input
          type="text"
          maxLength={200}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={user ? 'Send a message...' : 'Sign in to chat...'}
          disabled={!user}
          className="flex-1 px-3.5 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-brandPurple transition disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!user || !inputText.trim()}
          className="btn-glow-purple p-2 rounded-xl text-white disabled:opacity-40 disabled:pointer-events-none transition"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}

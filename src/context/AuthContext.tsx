'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserRole } from '@/types';

interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  ageVerified: boolean;
  avatarUrl?: string;
  wallet?: {
    balance: number;
    earnedBalance: number;
  };
  streamerProfile?: {
    id: string;
    displayName: string;
    kycStatus: string;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  isPurchaseModalOpen: boolean;
  openPurchaseModal: () => void;
  closePurchaseModal: () => void;
  isAgeModalOpen: boolean;
  openAgeModal: () => void;
  closeAgeModal: () => void;
  isCampaignModalOpen: boolean;
  openCampaignModal: () => void;
  closeCampaignModal: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isAgeModalOpen, setIsAgeModalOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        refreshUser,
        logout,
        isPurchaseModalOpen,
        openPurchaseModal: () => setIsPurchaseModalOpen(true),
        closePurchaseModal: () => setIsPurchaseModalOpen(false),
        isAgeModalOpen,
        openAgeModal: () => setIsAgeModalOpen(true),
        closeAgeModal: () => setIsAgeModalOpen(false),
        isCampaignModalOpen,
        openCampaignModal: () => {
          if (!user) {
            if (typeof window !== 'undefined') {
              window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
            }
            return;
          }
          setIsCampaignModalOpen(true);
        },
        closeCampaignModal: () => setIsCampaignModalOpen(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

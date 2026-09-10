export type UserRole = 'VIEWER' | 'STREAMER' | 'MODERATOR' | 'ADMIN';
export type KYCStatus = 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export type StreamStatus = 'OFFLINE' | 'LIVE' | 'PRIVATE' | 'ENDED';
export type TransactionType =
  | 'PURCHASE'
  | 'TIP'
  | 'SUBSCRIPTION'
  | 'PRIVATE_SHOW'
  | 'STREAMER_PAYOUT'
  | 'PLATFORM_FEE'
  | 'REFUND';
export type PayoutStatus = 'REQUESTED' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
export type FlagStatus = 'PENDING' | 'REVIEWED' | 'DISMISSED' | 'ACTIONED';

export interface AuthSession {
  userId: string;
  email: string;
  username: string;
  role: UserRole;
  ageVerified: boolean;
}

export interface TokenPackage {
  id: string;
  tokens: number;
  priceCents: number;
  label: string;
  bonusTokens?: number;
  badge?: string;
}

export const TOKEN_PACKAGES: TokenPackage[] = [
  { id: 'pack-100', tokens: 100, priceCents: 999, label: 'Starter Pack' },
  { id: 'pack-500', tokens: 550, priceCents: 4499, label: 'Popular Pack', bonusTokens: 50, badge: 'BEST VALUE' },
  { id: 'pack-1200', tokens: 1350, priceCents: 9999, label: 'Super Fan Pack', bonusTokens: 150, badge: '15% BONUS' },
  { id: 'pack-3000', tokens: 3600, priceCents: 24999, label: 'VIP Pack', bonusTokens: 600, badge: '20% BONUS' },
];

export interface ChatMessagePayload {
  id: string;
  streamId: string;
  userId: string;
  username: string;
  body: string;
  role: UserRole;
  isSubscriber?: boolean;
  badge?: string;
  createdAt: string;
  flagged?: boolean;
}

export interface TipAlertPayload {
  id: string;
  streamId: string;
  senderUsername: string;
  amount: number;
  message?: string;
  menuItemLabel?: string;
  createdAt: string;
}

export interface TipGoalPayload {
  id: string;
  streamId: string;
  label: string;
  targetAmount: number;
  currentAmount: number;
  reached: boolean;
}

export interface PrivateShowRequestPayload {
  requestId: string;
  streamId: string;
  viewerId: string;
  viewerUsername: string;
  ratePerMin: number;
}

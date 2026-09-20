import { TokenPackage } from '@/types';

export type SupportedPaymentMethod = 'STRIPE' | 'CCBILL' | 'MOBILE_MONEY' | 'LEMON_SQUEEZY' | 'CRYPTO' | 'VAULTPAY' | 'SASPAY' | 'MOCK';

export interface SasPayOptions {
  phoneNumber?: string;
  country?: string; // 'CI' | 'BJ' | 'SN' | 'CM' | 'TG' | 'BF'
  operator?: string; // 'wave' | 'orange' | 'mtn' | 'moov' | 'djamo' | 'card'
  currency?: string; // 'XOF' | 'XAF' | 'USD'
  customerEmail?: string;
  customerName?: string;
}

export interface MobileMoneyOptions {
  country: string; // 'KE' | 'NG' | 'GH' | 'CI' | 'SN' | 'UG' | 'CM' | 'ZA' | 'RW'
  network: string; // 'MPESA' | 'MTN' | 'ORANGE' | 'AIRTEL' | 'WAVE' | 'VODAFONE'
  phoneNumber?: string;
  currency?: string;
}

export interface CryptoPaymentOptions {
  payCurrency: 'btc' | 'eth' | 'usdttrc20' | 'usdterc20' | 'sol' | 'usdc' | string;
  network?: string;
  payAddress?: string;
}

export interface VaultPayOptions {
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
  cardholderName?: string;
  isVirtualCard?: boolean;
}

export interface CheckoutSessionResult {
  sessionId: string;
  checkoutUrl: string;
  provider: string;
  mobileMoneyDetails?: MobileMoneyOptions;
  sasPayDetails?: SasPayOptions;
  cryptoDetails?: {
    payAddress?: string;
    payAmount?: number;
    payCurrency?: string;
    network?: string;
    qrCodeUrl?: string;
  };
  cardDetails?: {
    cardBrand?: string;
    last4?: string;
    isVirtual?: boolean;
  };
}

export interface PayoutExecutionResult {
  success: boolean;
  referenceId: string;
  error?: string;
}

export interface PaymentProcessor {
  name: string;
  createCheckoutSession(
    userId: string,
    pkg: TokenPackage,
    successUrl: string,
    cancelUrl: string,
    mobileMoneyOptions?: MobileMoneyOptions,
    cryptoOptions?: CryptoPaymentOptions,
    vaultPayOptions?: VaultPayOptions,
    sasPayOptions?: SasPayOptions
  ): Promise<CheckoutSessionResult>;
  verifyWebhookEvent(body: string, headers: Record<string, string | string[] | undefined>): Promise<{
    verified: boolean;
    eventType: string;
    userId?: string;
    tokens?: number;
    fiatAmountCents?: number;
    paymentRef?: string;
    metadata?: any;
  }>;
  processStreamerPayout(streamerId: string, amountCents: number, payoutDetails: any): Promise<PayoutExecutionResult>;
}

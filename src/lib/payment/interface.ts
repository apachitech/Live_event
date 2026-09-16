import { TokenPackage } from '@/types';

export type SupportedPaymentMethod = 'STRIPE' | 'CCBILL' | 'MOBILE_MONEY' | 'LEMON_SQUEEZY' | 'CRYPTO' | 'MOCK';

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

export interface CheckoutSessionResult {
  sessionId: string;
  checkoutUrl: string;
  provider: string;
  mobileMoneyDetails?: MobileMoneyOptions;
  cryptoDetails?: {
    payAddress?: string;
    payAmount?: number;
    payCurrency?: string;
    network?: string;
    qrCodeUrl?: string;
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
    cryptoOptions?: CryptoPaymentOptions
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

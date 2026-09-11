import { TokenPackage } from '@/types';

export type SupportedPaymentMethod = 'STRIPE' | 'CCBILL' | 'MOBILE_MONEY' | 'LEMON_SQUEEZY' | 'MOCK';

export interface MobileMoneyOptions {
  country: string; // 'KE' | 'NG' | 'GH' | 'CI' | 'SN' | 'UG' | 'CM' | 'ZA' | 'RW'
  network: string; // 'MPESA' | 'MTN' | 'ORANGE' | 'AIRTEL' | 'WAVE' | 'VODAFONE'
  phoneNumber?: string;
  currency?: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  checkoutUrl: string;
  provider: string;
  mobileMoneyDetails?: MobileMoneyOptions;
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
    mobileMoneyOptions?: MobileMoneyOptions
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

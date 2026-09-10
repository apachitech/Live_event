import { PaymentProcessor, CheckoutSessionResult, PayoutExecutionResult, MobileMoneyOptions } from './interface';
import { TokenPackage } from '@/types';

export class MockPaymentProcessor implements PaymentProcessor {
  name = 'MockSandboxPayment';

  async createCheckoutSession(
    userId: string,
    pkg: TokenPackage,
    successUrl: string,
    _cancelUrl: string,
    mobileMoneyOptions?: MobileMoneyOptions
  ): Promise<CheckoutSessionResult> {
    const sessionId = `mock_sess_${Date.now()}_${userId}`;
    const url = new URL(successUrl);
    url.searchParams.set('session_id', sessionId);
    url.searchParams.set('package_id', pkg.id);
    url.searchParams.set('tokens', String(pkg.tokens));
    url.searchParams.set('fiat_cents', String(pkg.priceCents));
    if (mobileMoneyOptions) {
      url.searchParams.set('network', mobileMoneyOptions.network);
      url.searchParams.set('country', mobileMoneyOptions.country);
    }

    return {
      sessionId,
      checkoutUrl: url.toString(),
      provider: this.name,
      mobileMoneyDetails: mobileMoneyOptions,
    };
  }

  async verifyWebhookEvent(_body: string, _headers: Record<string, string | string[] | undefined>) {
    return {
      verified: true,
      eventType: 'payment_intent.succeeded',
      metadata: {},
    };
  }

  async processStreamerPayout(_streamerId: string, amountCents: number, _payoutDetails: any): Promise<PayoutExecutionResult> {
    return {
      success: true,
      referenceId: `mock_payout_tx_${Date.now()}_cents_${amountCents}`,
    };
  }
}

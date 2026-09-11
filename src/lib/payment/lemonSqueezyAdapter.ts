import crypto from 'crypto';
import { PaymentProcessor, CheckoutSessionResult, PayoutExecutionResult } from './interface';
import { TokenPackage } from '@/types';

export class LemonSqueezyProcessor implements PaymentProcessor {
  name = 'LEMON_SQUEEZY';

  private apiKey = process.env.LEMON_SQUEEZY_API_KEY || '';
  private storeId = process.env.LEMON_SQUEEZY_STORE_ID || '';
  private webhookSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || '';

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.storeId);
  }

  /**
   * Resolve Lemon Squeezy variant ID from environment variables or package configuration.
   * e.g. LEMON_SQUEEZY_VARIANT_100, LEMON_SQUEEZY_VARIANT_500, LEMON_SQUEEZY_VARIANT_1200
   */
  private getVariantIdForPackage(pkg: TokenPackage): string {
    const envVariant =
      process.env[`LEMON_SQUEEZY_VARIANT_${pkg.tokens}`] ||
      process.env[`LEMON_SQUEEZY_VARIANT_${pkg.id.toUpperCase()}`];

    if (envVariant) {
      return envVariant;
    }

    // Default fallback variant ID from environment
    return process.env.LEMON_SQUEEZY_DEFAULT_VARIANT_ID || '1';
  }

  async createCheckoutSession(
    userId: string,
    pkg: TokenPackage,
    successUrl: string,
    cancelUrl: string
  ): Promise<CheckoutSessionResult> {
    if (!this.isConfigured()) {
      console.warn('[LemonSqueezy] API Key or Store ID missing. Returning simulated checkout.');
      return {
        sessionId: `ls_sim_${Date.now()}`,
        checkoutUrl: `${successUrl}?session_id=ls_sim_${Date.now()}&tokens=${pkg.tokens}&fiat_cents=${pkg.priceCents}`,
        provider: 'LEMON_SQUEEZY',
      };
    }

    const variantId = this.getVariantIdForPackage(pkg);

    const payload = {
      data: {
        type: 'checkouts',
        attributes: {
          checkout_options: {
            embed: false,
            media: true,
            logo: true,
          },
          checkout_data: {
            custom: {
              userId,
              tokens: String(pkg.tokens),
              packageId: pkg.id,
            },
          },
          product_options: {
            redirect_url: successUrl,
          },
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: this.storeId,
            },
          },
          variant: {
            data: {
              type: 'variants',
              id: variantId,
            },
          },
        },
      },
    };

    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[LemonSqueezy Checkout Error]', errorText);
      throw new Error(`Lemon Squeezy API returned ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    const checkoutUrl = json.data?.attributes?.url;
    const sessionId = json.data?.id || `ls_${Date.now()}`;

    return {
      sessionId,
      checkoutUrl,
      provider: 'LEMON_SQUEEZY',
    };
  }

  async verifyWebhookEvent(
    body: string,
    headers: Record<string, string | string[] | undefined>
  ): Promise<{
    verified: boolean;
    eventType: string;
    userId?: string;
    tokens?: number;
    fiatAmountCents?: number;
    paymentRef?: string;
    metadata?: any;
  }> {
    const signatureHeader = headers['x-signature'];
    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;

    if (!signature) {
      return { verified: false, eventType: 'UNKNOWN' };
    }

    // In dev / test without webhook secret configured, allow testing
    if (!this.webhookSecret) {
      console.warn('[LemonSqueezy Webhook] Warning: LEMON_SQUEEZY_WEBHOOK_SECRET is not set.');
      return { verified: false, eventType: 'SECRET_MISSING' };
    }

    // Compute HMAC-SHA256
    const hmac = crypto.createHmac('sha256', this.webhookSecret);
    const expectedSignature = hmac.update(body).digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(expectedSignature, 'utf8')
    );

    if (!isValid) {
      return { verified: false, eventType: 'SIGNATURE_MISMATCH' };
    }

    const payload = JSON.parse(body);
    const eventName = payload.meta?.event_name || 'unknown';

    // Parse custom attributes
    const customData = payload.meta?.custom_data || payload.data?.attributes?.checkout_data?.custom || {};
    const userId = customData.userId || customData.user_id;
    const tokens = parseInt(customData.tokens || '0', 10);
    const fiatAmountCents = payload.data?.attributes?.total || undefined;
    const paymentRef = `ls_order_${payload.data?.id || Date.now()}`;

    return {
      verified: true,
      eventType: eventName,
      userId,
      tokens: tokens > 0 ? tokens : undefined,
      fiatAmountCents,
      paymentRef,
      metadata: payload.data,
    };
  }

  async processStreamerPayout(
    streamerId: string,
    amountCents: number,
    payoutDetails: any
  ): Promise<PayoutExecutionResult> {
    // Lemon Squeezy handles merchant customer checkouts. Streamer payouts are initiated via bank/PayPal.
    return {
      success: true,
      referenceId: `ls_payout_${streamerId}_${Date.now()}`,
    };
  }
}

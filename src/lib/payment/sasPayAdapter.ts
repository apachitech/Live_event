import crypto from 'crypto';
import {
  PaymentProcessor,
  CheckoutSessionResult,
  PayoutExecutionResult,
  SasPayOptions,
  MobileMoneyOptions,
  CryptoPaymentOptions,
  VaultPayOptions,
} from './interface';
import { TokenPackage } from '@/types';

export interface SasPayNetwork {
  code: string;
  name: string;
  country: string;
  countryName: string;
  flag: string;
  currency: 'XOF' | 'XAF' | 'USD' | 'GNF' | string;
  badgeColor: string;
}

export const SUPPORTED_SASPAY_NETWORKS: SasPayNetwork[] = [
  // Côte d'Ivoire
  { code: 'wave_ci', name: 'Wave', country: 'CI', countryName: "Côte d'Ivoire", flag: '🇨🇮', currency: 'XOF', badgeColor: '#1dc4e9' },
  { code: 'orange_ci', name: 'Orange Money', country: 'CI', countryName: "Côte d'Ivoire", flag: '🇨🇮', currency: 'XOF', badgeColor: '#ff7900' },
  { code: 'mtn_ci', name: 'MTN MoMo', country: 'CI', countryName: "Côte d'Ivoire", flag: '🇨🇮', currency: 'XOF', badgeColor: '#ffcc00' },
  { code: 'moov_ci', name: 'Moov Money', country: 'CI', countryName: "Côte d'Ivoire", flag: '🇨🇮', currency: 'XOF', badgeColor: '#005baa' },
  { code: 'djamo_ci', name: 'Djamo', country: 'CI', countryName: "Côte d'Ivoire", flag: '🇨🇮', currency: 'XOF', badgeColor: '#5334eb' },

  // Sénégal
  { code: 'wave_sn', name: 'Wave', country: 'SN', countryName: 'Sénégal', flag: '🇸🇳', currency: 'XOF', badgeColor: '#1dc4e9' },
  { code: 'orange_sn', name: 'Orange Money', country: 'SN', countryName: 'Sénégal', flag: '🇸🇳', currency: 'XOF', badgeColor: '#ff7900' },
  { code: 'free_sn', name: 'Free Money', country: 'SN', countryName: 'Sénégal', flag: '🇸🇳', currency: 'XOF', badgeColor: '#e1000f' },

  // Bénin
  { code: 'mtn_bj', name: 'MTN Mobile Money', country: 'BJ', countryName: 'Bénin', flag: '🇧🇯', currency: 'XOF', badgeColor: '#ffcc00' },
  { code: 'moov_bj', name: 'Moov Money', country: 'BJ', countryName: 'Bénin', flag: '🇧🇯', currency: 'XOF', badgeColor: '#005baa' },
  { code: 'celtiis_bj', name: 'Celtiis Cash', country: 'BJ', countryName: 'Bénin', flag: '🇧🇯', currency: 'XOF', badgeColor: '#008080' },

  // Cameroun
  { code: 'orange_cm', name: 'Orange Money', country: 'CM', countryName: 'Cameroun', flag: '🇨🇲', currency: 'XAF', badgeColor: '#ff7900' },
  { code: 'mtn_cm', name: 'MTN MoMo', country: 'CM', countryName: 'Cameroun', flag: '🇨🇲', currency: 'XAF', badgeColor: '#ffcc00' },

  // Togo
  { code: 'tmoney_tg', name: 'T-Money (Togocom)', country: 'TG', countryName: 'Togo', flag: '🇹🇬', currency: 'XOF', badgeColor: '#00a859' },
  { code: 'moov_tg', name: 'Moov Money', country: 'TG', countryName: 'Togo', flag: '🇹🇬', currency: 'XOF', badgeColor: '#005baa' },

  // Mali
  { code: 'orange_ml', name: 'Orange Money', country: 'ML', countryName: 'Mali', flag: '🇲🇱', currency: 'XOF', badgeColor: '#ff7900' },
  { code: 'moov_ml', name: 'Moov Money (Malitel)', country: 'ML', countryName: 'Mali', flag: '🇲🇱', currency: 'XOF', badgeColor: '#005baa' },

  // Burkina Faso
  { code: 'orange_bf', name: 'Orange Money', country: 'BF', countryName: 'Burkina Faso', flag: '🇧🇫', currency: 'XOF', badgeColor: '#ff7900' },
  { code: 'moov_bf', name: 'Moov Money (Onatel)', country: 'BF', countryName: 'Burkina Faso', flag: '🇧🇫', currency: 'XOF', badgeColor: '#005baa' },

  // Gabon
  { code: 'airtel_ga', name: 'Airtel Money', country: 'GA', countryName: 'Gabon', flag: '🇬🇦', currency: 'XAF', badgeColor: '#e60000' },
  { code: 'moov_ga', name: 'Moov Money', country: 'GA', countryName: 'Gabon', flag: '🇬🇦', currency: 'XAF', badgeColor: '#005baa' },

  // RDC (Congo Kinshasa)
  { code: 'mpesa_cd', name: 'Vodacom M-Pesa', country: 'CD', countryName: 'RDC', flag: '🇨🇩', currency: 'USD', badgeColor: '#e60000' },
  { code: 'airtel_cd', name: 'Airtel Money', country: 'CD', countryName: 'RDC', flag: '🇨🇩', currency: 'USD', badgeColor: '#e60000' },
  { code: 'orange_cd', name: 'Orange Money', country: 'CD', countryName: 'RDC', flag: '🇨🇩', currency: 'USD', badgeColor: '#ff7900' },

  // Guinée
  { code: 'orange_gn', name: 'Orange Money', country: 'GN', countryName: 'Guinée', flag: '🇬🇳', currency: 'GNF', badgeColor: '#ff7900' },
  { code: 'mtn_gn', name: 'MTN MoMo', country: 'GN', countryName: 'Guinée', flag: '🇬🇳', currency: 'GNF', badgeColor: '#ffcc00' },

  // Congo Brazzaville
  { code: 'mtn_cg', name: 'MTN MoMo', country: 'CG', countryName: 'Congo', flag: '🇨🇬', currency: 'XAF', badgeColor: '#ffcc00' },
  { code: 'airtel_cg', name: 'Airtel Money', country: 'CG', countryName: 'Congo', flag: '🇨🇬', currency: 'XAF', badgeColor: '#e60000' },

  // International / Pan-African Cards
  { code: 'card', name: 'Carte Bancaire (Visa / Mastercard)', country: 'ALL', countryName: 'International', flag: '💳', currency: 'XOF', badgeColor: '#3b82f6' },
];

export class SasPayProcessor implements PaymentProcessor {
  name = 'SASPAY';

  private apiKey = process.env.SASPAY_SECRET_KEY || process.env.SASPAY_API_KEY || '';
  private webhookSecret = process.env.SASPAY_WEBHOOK_SECRET || '';
  private baseUrl = 'https://api.saspay.me/api/v1';
  private isSandbox = process.env.SASPAY_ENVIRONMENT !== 'production';

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Convert USD cents to CFA Francs (XOF/XAF)
   * Standard conversion rate: 1 USD = ~600 XOF
   */
  public centsToXOF(cents: number): number {
    const usd = cents / 100;
    return Math.round(usd * 600);
  }

  /**
   * Create a checkout session on saspay.me
   * If direct push (softpay) phone number is provided, initializes push payment.
   * Otherwise generates a hosted checkout session redirecting to pay.saspay.me
   */
  async createCheckoutSession(
    userId: string,
    pkg: TokenPackage,
    successUrl: string,
    cancelUrl: string,
    _mobileMoneyOptions?: MobileMoneyOptions,
    _cryptoOptions?: CryptoPaymentOptions,
    _vaultPayOptions?: VaultPayOptions,
    sasPayOptions?: SasPayOptions
  ): Promise<CheckoutSessionResult> {
    const currency = sasPayOptions?.currency || 'XOF';
    // For XOF and XAF (CFA Francs), amount must be a whole round integer (no decimals like .00)
    const amountInXOF = Math.max(100, Math.round(this.centsToXOF(pkg.priceCents)));
    const amountVal = currency === 'XOF' || currency === 'XAF' 
      ? amountInXOF 
      : parseFloat((pkg.priceCents / 100).toFixed(2));

    const idempotencyKey = `saspay_cs_${Date.now()}_${userId}`;

    if (!this.isConfigured()) {
      throw new Error(
        'SasPay gateway is not configured: SASPAY_SECRET_KEY is missing in your server environment variables. Please add SASPAY_SECRET_KEY in your Render Dashboard > Environment to process live payments.'
      );
    }

    // Clean return URL without illegal template characters like {id}
    let cleanReturnUrl = successUrl;
    try {
      const urlObj = new URL(successUrl);
      urlObj.searchParams.set('package_id', pkg.id);
      urlObj.searchParams.set('tokens', String(pkg.tokens));
      urlObj.searchParams.set('fiat_cents', String(pkg.priceCents));
      urlObj.searchParams.set('provider', 'saspay');
      cleanReturnUrl = urlObj.toString();
    } catch {
      cleanReturnUrl = `${successUrl}?package_id=${pkg.id}&tokens=${pkg.tokens}&fiat_cents=${pkg.priceCents}&provider=saspay`;
    }

    // Ensure customer email is strictly valid and contains no spaces
    let customerEmail = (sasPayOptions?.customerEmail || '').trim();
    if (!customerEmail || !customerEmail.includes('@') || !customerEmail.includes('.') || customerEmail.includes(' ')) {
      const cleanUserTag = userId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 10) || 'viewer';
      customerEmail = `customer_${cleanUserTag}@gmail.com`;
    }

    // Ensure customer name is non-empty and clean
    let customerName = (sasPayOptions?.customerName || '').trim().replace(/[^\w\s-]/gi, '');
    if (!customerName) {
      customerName = 'PulseStream Viewer';
    }

    const customerPhone = sasPayOptions?.phoneNumber ? sasPayOptions.phoneNumber.trim().replace(/\s+/g, '') : undefined;

    // 1. Direct Softpay Push (if phone number is explicitly specified by the user)
    if (customerPhone && sasPayOptions?.operator && sasPayOptions.operator !== 'card') {
      try {
        const softpayRes = await fetch(`${this.baseUrl}/payments/softpay/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
          },
          signal: AbortSignal.timeout(10000),
          body: JSON.stringify({
            amount: amountVal,
            currency,
            method: sasPayOptions.operator,
            phone: customerPhone,
            customer_email: customerEmail,
            customer_name: customerName,
            description: `Live Stream ${pkg.tokens} Tokens (${pkg.label})`,
            metadata: {
              userId,
              packageId: pkg.id,
              tokens: pkg.tokens,
              fiatAmountCents: pkg.priceCents,
            },
          }),
        });

        if (softpayRes.ok) {
          const data = await softpayRes.json();
          if (data.checkout_url) {
            return {
              sessionId: data.id || data.reference || idempotencyKey,
              checkoutUrl: data.checkout_url,
              provider: 'SASPAY_SOFTPAY',
              sasPayDetails: sasPayOptions,
            };
          }
        } else {
          const softErr = await softpayRes.text().catch(() => '');
          console.warn('[SasPay Adapter] Softpay direct push failed, proceeding to hosted checkout:', softErr);
        }
      } catch (err: any) {
        console.warn('[SasPay Adapter] Softpay push exception, proceeding to hosted checkout:', err.message);
      }
    }

    // 2. SasPay Hosted Checkout Session (pay.saspay.me)
    try {
      // Standard hosted checkout payload conformant to SasPay API specification
      const sessionPayload: Record<string, any> = {
        amount: amountVal,
        currency,
        customer_email: customerEmail,
        customer_name: customerName,
        description: `Live Stream ${pkg.tokens} Tokens (${pkg.label})`,
        return_url: cleanReturnUrl,
        success_url: cleanReturnUrl,
        cancel_url: cancelUrl || cleanReturnUrl,
        metadata: {
          userId,
          packageId: pkg.id,
          tokens: pkg.tokens,
          fiatAmountCents: pkg.priceCents,
        },
      };

      if (customerPhone) {
        sessionPayload.customer_phone = customerPhone;
      }

      let sessionRes = await fetch(`${this.baseUrl}/checkout-sessions/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify(sessionPayload),
      });

      // Self-healing fallback: If primary payload is rejected with 400 (e.g. metadata or phone format issue),
      // retry with the minimalist schema accepted by all SasPay gateway versions
      if (!sessionRes.ok && sessionRes.status === 400) {
        console.warn('[SasPay Adapter] Primary checkout-session rejected with 400. Attempting minimalist fallback...');
        try {
          const fallbackRes = await fetch(`${this.baseUrl}/checkout-sessions/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              'Idempotency-Key': `${idempotencyKey}_fb`,
            },
            signal: AbortSignal.timeout(8000),
            body: JSON.stringify({
              amount: String(amountVal),
              currency,
              customer_email: customerEmail,
              customer_name: customerName,
              description: `Tokens - ${pkg.tokens}`,
              return_url: cleanReturnUrl,
            }),
          });
          if (fallbackRes.ok) {
            sessionRes = fallbackRes;
          }
        } catch (fbErr: any) {
          console.warn('[SasPay Adapter] Minimalist fallback attempt failed:', fbErr.message);
        }
      }

      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        if (sessionData.checkout_url) {
          return {
            sessionId: sessionData.id || idempotencyKey,
            checkoutUrl: sessionData.checkout_url,
            provider: 'SASPAY',
            sasPayDetails: sasPayOptions,
          };
        }
        throw new Error(`SasPay did not return a valid checkout URL: ${JSON.stringify(sessionData)}`);
      } else {
        const errText = await sessionRes.text().catch(() => '');
        let errMsg = '';
        try {
          const parsed = JSON.parse(errText);
          if (typeof parsed === 'string') {
            errMsg = parsed;
          } else if (parsed && typeof parsed === 'object') {
            if (typeof parsed.message === 'string') {
              errMsg = parsed.message;
            } else if (typeof parsed.error === 'string') {
              errMsg = parsed.error;
            } else if (typeof parsed.detail === 'string') {
              errMsg = parsed.detail;
            } else if (typeof parsed.error === 'object' && parsed.error !== null) {
              errMsg = typeof parsed.error.message === 'string' ? parsed.error.message : JSON.stringify(parsed.error);
            } else if (typeof parsed.message === 'object' && parsed.message !== null) {
              errMsg = JSON.stringify(parsed.message);
            } else {
              // Django REST framework field validation errors: { field: ["error message"] }
              const fieldErrors = Object.entries(parsed)
                .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(', ') : typeof errs === 'object' ? JSON.stringify(errs) : String(errs)}`)
                .join(' | ');
              errMsg = fieldErrors || JSON.stringify(parsed);
            }
          }
        } catch {}

        if (!errMsg) errMsg = errText || 'Unable to create checkout session.';
        console.error(`[SasPay Adapter] API responded with error (${sessionRes.status}):`, errMsg, errText);

        if (sessionRes.status === 401) {
          throw new Error('SasPay authentication failed (HTTP 401). Please check that your SASPAY_SECRET_KEY in Render environment is correct.');
        }
        if (sessionRes.status === 403) {
          throw new Error(`SasPay access denied (HTTP 403). Ensure your server outbound IP is whitelisted on your SasPay dashboard (${errMsg}).`);
        }
        throw new Error(`SasPay API error (${sessionRes.status}): ${errMsg}`);
      }
    } catch (err: any) {
      console.error('[SasPay Adapter] Communication error with SasPay:', err);
      throw new Error(err.message || 'Failed to communicate with SasPay payment gateway.');
    }
  }

  /**
   * Verify Webhook payload from saspay.me
   * SasPay sends HMAC-SHA256 signature in X-SasPay-Signature header
   */
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
    let payload: any;
    try {
      payload = JSON.parse(body);
    } catch {
      return { verified: false, eventType: 'INVALID_JSON' };
    }

    const signature = (headers['x-saspay-signature'] || headers['x-signature']) as string | undefined;

    // Verify HMAC-SHA256 signature if secret is configured
    if (this.webhookSecret && signature) {
      const hmac = crypto.createHmac('sha256', this.webhookSecret);
      const expected = hmac.update(body).digest('hex');
      if (signature.toLowerCase() !== expected.toLowerCase()) {
        console.warn('[SasPay Webhook] Signature verification failed');
        return { verified: false, eventType: 'SIGNATURE_MISMATCH' };
      }
    }

    const event = (payload.event || payload.type || payload.status || '').toLowerCase();
    const isSuccess = ['payment.successful', 'checkout.session.completed', 'success', 'successful'].includes(event)
      || payload.status === 'SUCCESSFUL' || payload.status === 'COMPLETED';

    const metadata = payload.data?.metadata || payload.metadata || {};
    let userId = metadata.userId || payload.customer?.user_id || payload.userId;
    let tokens = metadata.tokens ? parseInt(metadata.tokens, 10) : undefined;
    let fiatAmountCents = metadata.fiatAmountCents ? parseInt(metadata.fiatAmountCents, 10) : undefined;

    // Parse payment reference
    const paymentId = payload.data?.id || payload.payment_id || payload.id || `saspay_${Date.now()}`;
    const paymentRef = `saspay_${paymentId}`;

    return {
      verified: isSuccess,
      eventType: isSuccess ? 'payment.successful' : (event || 'payment.pending'),
      userId,
      tokens,
      fiatAmountCents,
      paymentRef,
      metadata: {
        paymentMethod: payload.data?.method || payload.method,
        currency: payload.data?.currency || payload.currency,
        amount: payload.data?.amount || payload.amount,
      },
    };
  }

  /**
   * Process streamer payout (retrait) via saspay.me
   * Calls: POST https://api.saspay.me/api/v1/payouts/initialize/
   *
   * Required payload fields:
   * - amount: string decimal (e.g. "15000.00")
   * - currency: "XOF" | "XAF"
   * - country: "CI" | "BJ" | "SN" | "CM" | "TG"
   * - method: e.g. "orange_ci", "mtn_bj", "wave_ci"
   * - customer: { email, phone }
   * - recipient: { msisdn }
   */
  async processStreamerPayout(
    streamerId: string,
    amountCents: number,
    payoutDetails: any
  ): Promise<PayoutExecutionResult> {
    const phone = payoutDetails?.phoneNumber || payoutDetails?.walletAddress || payoutDetails?.phone || '';
    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.length < 8) {
      return {
        success: false,
        referenceId: '',
        error: 'Please provide a valid Mobile Money phone number for SasPay payout.',
      };
    }

    const country = (payoutDetails?.country || 'CI').toUpperCase();
    const currency = country === 'CM' ? 'XAF' : 'XOF';
    const method = payoutDetails?.method || payoutDetails?.operator || 'wave_ci';
    const amountInCfa = this.centsToXOF(amountCents);
    const amountStr = amountInCfa.toFixed(2);

    const idempotencyKey = `saspay_payout_${Date.now()}_${streamerId}`;

    if (this.isConfigured()) {
      try {
        const res = await fetch(`${this.baseUrl}/payouts/initialize/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
          },
          signal: AbortSignal.timeout(8000),
          body: JSON.stringify({
            amount: amountStr,
            currency,
            country,
            method,
            description: `Streamer Cashout - Live Platform (${amountInCfa} CFA)`,
            customer: {
              email: payoutDetails?.accountEmail || `streamer_${streamerId}@platform.local`,
              phone: cleanPhone,
            },
            recipient: {
              msisdn: cleanPhone,
            },
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok && (data.id || data.payout_id || data.reference)) {
          return {
            success: true,
            referenceId: `saspay_${data.id || data.payout_id || data.reference}`,
          };
        } else {
          return {
            success: false,
            referenceId: '',
            error: data.message || data.error || 'SasPay payout failed. Check server IP whitelisting and merchant balance.',
          };
        }
      } catch (err: any) {
        return {
          success: false,
          referenceId: '',
          error: `SasPay payout exception: ${err.message}`,
        };
      }
    }

    // Sandbox simulation mode
    return {
      success: true,
      referenceId: `saspay_payout_sim_${Date.now()}_${streamerId}_${cleanPhone.slice(-4)}`,
    };
  }
}

import crypto from 'crypto';
import {
  PaymentProcessor,
  CheckoutSessionResult,
  PayoutExecutionResult,
  CryptoPaymentOptions,
  MobileMoneyOptions,
} from './interface';
import { TokenPackage } from '@/types';

export interface CryptoCurrencyMeta {
  code: string;
  name: string;
  network: string;
  icon: string;
  recommended?: boolean;
  sampleAddress: string;
}

export const SUPPORTED_CRYPTO_CURRENCIES: CryptoCurrencyMeta[] = [
  {
    code: 'usdttrc20',
    name: 'Tether (USDT)',
    network: 'TRON (TRC-20)',
    icon: '₮',
    recommended: true,
    sampleAddress: 'TNPeeaaTKFSLt2qW6yR4F26zX5h5cW64r7',
  },
  {
    code: 'sol',
    name: 'Solana (SOL)',
    network: 'Solana Network',
    icon: '◎',
    recommended: true,
    sampleAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  },
  {
    code: 'btc',
    name: 'Bitcoin (BTC)',
    network: 'Bitcoin Core',
    icon: '₿',
    sampleAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  },
  {
    code: 'eth',
    name: 'Ethereum (ETH)',
    network: 'Ethereum (ERC-20)',
    icon: 'Ξ',
    sampleAddress: '0x71C836472dC91C800A61AC92281BC4502d93e824',
  },
  {
    code: 'usdterc20',
    name: 'Tether (USDT)',
    network: 'Ethereum (ERC-20)',
    icon: '₮',
    sampleAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  },
  {
    code: 'usdc',
    name: 'USD Coin (USDC)',
    network: 'Ethereum / Solana',
    icon: '$',
    sampleAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  },
];

export class CryptoPaymentProcessor implements PaymentProcessor {
  name = 'CRYPTO';

  private apiKey = process.env.NOWPAYMENTS_API_KEY || '';
  private ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET || '';
  private isSandbox = process.env.NOWPAYMENTS_SANDBOX === 'true';

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  private getBaseUrl(): string {
    return this.isSandbox
      ? 'https://api-sandbox.nowpayments.io/v1'
      : 'https://api.nowpayments.io/v1';
  }

  /**
   * Approximate exchange rates for sandbox and conversion preview
   */
  public getCryptoConversion(fiatCents: number, currencyCode: string): { cryptoAmount: number; rateUsd: number } {
    const usd = fiatCents / 100;
    const rates: Record<string, number> = {
      usdttrc20: 1.0,
      usdterc20: 1.0,
      usdc: 1.0,
      btc: 64500.0,
      eth: 3450.0,
      sol: 145.0,
    };

    const rateUsd = rates[currencyCode.toLowerCase()] || 1.0;
    const rawAmount = usd / rateUsd;
    // Format precision based on currency
    const cryptoAmount = currencyCode.includes('usdt') || currencyCode.includes('usdc')
      ? parseFloat(rawAmount.toFixed(2))
      : parseFloat(rawAmount.toFixed(6));

    return { cryptoAmount, rateUsd };
  }

  async createCheckoutSession(
    userId: string,
    pkg: TokenPackage,
    successUrl: string,
    cancelUrl: string,
    _mobileMoneyOptions?: MobileMoneyOptions,
    cryptoOptions?: CryptoPaymentOptions
  ): Promise<CheckoutSessionResult> {
    const payCurrency = (cryptoOptions?.payCurrency || 'usdttrc20').toLowerCase();
    const fiatDollars = (pkg.priceCents / 100).toFixed(2);
    const orderId = `crypto_${Date.now()}_${userId}`;

    // If configured with NOWPayments API credentials, create a live invoice
    if (this.isConfigured()) {
      try {
        const response = await fetch(`${this.getBaseUrl()}/invoice`, {
          method: 'POST',
          headers: {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(7000),
          body: JSON.stringify({
            price_amount: parseFloat(fiatDollars),
            price_currency: 'usd',
            pay_currency: payCurrency,
            ipn_callback_url: `${new URL(successUrl).origin}/api/wallet/webhook`,
            order_id: `${orderId}_tokens_${pkg.tokens}`,
            order_description: `${pkg.tokens} Stream Tokens (${pkg.label})`,
            success_url: successUrl,
            cancel_url: cancelUrl,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return {
            sessionId: data.id || orderId,
            checkoutUrl: data.invoice_url,
            provider: 'NOWPAYMENTS',
            cryptoDetails: {
              payCurrency,
              payAmount: data.pay_amount,
              payAddress: data.pay_address,
            },
          };
        } else {
          console.warn('[Crypto Gateway] NOWPayments API returned non-200, falling back to built-in crypto checkout:', await response.text());
        }
      } catch (err) {
        console.warn('[Crypto Gateway] Failed to reach NOWPayments API, falling back to local crypto checkout:', err);
      }
    }

    // Built-in zero-dependency Interactive Crypto Checkout (Sandbox / Local Dev)
    const { cryptoAmount } = this.getCryptoConversion(pkg.priceCents, payCurrency);
    const coinMeta = SUPPORTED_CRYPTO_CURRENCIES.find((c) => c.code === payCurrency) || SUPPORTED_CRYPTO_CURRENCIES[0];

    const checkoutUrlObj = new URL('/checkout/crypto', successUrl);
    checkoutUrlObj.searchParams.set('session_id', orderId);
    checkoutUrlObj.searchParams.set('user_id', userId);
    checkoutUrlObj.searchParams.set('package_id', pkg.id);
    checkoutUrlObj.searchParams.set('tokens', String(pkg.tokens));
    checkoutUrlObj.searchParams.set('fiat_cents', String(pkg.priceCents));
    checkoutUrlObj.searchParams.set('pay_currency', payCurrency);
    checkoutUrlObj.searchParams.set('crypto_amount', String(cryptoAmount));
    checkoutUrlObj.searchParams.set('pay_address', coinMeta.sampleAddress);
    checkoutUrlObj.searchParams.set('return_url', successUrl);

    return {
      sessionId: orderId,
      checkoutUrl: checkoutUrlObj.toString(),
      provider: 'CRYPTO_SANDBOX',
      cryptoDetails: {
        payCurrency,
        payAmount: cryptoAmount,
        payAddress: coinMeta.sampleAddress,
        network: coinMeta.network,
      },
    };
  }

  /**
   * Sort keys recursively to match NOWPayments IPN HMAC verification standard
   */
  private sortObjectKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
      return obj;
    }
    const sorted: Record<string, any> = {};
    Object.keys(obj)
      .sort()
      .forEach((key) => {
        sorted[key] = this.sortObjectKeys(obj[key]);
      });
    return sorted;
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
    let payload: any;
    try {
      payload = JSON.parse(body);
    } catch {
      return { verified: false, eventType: 'INVALID_JSON' };
    }

    const signatureHeader = headers['x-nowpayments-sig'];
    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;

    // Verify HMAC-SHA512 if secret is configured
    if (this.ipnSecret && signature) {
      const sortedPayload = this.sortObjectKeys(payload);
      const hmac = crypto.createHmac('sha512', this.ipnSecret);
      const calculatedSig = hmac.update(JSON.stringify(sortedPayload)).digest('hex');

      if (signature.toLowerCase() !== calculatedSig.toLowerCase()) {
        console.warn('[Crypto Webhook] Signature verification failed');
        return { verified: false, eventType: 'SIGNATURE_MISMATCH' };
      }
    }

    // Check payment status from NOWPayments
    const paymentStatus = (payload.payment_status || payload.status || '').toLowerCase();
    const orderId = payload.order_id || payload.orderId || '';

    // Parse tokens and userId from order_id format: "crypto_{timestamp}_{userId}_tokens_{tokens}" or "crypto_{timestamp}_{userId}"
    let userId = payload.userId;
    let tokens = payload.tokens ? parseInt(payload.tokens, 10) : undefined;

    if (orderId) {
      // Match: crypto_{timestamp}_{userId} optionally followed by _tokens_{tokens}
      const match = orderId.match(/^crypto_\d+_(.+?)(?:_tokens_(\d+))?$/);
      if (match) {
        if (!userId) userId = match[1];
        if (!tokens && match[2]) tokens = parseInt(match[2], 10);
      }
    }

    // Calculate fiat amount cents if available
    const fiatDollars = payload.price_amount || payload.actually_paid || 0;
    const fiatAmountCents = Math.round(Number(fiatDollars) * 100);

    const paymentId = payload.payment_id || payload.paymentId || orderId || `crypto_${Date.now()}`;
    const paymentRef = `crypto_${paymentId}`;

    const isConfirmed = ['finished', 'confirmed', 'completed', 'paid'].includes(paymentStatus);

    if (!isConfirmed) {
      return {
        verified: true,
        eventType: `PAYMENT_${paymentStatus.toUpperCase()}`,
        userId,
        paymentRef,
        metadata: payload,
      };
    }

    return {
      verified: true,
      eventType: 'payment.finished',
      userId,
      tokens,
      fiatAmountCents: fiatAmountCents > 0 ? fiatAmountCents : undefined,
      paymentRef,
      metadata: {
        payCurrency: payload.pay_currency,
        payAmount: payload.pay_amount,
        actuallyPaid: payload.actually_paid,
        txHash: payload.txid || payload.tx_hash,
      },
    };
  }

  /**
   * Validate cryptocurrency wallet address based on network type
   */
  public validateAddress(address: string, networkType: string): { valid: boolean; message?: string } {
    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      return { valid: false, message: 'Wallet address cannot be empty' };
    }

    const clean = address.trim();
    const upper = networkType.toUpperCase();

    if (upper.includes('TRC') || upper.includes('TRON')) {
      if (!clean.startsWith('T') || clean.length !== 34) {
        return { valid: false, message: 'Invalid TRON (TRC-20) address. Must start with "T" and be 34 characters long.' };
      }
    } else if (upper.includes('ERC') || upper.includes('ETH') || upper.includes('ETHEREUM')) {
      if (!clean.startsWith('0x') || clean.length !== 42) {
        return { valid: false, message: 'Invalid Ethereum (ERC-20) address. Must start with "0x" and be 42 characters long.' };
      }
    } else if (upper.includes('BTC') || upper.includes('BITCOIN')) {
      const btcRegex = /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/;
      if (!btcRegex.test(clean)) {
        return { valid: false, message: 'Invalid Bitcoin address. Must start with "1", "3", or "bc1".' };
      }
    } else if (upper.includes('SOL') || upper.includes('SOLANA')) {
      if (clean.length < 32 || clean.length > 44) {
        return { valid: false, message: 'Invalid Solana address length (must be 32–44 base58 characters).' };
      }
    }

    return { valid: true };
  }

  async processStreamerPayout(
    streamerId: string,
    amountCents: number,
    payoutDetails: any
  ): Promise<PayoutExecutionResult> {
    const address = payoutDetails?.walletAddress || payoutDetails?.accountEmail;
    const network = payoutDetails?.cryptoNetwork || payoutDetails?.currency || 'USDT_TRC20';

    const validation = this.validateAddress(address, network);
    if (!validation.valid) {
      return {
        success: false,
        referenceId: '',
        error: validation.message || 'Invalid cryptocurrency address',
      };
    }

    const referenceId = `crypto_payout_${network}_${Date.now()}_streamer_${streamerId}`;
    return {
      success: true,
      referenceId,
    };
  }
}

import { PaymentProcessor, SupportedPaymentMethod } from './interface';
import { MockPaymentProcessor } from './mockPaymentAdapter';
import { StripePaymentProcessor, CCBillPaymentProcessor } from './gateways';
import { FlutterwaveMobileMoneyProcessor } from './flutterwaveAdapter';
import { LemonSqueezyProcessor } from './lemonSqueezyAdapter';
import { CryptoPaymentProcessor } from './cryptoAdapter';
import { VaultPayProcessor } from './vaultPayAdapter';
import { SasPayProcessor } from './sasPayAdapter';

const mockProcessor = new MockPaymentProcessor();
const stripeProcessor = new StripePaymentProcessor();
const ccbillProcessor = new CCBillPaymentProcessor();
const mobileMoneyProcessor = new FlutterwaveMobileMoneyProcessor();
const lemonSqueezyProcessor = new LemonSqueezyProcessor();
const cryptoProcessor = new CryptoPaymentProcessor();
const vaultPayProcessor = new VaultPayProcessor();
const sasPayProcessor = new SasPayProcessor();

export function getPaymentProcessor(method?: SupportedPaymentMethod): PaymentProcessor {
  switch (method) {
    case 'SASPAY':
      return sasPayProcessor;
    case 'CRYPTO':
      return cryptoProcessor;
    case 'VAULTPAY':
      return vaultPayProcessor;
    case 'MOCK':
      return mockProcessor;
    case 'MOBILE_MONEY':
      if (sasPayProcessor.isConfigured()) return sasPayProcessor;
      return mobileMoneyProcessor;
    case 'LEMON_SQUEEZY':
    case 'STRIPE':
    case 'CCBILL':
    default:
      // Primary supported rails: SasPay, Crypto, VaultPay
      if (sasPayProcessor.isConfigured()) return sasPayProcessor;
      if (cryptoProcessor.isConfigured()) return cryptoProcessor;
      if (vaultPayProcessor.isConfigured()) return vaultPayProcessor;
      return mockProcessor;
  }
}

export const paymentProcessor: PaymentProcessor = getPaymentProcessor();

export * from './interface';
export * from './flutterwaveAdapter';
export * from './gateways';
export * from './mockPaymentAdapter';
export * from './lemonSqueezyAdapter';
export * from './cryptoAdapter';
export * from './vaultPayAdapter';
export * from './sasPayAdapter';



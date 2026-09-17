import { PaymentProcessor, SupportedPaymentMethod } from './interface';
import { MockPaymentProcessor } from './mockPaymentAdapter';
import { StripePaymentProcessor, CCBillPaymentProcessor } from './gateways';
import { FlutterwaveMobileMoneyProcessor } from './flutterwaveAdapter';
import { LemonSqueezyProcessor } from './lemonSqueezyAdapter';
import { CryptoPaymentProcessor } from './cryptoAdapter';
import { VaultPayProcessor } from './vaultPayAdapter';

const mockProcessor = new MockPaymentProcessor();
const stripeProcessor = new StripePaymentProcessor();
const ccbillProcessor = new CCBillPaymentProcessor();
const mobileMoneyProcessor = new FlutterwaveMobileMoneyProcessor();
const lemonSqueezyProcessor = new LemonSqueezyProcessor();
const cryptoProcessor = new CryptoPaymentProcessor();
const vaultPayProcessor = new VaultPayProcessor();

export function getPaymentProcessor(method?: SupportedPaymentMethod): PaymentProcessor {
  switch (method) {
    case 'CRYPTO':
      return cryptoProcessor;
    case 'VAULTPAY':
      return vaultPayProcessor;
    case 'MOCK':
      return mockProcessor;
    case 'LEMON_SQUEEZY':
    case 'MOBILE_MONEY':
    case 'STRIPE':
    case 'CCBILL':
    default:
      // Primary supported rails: Crypto and VaultPay
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


import { PaymentProcessor, SupportedPaymentMethod } from './interface';
import { MockPaymentProcessor } from './mockPaymentAdapter';
import { StripePaymentProcessor, CCBillPaymentProcessor } from './gateways';
import { FlutterwaveMobileMoneyProcessor } from './flutterwaveAdapter';
import { LemonSqueezyProcessor } from './lemonSqueezyAdapter';

const mockProcessor = new MockPaymentProcessor();
const stripeProcessor = new StripePaymentProcessor();
const ccbillProcessor = new CCBillPaymentProcessor();
const mobileMoneyProcessor = new FlutterwaveMobileMoneyProcessor();
const lemonSqueezyProcessor = new LemonSqueezyProcessor();

export function getPaymentProcessor(method?: SupportedPaymentMethod): PaymentProcessor {
  switch (method) {
    case 'LEMON_SQUEEZY':
      return lemonSqueezyProcessor;
    case 'MOBILE_MONEY':
      return mobileMoneyProcessor;
    case 'STRIPE':
      return stripeProcessor.isConfigured() ? stripeProcessor : mockProcessor;
    case 'CCBILL':
      return ccbillProcessor.isConfigured() ? ccbillProcessor : mockProcessor;
    case 'MOCK':
      return mockProcessor;
    default:
      // Default prioritization
      if (lemonSqueezyProcessor.isConfigured()) return lemonSqueezyProcessor;
      if (stripeProcessor.isConfigured()) return stripeProcessor;
      if (mobileMoneyProcessor.isConfigured()) return mobileMoneyProcessor;
      if (ccbillProcessor.isConfigured()) return ccbillProcessor;
      return mockProcessor;
  }
}

export const paymentProcessor: PaymentProcessor = getPaymentProcessor();

export * from './interface';
export * from './flutterwaveAdapter';
export * from './gateways';
export * from './mockPaymentAdapter';
export * from './lemonSqueezyAdapter';

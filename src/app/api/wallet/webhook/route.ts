import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WalletService } from '@/lib/ledger/walletService';
import { getPaymentProcessor, SupportedPaymentMethod } from '@/lib/payment';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const headersObj: Record<string, string | string[] | undefined> = {};
    req.headers.forEach((val, key) => {
      headersObj[key.toLowerCase()] = val;
    });

    // Detect payment provider from webhook headers or payload attributes
    let providerMethod: SupportedPaymentMethod = 'CRYPTO';
    if (headersObj['x-saspay-signature'] || rawBody.includes('saspay_') || rawBody.includes('checkout.session') || (rawBody.includes('payment.successful') && rawBody.includes('saspay'))) {
      providerMethod = 'SASPAY';
    } else if (headersObj['x-vaultpay-signature'] || rawBody.includes('vaultpay_') || rawBody.includes('vcard_')) {
      providerMethod = 'VAULTPAY';
    } else if (headersObj['x-nowpayments-sig'] || (rawBody.includes('payment_status') && rawBody.includes('pay_amount')) || rawBody.includes('crypto_')) {
      providerMethod = 'CRYPTO';
    } else if (headersObj['x-signature']) {
      providerMethod = 'LEMON_SQUEEZY';
    } else if (headersObj['verif-hash']) {
      providerMethod = 'MOBILE_MONEY';
    } else if (headersObj['user-agent']?.toString().includes('CCBill') || rawBody.includes('clientAccnum')) {
      providerMethod = 'CCBILL';
    } else if (headersObj['stripe-signature']) {
      providerMethod = 'STRIPE';
    } else {
      providerMethod = 'MOCK';
    }

    const processor = getPaymentProcessor(providerMethod);
    const result = await processor.verifyWebhookEvent(rawBody, headersObj);

    if (!result.verified) {
      console.warn('[Webhook] Verification rejected from provider:', providerMethod);
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    const { userId, tokens, fiatAmountCents, paymentRef } = result;

    if (!userId || !tokens || !paymentRef) {
      // Notification received but not a token charge event
      return NextResponse.json({ received: true, status: 'IGNORED_OR_NON_CHARGE_EVENT' });
    }

    // IDEMPOTENCY CHECK: Ensure this paymentRef hasn't already been credited
    const existingTx = await prisma.transaction.findFirst({
      where: {
        recipientId: userId,
        type: 'PURCHASE',
        metadata: { contains: paymentRef },
      },
    });

    if (existingTx) {
      console.log(`[Webhook] Duplicate event for paymentRef ${paymentRef} already processed. Skipping.`);
      return NextResponse.json({ received: true, status: 'ALREADY_PROCESSED', transactionId: existingTx.id });
    }

    // Credit tokens to user wallet ledger
    const ledgerRecord = await WalletService.creditPurchasedTokens(
      userId,
      tokens,
      fiatAmountCents || tokens * 10,
      paymentRef
    );

    console.log(`[Webhook] Successfully credited ${tokens} tokens to user ${userId} via ${providerMethod} (Ref: ${paymentRef})`);

    return NextResponse.json({
      received: true,
      status: 'CREDITED',
      userId,
      tokens,
      transactionId: ledgerRecord.transaction.id,
    });
  } catch (err: any) {
    console.error('[Webhook Error]', err);
    return NextResponse.json({ error: err.message || 'Webhook processing error' }, { status: 500 });
  }
}

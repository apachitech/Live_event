import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logChangeData } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'STREAMER') {
      return NextResponse.json({ error: 'Only verified streamers can request payouts' }, { status: 403 });
    }

    const { tokensToCashout, payoutMethod, payoutDetails } = await req.json();

    const tokens = parseInt(tokensToCashout, 10);
    const MIN_TOKENS = 1000; // $50 minimum (at $0.05 / token cashout)

    if (tokens < MIN_TOKENS) {
      return NextResponse.json({
        error: `Minimum payout threshold is ${MIN_TOKENS} tokens ($50.00 USD).`,
      }, { status: 400 });
    }

    const streamer = await prisma.streamerProfile.findUnique({
      where: { userId: session.userId },
      include: { user: { include: { wallet: true } } },
    });

    if (!streamer || !streamer.user.wallet) {
      return NextResponse.json({ error: 'Streamer account not found' }, { status: 404 });
    }

    if (streamer.user.wallet.earnedBalance < tokens) {
      return NextResponse.json({ error: 'Insufficient earned tokens for this payout amount' }, { status: 400 });
    }

    // Validate crypto wallet address if crypto payout is selected
    if (payoutMethod?.startsWith('CRYPTO')) {
      const address = payoutDetails?.walletAddress || payoutDetails?.accountEmail;
      const network = payoutMethod.replace('CRYPTO_', '');
      const { getPaymentProcessor } = await import('@/lib/payment');
      const processor = getPaymentProcessor('CRYPTO') as any;
      if (processor && typeof processor.validateAddress === 'function') {
        const validation = processor.validateAddress(address, network);
        if (!validation.valid) {
          return NextResponse.json({ error: validation.message || 'Invalid cryptocurrency address' }, { status: 400 });
        }
      }
    }

    // Validate VaultPay virtual card if selected
    if (payoutMethod === 'VAULTPAY_CARD') {
      const cardNumber = payoutDetails?.walletAddress || payoutDetails?.accountEmail || payoutDetails?.cardNumber || '';
      const clean = cardNumber.replace(/\D/g, '');
      const { getPaymentProcessor } = await import('@/lib/payment');
      const processor = getPaymentProcessor('VAULTPAY') as any;
      if (processor && typeof processor.validateLuhn === 'function') {
        if (clean.length >= 13 && clean.length <= 19) {
          if (!processor.validateLuhn(clean)) {
            return NextResponse.json({ error: 'Invalid VaultPay card number (Luhn checksum failed)' }, { status: 400 });
          }
        } else if (clean.length < 9) {
          return NextResponse.json({ error: 'Please provide a valid 16-digit VaultPay virtual card or registered phone number' }, { status: 400 });
        }
      }
    }

    // Cashout rate: 1 earned token = $0.05 USD = 5 cents
    const payoutAmountCents = tokens * 5;

    const payout = await prisma.$transaction(async (tx) => {
      // Deduct from earnedBalance
      await tx.wallet.update({
        where: { userId: session.userId },
        data: {
          earnedBalance: { decrement: tokens },
        },
      });

      // Update payout preferences if provided
      if (payoutMethod) {
        await tx.streamerProfile.update({
          where: { id: streamer.id },
          data: {
            payoutMethod,
            payoutDetails: payoutDetails ? JSON.stringify(payoutDetails) : undefined,
          },
        });
      }

      // Create Payout record in REQUESTED status
      const p = await tx.payout.create({
        data: {
          streamerId: streamer.id,
          tokensDeducted: tokens,
          payoutAmountCents,
          status: 'REQUESTED',
        },
      });

      // Log transaction
      await tx.transaction.create({
        data: {
          senderId: session.userId,
          type: 'STREAMER_PAYOUT',
          amount: tokens,
          fiatAmountCents: payoutAmountCents,
          netTokens: 0,
          platformFeeTokens: 0,
          memo: `Payout Request #${p.id} ($${(payoutAmountCents / 100).toFixed(2)})`,
        },
      });

      return p;
    });

    // Hard-copy change data for payout request
    await logChangeData({
      actorUserId: session.userId,
      action: 'PAYOUT_REQUESTED',
      entityType: 'PAYOUT',
      entityId: payout.id,
      payload: {
        tokensDeducted: tokens,
        payoutAmountCents,
        payoutMethod: payoutMethod || streamer.payoutMethod,
        status: payout.status,
      },
    });

    return NextResponse.json({ success: true, payout });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

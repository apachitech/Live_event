import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

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

    return NextResponse.json({ success: true, payout });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

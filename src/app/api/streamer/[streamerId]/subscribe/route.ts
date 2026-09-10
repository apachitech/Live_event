import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getPlatformRevenueSplit } from '@/lib/ledger/walletService';

export async function POST(req: Request, { params }: { params: { streamerId: string } }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Please log in to subscribe' }, { status: 401 });
    }

    const { streamerId } = params;
    const { tier = 1 } = await req.json();

    const streamer = await prisma.streamerProfile.findUnique({
      where: { id: streamerId },
      include: { user: true },
    });

    if (!streamer) {
      return NextResponse.json({ error: 'Streamer not found' }, { status: 404 });
    }

    if (streamer.userId === session.userId) {
      return NextResponse.json({ error: 'Cannot subscribe to your own channel' }, { status: 400 });
    }

    const monthlyCost = tier === 2 ? 150 : tier === 3 ? 300 : 50; // Tokens

    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.userId },
    });

    if (!wallet || wallet.balance < monthlyCost) {
      return NextResponse.json({ error: 'Insufficient tokens for monthly subscription' }, { status: 400 });
    }

    const { streamerPercent } = await getPlatformRevenueSplit();
    const netTokens = Math.floor((monthlyCost * streamerPercent) / 100);
    const platformFee = monthlyCost - netTokens;

    const renewsAt = new Date();
    renewsAt.setDate(renewsAt.getDate() + 30);

    const subscription = await prisma.$transaction(async (tx) => {
      // Debit viewer
      await tx.wallet.update({
        where: { userId: session.userId },
        data: { balance: { decrement: monthlyCost } },
      });

      // Credit streamer
      await tx.wallet.upsert({
        where: { userId: streamer.userId },
        create: { userId: streamer.userId, balance: netTokens, earnedBalance: netTokens },
        update: {
          balance: { increment: netTokens },
          earnedBalance: { increment: netTokens },
        },
      });

      // Create subscription
      const sub = await tx.subscription.create({
        data: {
          subscriberId: session.userId,
          streamerId: streamer.id,
          tier,
          monthlyTokenCost: monthlyCost,
          renewsAt,
        },
      });

      // Log transaction
      await tx.transaction.create({
        data: {
          senderId: session.userId,
          recipientId: streamer.userId,
          type: 'SUBSCRIPTION',
          amount: monthlyCost,
          netTokens,
          platformFeeTokens: platformFee,
          memo: `Tier ${tier} Subscription to ${streamer.displayName}`,
        },
      });

      return sub;
    });

    return NextResponse.json({ success: true, subscription });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

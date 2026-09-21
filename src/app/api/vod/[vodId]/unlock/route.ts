import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: { vodId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Please log in to unlock this video' }, { status: 401 });
    }

    const vod = await prisma.vod.findUnique({
      where: { id: params.vodId },
      include: { streamer: true },
    });

    if (!vod) {
      return NextResponse.json({ error: 'VOD not found' }, { status: 404 });
    }

    if (vod.priceTokens <= 0) {
      return NextResponse.json({ success: true, isUnlocked: true, message: 'This video is free' });
    }

    // Creator doesn't pay for their own video
    if (vod.streamer.userId === session.userId) {
      return NextResponse.json({ success: true, isUnlocked: true, message: 'You are the creator of this video' });
    }

    // Check if user has already unlocked this VOD (Idempotency guard)
    const existingUnlock = await prisma.transaction.findFirst({
      where: {
        senderId: session.userId,
        metadata: {
          contains: `"vodId":"${vod.id}"`,
        },
      },
    });

    if (existingUnlock) {
      return NextResponse.json({
        success: true,
        isUnlocked: true,
        message: 'You have already unlocked this video',
        alreadyUnlocked: true,
      });
    }

    // Check user wallet
    const userWallet = await prisma.wallet.findUnique({
      where: { userId: session.userId },
    });

    if (!userWallet || userWallet.balance < vod.priceTokens) {
      return NextResponse.json(
        {
          error: `Insufficient token balance. You need ${vod.priceTokens} Tokens to unlock this video, but you have ${userWallet?.balance || 0} Tokens.`,
          required: vod.priceTokens,
          current: userWallet?.balance || 0,
        },
        { status: 400 }
      );
    }

    // Revenue split
    const platformSetting = await prisma.platformSetting.findUnique({
      where: { key: 'streamer_split_percentage' },
    });
    const streamerPercent = platformSetting ? parseInt(platformSetting.value, 10) : 70;
    const streamerTokens = Math.floor((vod.priceTokens * streamerPercent) / 100);
    const platformFeeTokens = vod.priceTokens - streamerTokens;

    let newBalance = 0;

    // Atomic transaction: deduct viewer tokens, credit streamer, log transaction
    await prisma.$transaction(async (tx) => {
      // 1. Re-verify wallet inside transaction to prevent race conditions
      const freshWallet = await tx.wallet.findUnique({
        where: { userId: session.userId },
      });

      if (!freshWallet || freshWallet.balance < vod.priceTokens) {
        throw new Error('Insufficient token balance');
      }

      // 2. Debit viewer tokens wallet
      const updatedViewerWallet = await tx.wallet.update({
        where: { userId: session.userId },
        data: { balance: { decrement: vod.priceTokens } },
      });
      newBalance = updatedViewerWallet.balance;

      // 3. Credit streamer earned balance (upsert to ensure wallet exists)
      await tx.wallet.upsert({
        where: { userId: vod.streamer.userId },
        update: { earnedBalance: { increment: streamerTokens } },
        create: {
          userId: vod.streamer.userId,
          balance: 0,
          earnedBalance: streamerTokens,
        },
      });

      // 4. Record audit transaction in database ledger
      await tx.transaction.create({
        data: {
          senderId: session.userId,
          recipientId: vod.streamer.userId,
          amount: vod.priceTokens,
          netTokens: streamerTokens,
          platformFeeTokens: platformFeeTokens,
          type: 'VOD_UNLOCK',
          memo: `Pay-Per-View Unlock: ${vod.title}`,
          metadata: JSON.stringify({
            action: 'VOD_UNLOCK',
            vodId: vod.id,
            title: vod.title,
            tokensDeducted: vod.priceTokens,
            streamerTokens,
            platformFeeTokens,
          }),
        },
      });
    });

    return NextResponse.json({
      success: true,
      isUnlocked: true,
      tokensDeducted: vod.priceTokens,
      newBalance,
      message: `Successfully unlocked "${vod.title}" for ${vod.priceTokens} Tokens.`,
    });
  } catch (err: any) {
    console.error('[VOD Unlock Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to unlock video' }, { status: 500 });
  }
}

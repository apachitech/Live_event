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

    // Check user wallet
    const userWallet = await prisma.wallet.findUnique({
      where: { userId: session.userId },
    });

    if (!userWallet || userWallet.balance < vod.priceTokens) {
      return NextResponse.json(
        { error: 'Insufficient token balance', required: vod.priceTokens, current: userWallet?.balance || 0 },
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

    // Atomic transaction
    await prisma.$transaction(async (tx) => {
      // 1. Debit viewer
      await tx.wallet.update({
        where: { userId: session.userId },
        data: { balance: { decrement: vod.priceTokens } },
      });

      // 2. Credit streamer earned balance
      await tx.wallet.update({
        where: { userId: vod.streamer.userId },
        data: { earnedBalance: { increment: streamerTokens } },
      });

      // 3. Record transaction
      await tx.transaction.create({
        data: {
          senderId: session.userId,
          recipientId: vod.streamer.userId,
          amount: vod.priceTokens,
          netTokens: streamerTokens,
          platformFeeTokens: platformFeeTokens,
          type: 'TIP', // Re-use TIP or PPV transaction
          memo: `Unlocked VOD: ${vod.title}`,
          metadata: JSON.stringify({
            action: 'VOD_UNLOCK',
            vodId: vod.id,
            title: vod.title,
          }),
        },
      });
    });

    return NextResponse.json({
      success: true,
      isUnlocked: true,
      tokensDeducted: vod.priceTokens,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

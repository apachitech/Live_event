import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: Current user's campaigns and active publishing price
export async function GET() {
  try {
    // 1. Fetch current campaign publishing token price from PlatformSetting (default 50)
    const priceSetting = await prisma.platformSetting.findUnique({
      where: { key: 'AD_CAMPAIGN_TOKEN_PRICE' },
    });
    const publishPriceTokens = priceSetting ? parseInt(priceSetting.value, 10) : 50;

    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required. Only logged-in users can run ad campaigns.', authenticated: false },
        { status: 401 }
      );
    }

    // 2. Fetch user's wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.userId },
      select: { balance: true },
    });

    // 3. Fetch ads created by this user
    const userAds = await prisma.advertisement.findMany({
      where: { creatorUserId: session.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      publishPriceTokens,
      userBalance: wallet?.balance || 0,
      ads: userAds,
      authenticated: true,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Create and publish an Ad Campaign by spending user tokens
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required. Only logged-in users can run ad campaigns.' },
        { status: 401 }
      );
    }

    // Viewers, Streamers, Agencies, and Admins can all create campaigns!
    const allowedRoles = ['VIEWER', 'STREAMER', 'AGENCY', 'ADMIN'];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized role for creating campaigns' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      mediaType = 'IMAGE',
      imageUrl,
      videoUrl,
      targetUrl,
      ctaText = 'Learn More',
      badge = 'SPONSORED',
      placement = 'FEED',
      durationSeconds = 15,
      skipOffsetSeconds = 5,
    } = body;

    if (!title || !targetUrl) {
      return NextResponse.json(
        { error: 'Campaign Title and Target Landing URL are required' },
        { status: 400 }
      );
    }

    if (mediaType === 'VIDEO' && !videoUrl && !imageUrl) {
      return NextResponse.json(
        { error: 'Video URL or thumbnail poster is required for video campaigns' },
        { status: 400 }
      );
    }

    if (mediaType === 'IMAGE' && !imageUrl) {
      return NextResponse.json(
        { error: 'Creative image URL is required' },
        { status: 400 }
      );
    }

    // 1. Fetch current price in tokens
    const priceSetting = await prisma.platformSetting.findUnique({
      where: { key: 'AD_CAMPAIGN_TOKEN_PRICE' },
    });
    const priceTokens = priceSetting ? parseInt(priceSetting.value, 10) : 50;

    const isAdmin = session.role === 'ADMIN';
    const tokensToCharge = isAdmin ? 0 : priceTokens;

    // 2. If non-admin, verify wallet balance before initiating transaction
    if (tokensToCharge > 0) {
      const wallet = await prisma.wallet.findUnique({
        where: { userId: session.userId },
      });

      if (!wallet || wallet.balance < tokensToCharge) {
        return NextResponse.json(
          {
            error: `Insufficient tokens. Publishing this campaign requires ${tokensToCharge} Tokens, but your balance is ${wallet?.balance || 0} Tokens.`,
            requiredTokens: tokensToCharge,
            currentBalance: wallet?.balance || 0,
          },
          { status: 400 }
        );
      }
    }

    let createdAd: any = null;
    let newBalance = 0;

    // 3. Atomic transaction: deduct tokens, create audit transaction, create advertisement
    await prisma.$transaction(async (tx) => {
      if (tokensToCharge > 0) {
        const freshWallet = await tx.wallet.findUnique({
          where: { userId: session.userId },
        });

        if (!freshWallet || freshWallet.balance < tokensToCharge) {
          throw new Error(`Insufficient tokens. Required: ${tokensToCharge}, Available: ${freshWallet?.balance || 0}`);
        }

        const updatedWallet = await tx.wallet.update({
          where: { userId: session.userId },
          data: { balance: { decrement: tokensToCharge } },
        });
        newBalance = updatedWallet.balance;

        // Record transaction in ledger
        await tx.transaction.create({
          data: {
            senderId: session.userId,
            recipientId: null,
            amount: tokensToCharge,
            netTokens: 0,
            platformFeeTokens: tokensToCharge,
            type: 'AD_CAMPAIGN_PUBLISH',
            memo: `Ad Campaign Publish: ${title.trim()} (${placement})`,
            metadata: JSON.stringify({
              action: 'AD_CAMPAIGN_PUBLISH',
              title: title.trim(),
              placement,
              mediaType,
              tokensSpent: tokensToCharge,
              role: session.role,
            }),
          },
        });
      } else {
        const w = await tx.wallet.findUnique({ where: { userId: session.userId } });
        newBalance = w?.balance || 0;
      }

      // Create Advertisement
      createdAd = await tx.advertisement.create({
        data: {
          title: title.trim(),
          description: description ? description.trim() : null,
          mediaType: mediaType === 'VIDEO' ? 'VIDEO' : 'IMAGE',
          imageUrl: (imageUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800').trim(),
          videoUrl: videoUrl ? videoUrl.trim() : null,
          targetUrl: targetUrl.trim(),
          ctaText: (ctaText || 'Learn More').trim(),
          badge: (badge || 'SPONSORED').trim(),
          placement: placement.toUpperCase(),
          durationSeconds: durationSeconds ? parseInt(String(durationSeconds), 10) : 15,
          skipOffsetSeconds: skipOffsetSeconds ? parseInt(String(skipOffsetSeconds), 10) : 5,
          creatorUserId: session.userId,
          tokensSpent: tokensToCharge,
          active: true,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: session.userId,
          action: 'AD_CAMPAIGN_PUBLISHED',
          entityType: 'ADVERTISEMENT',
          entityId: createdAd.id,
          payload: JSON.stringify({
            title: createdAd.title,
            placement: createdAd.placement,
            tokensSpent: tokensToCharge,
            creatorRole: session.role,
          }),
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: tokensToCharge > 0
        ? `Ad campaign published! ${tokensToCharge} Tokens deducted from your wallet.`
        : 'Ad campaign published successfully.',
      ad: createdAd,
      tokensSpent: tokensToCharge,
      remainingBalance: newBalance,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

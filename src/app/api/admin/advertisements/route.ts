import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET all ads for admin
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const ads = await prisma.advertisement.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        creatorUser: {
          select: {
            id: true,
            username: true,
            role: true,
            avatarUrl: true,
          },
        },
      },
    });

    const priceSetting = await prisma.platformSetting.findUnique({
      where: { key: 'AD_CAMPAIGN_TOKEN_PRICE' },
    });
    const publishPriceTokens = priceSetting ? parseInt(priceSetting.value, 10) : 50;

    const statsAgg = await prisma.advertisement.aggregate({
      _sum: { clicks: true, impressions: true },
      _count: { id: true },
    });

    return NextResponse.json({
      success: true,
      ads,
      publishPriceTokens,
      stats: {
        totalAds: statsAgg._count.id || 0,
        totalClicks: statsAgg._sum.clicks || 0,
        totalImpressions: statsAgg._sum.impressions || 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH update ad campaign publish price in tokens
export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { tokenPrice } = body;

    if (tokenPrice === undefined || isNaN(parseInt(String(tokenPrice), 10))) {
      return NextResponse.json({ error: 'Valid token price is required' }, { status: 400 });
    }

    const price = Math.max(0, parseInt(String(tokenPrice), 10));

    await prisma.platformSetting.upsert({
      where: { key: 'AD_CAMPAIGN_TOKEN_PRICE' },
      update: { value: String(price) },
      create: {
        key: 'AD_CAMPAIGN_TOKEN_PRICE',
        value: String(price),
        description: 'Token price for publishing an advertisement campaign',
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.userId,
        action: 'AD_CAMPAIGN_TOKEN_PRICE_UPDATED',
        entityType: 'PLATFORM_SETTING',
        entityId: 'AD_CAMPAIGN_TOKEN_PRICE',
        payload: JSON.stringify({ tokenPrice: price }),
      },
    });

    return NextResponse.json({ success: true, tokenPrice: price });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST create advertisement
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
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
      active = true,
    } = body;

    if (!title || !targetUrl) {
      return NextResponse.json(
        { error: 'Title and Target URL are required' },
        { status: 400 }
      );
    }

    if (mediaType === 'VIDEO' && !videoUrl && !imageUrl) {
      return NextResponse.json(
        { error: 'Video URL or fallback thumbnail is required for video ads' },
        { status: 400 }
      );
    }

    if (mediaType === 'IMAGE' && !imageUrl) {
      return NextResponse.json(
        { error: 'Creative image URL is required' },
        { status: 400 }
      );
    }

    const ad = await prisma.advertisement.create({
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
        active: Boolean(active),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.userId,
        action: 'ADVERTISEMENT_CREATED',
        entityType: 'ADVERTISEMENT',
        entityId: ad.id,
        payload: JSON.stringify(ad),
      },
    });

    return NextResponse.json({ success: true, ad });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT update advertisement
export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const {
      id,
      title,
      description,
      mediaType,
      imageUrl,
      videoUrl,
      targetUrl,
      ctaText,
      badge,
      placement,
      durationSeconds,
      skipOffsetSeconds,
      active,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Ad ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (mediaType !== undefined) updateData.mediaType = mediaType === 'VIDEO' ? 'VIDEO' : 'IMAGE';
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl.trim();
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl ? videoUrl.trim() : null;
    if (targetUrl !== undefined) updateData.targetUrl = targetUrl.trim();
    if (ctaText !== undefined) updateData.ctaText = ctaText.trim();
    if (badge !== undefined) updateData.badge = badge.trim();
    if (placement !== undefined) updateData.placement = placement.toUpperCase();
    if (durationSeconds !== undefined) updateData.durationSeconds = parseInt(String(durationSeconds), 10);
    if (skipOffsetSeconds !== undefined) updateData.skipOffsetSeconds = parseInt(String(skipOffsetSeconds), 10);
    if (active !== undefined) updateData.active = Boolean(active);

    const updated = await prisma.advertisement.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.userId,
        action: 'ADVERTISEMENT_UPDATED',
        entityType: 'ADVERTISEMENT',
        entityId: id,
        payload: JSON.stringify(updateData),
      },
    });

    return NextResponse.json({ success: true, ad: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE advertisement
export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Ad ID is required' }, { status: 400 });
    }

    await prisma.advertisement.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.userId,
        action: 'ADVERTISEMENT_DELETED',
        entityType: 'ADVERTISEMENT',
        entityId: id,
      },
    });

    return NextResponse.json({ success: true, message: 'Ad deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

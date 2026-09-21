import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { vodId: string } }
) {
  try {
    const session = await getSession();

    const vod = await prisma.vod.findUnique({
      where: { id: params.vodId },
      include: {
        streamer: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!vod) {
      return NextResponse.json({ error: 'VOD not found' }, { status: 404 });
    }

    // Increment view count asynchronously
    await prisma.vod.update({
      where: { id: params.vodId },
      data: { viewCount: { increment: 1 } },
    });

    // Check if viewer has unlocked or is the creator
    const isOwner = session?.userId === vod.streamer.userId;
    const isFree = vod.priceTokens === 0;

    let isUnlocked = isFree || isOwner;

    if (!isUnlocked && session) {
      // Check if user has an unlock transaction for this VOD
      const existingPurchase = await prisma.transaction.findFirst({
        where: {
          senderId: session.userId,
          type: { in: ['VOD_UNLOCK', 'TIP', 'PPV_UNLOCK'] },
          metadata: {
            contains: `"vodId":"${vod.id}"`,
          },
        },
      });
      if (existingPurchase) {
        isUnlocked = true;
      }
    }

    return NextResponse.json({
      vod,
      isUnlocked,
      isOwner,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { vodId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vod = await prisma.vod.findUnique({
      where: { id: params.vodId },
      include: { streamer: true },
    });

    if (!vod) {
      return NextResponse.json({ error: 'VOD not found' }, { status: 404 });
    }

    if (session.role !== 'ADMIN' && vod.streamer.userId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden: Not your VOD' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      videoUrl,
      thumbnailUrl,
      durationSeconds,
      priceTokens,
      isPublished,
      sourceType,
    } = body;

    const updatedVod = await prisma.vod.update({
      where: { id: params.vodId },
      data: {
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(description !== undefined ? { description: description ? description.trim() : null } : {}),
        ...(videoUrl !== undefined ? { videoUrl: videoUrl.trim() } : {}),
        ...(thumbnailUrl !== undefined ? { thumbnailUrl: thumbnailUrl ? thumbnailUrl.trim() : null } : {}),
        ...(durationSeconds !== undefined ? { durationSeconds: Number(durationSeconds) || 0 } : {}),
        ...(priceTokens !== undefined ? { priceTokens: Math.max(0, Number(priceTokens) || 0) } : {}),
        ...(isPublished !== undefined ? { isPublished: Boolean(isPublished) } : {}),
        ...(sourceType !== undefined ? { sourceType } : {}),
      },
      include: {
        streamer: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, vod: updatedVod });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { vodId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vod = await prisma.vod.findUnique({
      where: { id: params.vodId },
      include: { streamer: true },
    });

    if (!vod) {
      return NextResponse.json({ error: 'VOD not found' }, { status: 404 });
    }

    if (session.role !== 'ADMIN' && vod.streamer.userId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden: Not your VOD' }, { status: 403 });
    }

    await prisma.vod.delete({
      where: { id: params.vodId },
    });

    return NextResponse.json({ success: true, message: 'VOD deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

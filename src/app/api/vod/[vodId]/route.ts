import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

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
          type: 'TIP',
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

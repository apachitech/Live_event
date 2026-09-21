import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const streamerId = searchParams.get('streamerId');
    const search = searchParams.get('q');
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20', 10));

    const where: any = { isPublished: true };

    if (streamerId) {
      where.streamerId = streamerId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const vods = await prisma.vod.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
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

    return NextResponse.json({ vods });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (session.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Viewers cannot publish VODs. Viewers can only create Ad campaigns!' },
        { status: 403 }
      );
    }

    if (session.role !== 'STREAMER' && session.role !== 'AGENCY' && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Streamer or Agency role required' }, { status: 403 });
    }

    let streamerProfile = await prisma.streamerProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!streamerProfile) {
      if (session.role === 'ADMIN' || session.role === 'AGENCY') {
        const user = await prisma.user.findUnique({ where: { id: session.userId } });
        streamerProfile = await prisma.streamerProfile.create({
          data: {
            userId: session.userId,
            displayName: user?.agencyName || user?.username || (session.role === 'ADMIN' ? 'Platform Admin' : 'Agency Creator'),
            bio: session.role === 'ADMIN' ? 'Official Platform VOD Publisher' : 'Verified Agency Media Publisher',
            kycStatus: 'VERIFIED',
          },
        });
      } else {
        return NextResponse.json({ error: 'Streamer profile not found' }, { status: 404 });
      }
    }

    const {
      title,
      description,
      videoUrl,
      thumbnailUrl,
      durationSeconds = 0,
      priceTokens = 0,
      sourceType = 'CLOUDINARY',
    } = await req.json();

    if (!title || !videoUrl) {
      return NextResponse.json({ error: 'Title and videoUrl are required' }, { status: 400 });
    }

    const vod = await prisma.vod.create({
      data: {
        streamerId: streamerProfile.id,
        title,
        description: description || null,
        videoUrl,
        thumbnailUrl: thumbnailUrl || null,
        durationSeconds: Number(durationSeconds) || 0,
        priceTokens: Math.max(0, Number(priceTokens) || 0),
        sourceType,
        isPublished: true,
      },
      include: {
        streamer: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, vod });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

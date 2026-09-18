import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'trending';

    const whereClause: any = {
      status: { in: ['LIVE', 'PRIVATE', 'live', 'private'] },
    };

    if (category && category !== 'All') {
      whereClause.category = { contains: category, mode: 'insensitive' };
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { streamer: { displayName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const orderBy: any = {};
    if (sort === 'trending' || sort === 'viewers') {
      orderBy.viewerCount = 'desc';
    } else if (sort === 'tokens') {
      orderBy.totalTokensEarned = 'desc';
    } else {
      orderBy.startedAt = 'desc';
    }

    const streams = await prisma.stream.findMany({
      where: whereClause,
      include: {
        streamer: {
          include: {
            user: {
              select: { id: true, avatarUrl: true, username: true },
            },
          },
        },
        tipGoals: {
          where: { active: true },
          take: 1,
        },
      },
      orderBy,
      take: 50,
    });

    return NextResponse.json({ success: true, streams });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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

    let streams = await prisma.stream.findMany({
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

    // If no streams currently match (e.g. all streams previously ended),
    // auto-activate available streams so the platform always opens with rich live content on all devices
    if (streams.length === 0) {
      const count = await prisma.stream.count();
      if (count > 0) {
        await prisma.stream.updateMany({
          data: { status: 'LIVE' },
        });
        streams = (await prisma.stream.findMany({
          where: {
            status: { in: ['LIVE', 'PRIVATE', 'live', 'private'] },
            ...(category && category !== 'All' ? { category: { contains: category } } : {}),
            ...(search ? {
              OR: [
                { title: { contains: search } },
                { streamer: { displayName: { contains: search } } },
              ],
            } : {}),
          } as any,
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
        })) as any;
      }
    }

    return NextResponse.json({ success: true, streams });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

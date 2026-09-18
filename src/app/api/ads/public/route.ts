import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const placement = searchParams.get('placement');

    const whereClause: any = { active: true };
    if (placement && placement !== 'ALL') {
      whereClause.placement = placement.toUpperCase();
    }

    const ads = await prisma.advertisement.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        imageUrl: true,
        targetUrl: true,
        placement: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({ success: true, ads });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, event } = body;

    if (!id || !['click', 'impression'].includes(event)) {
      return NextResponse.json({ error: 'Valid ad ID and event required' }, { status: 400 });
    }

    if (event === 'click') {
      await prisma.advertisement.update({
        where: { id },
        data: { clicks: { increment: 1 } },
      });
    } else if (event === 'impression') {
      await prisma.advertisement.update({
        where: { id },
        data: { impressions: { increment: 1 } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const [totalUsers, totalStreamers, liveStreams, totalTransactions, transactions] = await Promise.all([
      prisma.user.count(),
      prisma.streamerProfile.count(),
      prisma.stream.count({ where: { status: { in: ['LIVE', 'PRIVATE'] } } }),
      prisma.transaction.count(),
      prisma.transaction.findMany({
        where: { type: 'PURCHASE' },
        select: { fiatAmountCents: true },
      }),
    ]);

    const totalRevenueCents = transactions.reduce((acc, t) => acc + (t.fiatAmountCents || 0), 0);

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalStreamers,
        liveStreams,
        totalTransactions,
        totalRevenueCents,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

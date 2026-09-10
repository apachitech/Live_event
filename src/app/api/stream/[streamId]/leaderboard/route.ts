import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { streamId: string } }) {
  try {
    const { streamId } = params;
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope') || 'stream'; // 'stream' or 'allTime'

    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      include: { streamer: true },
    });

    if (!stream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
    }

    const whereClause: any = {
      type: { in: ['TIP', 'PRIVATE_SHOW'] },
    };

    if (scope === 'stream') {
      whereClause.streamId = streamId;
    } else {
      whereClause.recipientId = stream.streamer.userId;
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        sender: {
          select: { id: true, username: true, avatarUrl: true, role: true },
        },
      },
    });

    // Aggregate tokens by sender
    const userTotals = new Map<string, { user: any; totalTokens: number }>();
    for (const tx of transactions) {
      if (!tx.senderId || !tx.sender) continue;
      const current = userTotals.get(tx.senderId) || { user: tx.sender, totalTokens: 0 };
      current.totalTokens += tx.amount;
      userTotals.set(tx.senderId, current);
    }

    const leaderboard = Array.from(userTotals.values())
      .sort((a, b) => b.totalTokens - a.totalTokens)
      .slice(0, 10)
      .map((entry, index) => {
        let badge = 'Fan';
        if (entry.totalTokens >= 1000) badge = 'Whale Patron';
        else if (entry.totalTokens >= 500) badge = 'Top Fan';
        else if (entry.totalTokens >= 100) badge = 'Loyal Fan';

        return {
          rank: index + 1,
          userId: entry.user.id,
          username: entry.user.username,
          avatarUrl: entry.user.avatarUrl,
          totalTokens: entry.totalTokens,
          badge,
        };
      });

    return NextResponse.json({ success: true, leaderboard, scope });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

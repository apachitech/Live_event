import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { WalletService } from '@/lib/ledger/walletService';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { streamId, minuteNumber } = await req.json();

    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      include: { streamer: true },
    });

    if (!stream || !stream.isPrivate || !stream.privateUserId) {
      return NextResponse.json({ error: 'Stream is not in private mode' }, { status: 400 });
    }

    const rate = stream.privateRatePerMin || 60;

    try {
      const result = await WalletService.debitPrivateShowMinute({
        viewerUserId: stream.privateUserId,
        streamerUserId: stream.streamer.userId,
        streamId: stream.id,
        ratePerMin: rate,
        minuteNumber: minuteNumber || 1,
      });

      // Update PrivateSession stats in database
      await prisma.privateSession.updateMany({
        where: { streamId: stream.id, status: 'ACTIVE' },
        data: {
          totalMinutes: minuteNumber || 1,
          totalTokensSpent: { increment: rate },
        },
      });

      return NextResponse.json(result);
    } catch (e: any) {
      if (e.message === 'INSUFFICIENT_FUNDS') {
        // Automatically exit private show and mark session ENDED
        await prisma.stream.update({
          where: { id: streamId },
          data: { isPrivate: false, status: 'LIVE', privateUserId: null },
        });

        await prisma.privateSession.updateMany({
          where: { streamId: stream.id, status: 'ACTIVE' },
          data: {
            status: 'ENDED',
            endedAt: new Date(),
          },
        });

        if ((global as any).io) {
          (global as any).io.to(`stream:${stream.id}`).emit('private_show_ended', {
            streamId: stream.id,
            reason: 'Viewer out of tokens',
          });
        }

        return NextResponse.json({
          success: false,
          error: 'INSUFFICIENT_FUNDS',
          ended: true,
        }, { status: 402 });
      }
      throw e;
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

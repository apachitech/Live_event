import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { paymentProcessor } from '@/lib/payment';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const payouts = await prisma.payout.findMany({
      include: {
        streamer: {
          include: {
            user: { select: { username: true, email: true } },
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
    });

    return NextResponse.json({ success: true, payouts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { payoutId, action } = await req.json(); // action: "APPROVE" | "REJECT"

    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: { streamer: true },
    });

    if (!payout) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 });
    }

    if (action === 'APPROVE') {
      // Execute payout through processor (Stripe Connect / CCBill wire / Mock)
      const execution = await paymentProcessor.processStreamerPayout(
        payout.streamerId,
        payout.payoutAmountCents,
        payout.streamer.payoutDetails ? JSON.parse(payout.streamer.payoutDetails) : null
      );

      const updated = await prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: 'COMPLETED',
          processedAt: new Date(),
          paymentReference: execution.referenceId,
          reviewedByUserId: session.userId,
        },
      });

      return NextResponse.json({ success: true, payout: updated });
    }

    if (action === 'REJECT') {
      // Refund tokens back to streamer wallet
      await prisma.$transaction(async (tx) => {
        await tx.wallet.update({
          where: { userId: payout.streamer.userId },
          data: { earnedBalance: { increment: payout.tokensDeducted } },
        });

        await tx.payout.update({
          where: { id: payoutId },
          data: {
            status: 'REJECTED',
            processedAt: new Date(),
            reviewedByUserId: session.userId,
          },
        });
      });

      return NextResponse.json({ success: true, status: 'REJECTED' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

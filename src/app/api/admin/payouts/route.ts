import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { paymentProcessor } from '@/lib/payment';
import { logChangeData } from '@/lib/audit';
export const dynamic = 'force-dynamic';

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
      const payoutDetails = payout.streamer.payoutDetails ? JSON.parse(payout.streamer.payoutDetails) : null;
      const method = payout.streamer.payoutMethod || '';

      const { getPaymentProcessor } = await import('@/lib/payment');
      let processorToUse = paymentProcessor;

      if (method.startsWith('SASPAY') || method === 'MOBILE_MONEY' || payoutDetails?.provider === 'SASPAY' || payoutDetails?.operator) {
        processorToUse = getPaymentProcessor('SASPAY');
      } else if (method.startsWith('CRYPTO') || payoutDetails?.network || payoutDetails?.walletAddress) {
        processorToUse = getPaymentProcessor('CRYPTO');
      } else if (method.startsWith('VAULTPAY') || payoutDetails?.isVirtualCard || payoutDetails?.cardNumber) {
        processorToUse = getPaymentProcessor('VAULTPAY');
      }

      // Execute payout through selected processor
      const execution = await processorToUse.processStreamerPayout(
        payout.streamerId,
        payout.payoutAmountCents,
        payoutDetails
      );

      if (!execution.success) {
        return NextResponse.json({
          error: execution.error || 'Disbursement execution failed. Check provider logs or balance.',
        }, { status: 400 });
      }

      const updated = await prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: 'COMPLETED',
          processedAt: new Date(),
          paymentReference: execution.referenceId,
          reviewedByUserId: session.userId,
        },
      });

      // Hard copy payout approval change data
      await logChangeData({
        actorUserId: session.userId,
        action: 'PAYOUT_APPROVED',
        entityType: 'Payout',
        entityId: payoutId,
        payload: {
          streamerId: payout.streamerId,
          tokensDeducted: payout.tokensDeducted,
          payoutAmountCents: payout.payoutAmountCents,
          referenceId: execution.referenceId,
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

      // Hard copy payout rejection change data
      await logChangeData({
        actorUserId: session.userId,
        action: 'PAYOUT_REJECTED',
        entityType: 'Payout',
        entityId: payoutId,
        payload: {
          streamerId: payout.streamerId,
          tokensRefunded: payout.tokensDeducted,
          payoutAmountCents: payout.payoutAmountCents,
        },
      });

      return NextResponse.json({ success: true, status: 'REJECTED' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { WalletService } from '@/lib/ledger/walletService';
import { dispatchExternalDeviceTrigger } from '@/lib/webhooks/externalTrigger';

export async function POST(req: Request, { params }: { params: { streamId: string } }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Please log in to send tips' }, { status: 401 });
    }

    const { streamId } = params;
    const { tokenAmount, message, menuItemLabel } = await req.json();

    if (!tokenAmount || tokenAmount < 1) {
      return NextResponse.json({ error: 'Minimum tip is 1 token' }, { status: 400 });
    }

    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      include: {
        streamer: true,
      },
    });

    if (!stream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
    }

    if (stream.streamer.userId === session.userId) {
      return NextResponse.json({ error: 'You cannot tip your own stream' }, { status: 400 });
    }

    // Execute atomic wallet transfer & ledger audit
    const result = await WalletService.sendTip({
      senderUserId: session.userId,
      streamerUserId: stream.streamer.userId,
      streamId: stream.id,
      tokenAmount: parseInt(tokenAmount, 10),
      message,
      menuItemLabel,
    });

    // Notify external hardware device trigger if configured
    dispatchExternalDeviceTrigger(stream.streamer.externalDeviceWebhook, {
      event: 'tip',
      streamId: stream.id,
      streamerId: stream.streamer.id,
      senderUsername: session.username,
      tokens: tokenAmount,
      menuItemLabel,
      timestamp: new Date().toISOString(),
    });

    // Broadcast tip alert to room via global Socket.IO server if available
    const tipAlertPayload = {
      id: result.transaction.id,
      streamId: stream.id,
      senderUsername: session.username,
      amount: tokenAmount,
      message,
      menuItemLabel,
      createdAt: new Date().toISOString(),
    };

    if ((global as any).io) {
      (global as any).io.to(`stream:${stream.id}`).emit('tip_alert', tipAlertPayload);

      // Also broadcast updated goal
      const updatedGoals = await prisma.tipGoal.findMany({
        where: { streamId: stream.id, active: true },
      });
      if (updatedGoals.length > 0) {
        (global as any).io.to(`stream:${stream.id}`).emit('goal_updated', updatedGoals[0]);
      }
    }

    return NextResponse.json({
      success: true,
      transaction: result.transaction,
      senderBalance: result.senderBalance,
      tipAlert: tipAlertPayload,
    });
  } catch (err: any) {
    console.error('Tip error:', err);
    return NextResponse.json({ error: err.message || 'Failed to send tip' }, { status: 400 });
  }
}

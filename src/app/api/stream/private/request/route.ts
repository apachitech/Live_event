import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { streamId, action, requestId } = await req.json();

    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      include: { streamer: true },
    });

    if (!stream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
    }

    if (action === 'request') {
      // Check viewer has at least enough tokens for 2 minutes
      const minRequired = (stream.privateRatePerMin || 60) * 2;
      const viewerWallet = await prisma.wallet.findUnique({
        where: { userId: session.userId },
      });

      if (!viewerWallet || viewerWallet.balance < minRequired) {
        return NextResponse.json({
          error: `You need at least ${minRequired} tokens to request a private show.`,
        }, { status: 400 });
      }

      const { c2cEnabled = true } = await req.json().catch(() => ({ c2cEnabled: true }));

      // Create PrivateSession record in database
      const privateSession = await prisma.privateSession.create({
        data: {
          streamId: stream.id,
          viewerId: session.userId,
          ratePerMinute: stream.privateRatePerMin || 60,
          status: 'REQUESTED',
          c2cEnabled: Boolean(c2cEnabled),
        },
      });

      const payload = {
        requestId: privateSession.id,
        sessionId: privateSession.id,
        streamId: stream.id,
        viewerId: session.userId,
        viewerUsername: session.username,
        ratePerMin: stream.privateRatePerMin || 60,
        c2cEnabled: privateSession.c2cEnabled,
      };

      if ((global as any).io) {
        (global as any).io.to(`stream:${stream.id}`).emit('private_show_requested', payload);
      }

      return NextResponse.json({ success: true, request: payload, session: privateSession });
    }

    if (action === 'accept') {
      if (stream.streamer.userId !== session.userId) {
        return NextResponse.json({ error: 'Only the streamer can accept private shows' }, { status: 403 });
      }

      const body = await req.json().catch(() => ({}));
      const viewerId = body.viewerId;
      const sessionId = body.sessionId || requestId;

      await prisma.stream.update({
        where: { id: streamId },
        data: {
          isPrivate: true,
          status: 'PRIVATE',
          privateUserId: viewerId,
        },
      });

      let c2c = true;
      if (sessionId) {
        const sessionRecord = await prisma.privateSession.findUnique({ where: { id: sessionId } });
        if (sessionRecord) {
          c2c = sessionRecord.c2cEnabled;
        }
        await prisma.privateSession.updateMany({
          where: { id: sessionId },
          data: {
            status: 'ACTIVE',
            startedAt: new Date(),
          },
        });
      }

      if ((global as any).io) {
        (global as any).io.to(`stream:${stream.id}`).emit('private_show_response', {
          streamId: stream.id,
          accepted: true,
          viewerId,
          requestId: sessionId,
          sessionId,
          ratePerMin: stream.privateRatePerMin || 60,
          c2cEnabled: c2c,
        });
      }

      return NextResponse.json({ success: true, status: 'PRIVATE', sessionId });
    }

    if (action === 'end') {
      await prisma.stream.update({
        where: { id: streamId },
        data: {
          isPrivate: false,
          status: 'LIVE',
          privateUserId: null,
        },
      });

      // Mark any active private sessions for this stream as ENDED
      const activeSession = await prisma.privateSession.findFirst({
        where: { streamId: stream.id, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
      });

      if (activeSession) {
        const endedAt = new Date();
        const start = activeSession.startedAt || activeSession.createdAt;
        const totalMinutes = Math.max(1, Math.round((endedAt.getTime() - start.getTime()) / 60000));

        await prisma.privateSession.update({
          where: { id: activeSession.id },
          data: {
            status: 'ENDED',
            endedAt,
            totalMinutes,
          },
        });
      }

      if ((global as any).io) {
        (global as any).io.to(`stream:${stream.id}`).emit('private_show_ended', { streamId: stream.id });
      }

      return NextResponse.json({ success: true, status: 'LIVE' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

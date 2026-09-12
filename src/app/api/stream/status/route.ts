import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logChangeData } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { streamId, status } = await req.json();

    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      include: { streamer: true },
    });

    if (!stream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
    }

    if (stream.streamer.userId !== session.userId && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.stream.update({
      where: { id: streamId },
      data: {
        status,
        endedAt: status === 'ENDED' || status === 'OFFLINE' ? new Date() : undefined,
      },
    });

    // Hard copy stream status change data
    await logChangeData({
      actorUserId: session.userId,
      action: `STREAM_STATUS_${status}`,
      entityType: 'Stream',
      entityId: streamId,
      payload: {
        previousStatus: stream.status,
        newStatus: status,
        title: stream.title,
      },
    });

    if ((global as any).io) {
      (global as any).io.emit('stream_status_changed', { streamId, status });
    }

    return NextResponse.json({ success: true, stream: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

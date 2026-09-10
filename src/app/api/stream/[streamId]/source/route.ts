import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: { streamId: string } }
) {
  try {
    const stream = await prisma.stream.findUnique({
      where: { id: params.streamId },
      select: {
        id: true,
        sourceType: true,
        externalStreamUrl: true,
        status: true,
      },
    });

    if (!stream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
    }

    return NextResponse.json({ stream });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { streamId: string } }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'STREAMER' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stream = await prisma.stream.findUnique({
      where: { id: params.streamId },
      include: { streamer: true },
    });

    if (!stream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
    }

    if (session.role !== 'ADMIN' && stream.streamer.userId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden: Not your stream room' }, { status: 403 });
    }

    const { sourceType, externalStreamUrl } = await req.json();

    const updated = await prisma.stream.update({
      where: { id: params.streamId },
      data: {
        sourceType: sourceType || 'WEBRTC',
        externalStreamUrl: externalStreamUrl || null,
      },
    });

    // Notify all viewers in the room of the source switch via Socket.IO
    if ((global as any).io) {
      (global as any).io.to(`stream:${params.streamId}`).emit('stream_source_changed', {
        streamId: params.streamId,
        sourceType: updated.sourceType,
        externalStreamUrl: updated.externalStreamUrl,
      });
    }

    return NextResponse.json({
      success: true,
      stream: {
        id: updated.id,
        sourceType: updated.sourceType,
        externalStreamUrl: updated.externalStreamUrl,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

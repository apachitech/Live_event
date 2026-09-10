import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { streamId: string } }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { streamId } = params;

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

    // Default LiveKit RTMP ingest server or custom RTMP ingest host
    const rtmpServer = process.env.LIVEKIT_RTMP_URL || 'rtmp://live.pulsestream.local/live';
    const whipUrl = process.env.LIVEKIT_WHIP_URL || 'https://whip.pulsestream.local/whip';

    return NextResponse.json({
      success: true,
      ingress: {
        rtmpServer,
        whipUrl,
        streamKey: stream.streamKey,
        roomName: stream.roomName,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

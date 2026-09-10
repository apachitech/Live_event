import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { videoProvider } from '@/lib/video';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const { streamId } = await req.json();

    if (!streamId) {
      return NextResponse.json({ error: 'Missing streamId' }, { status: 400 });
    }

    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      include: {
        streamer: {
          include: { user: true },
        },
      },
    });

    if (!stream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
    }

    const isPublisher = session?.userId === stream.streamer.userId;
    const participantId = session ? session.userId : `guest_${Math.random().toString(36).substring(2, 8)}`;
    const displayName = session ? session.username : 'Guest Viewer';

    const credentials = isPublisher
      ? await videoProvider.generatePublisherToken(stream.roomName, participantId, displayName)
      : await videoProvider.generateViewerToken(stream.roomName, participantId, displayName);

    return NextResponse.json({
      success: true,
      credentials: {
        ...credentials,
        isPublisher,
        streamTitle: stream.title,
        streamerName: stream.streamer.displayName,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Token generation failed' }, { status: 500 });
  }
}

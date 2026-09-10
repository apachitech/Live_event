import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { videoProvider } from '@/lib/video';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'STREAMER' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Only streamers can broadcast' }, { status: 403 });
    }

    const { title, category, privateRatePerMin } = await req.json();

    const streamer = await prisma.streamerProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!streamer) {
      return NextResponse.json({ error: 'Streamer profile not found' }, { status: 404 });
    }

    const roomName = `room_${streamer.id}_${Date.now()}`;
    const roomDetails = await videoProvider.createStreamRoom(streamer.id, title || 'Live Broadcast');

    const stream = await prisma.stream.create({
      data: {
        streamerId: streamer.id,
        title: title || `${streamer.displayName}'s Live Room`,
        category: category || 'Gaming & Chat',
        status: 'LIVE',
        startedAt: new Date(),
        roomName: roomDetails.roomName || roomName,
        playbackUrl: roomDetails.playbackUrl,
        privateRatePerMin: privateRatePerMin ? parseInt(privateRatePerMin, 10) : 60,
      },
    });

    // Create a starter tip goal for the stream
    await prisma.tipGoal.create({
      data: {
        streamId: stream.id,
        label: 'Community Goal: Upgrade Streaming Cam',
        targetAmount: 500,
        currentAmount: 0,
        active: true,
      },
    });

    return NextResponse.json({ success: true, stream });
  } catch (err: any) {
    console.error('Error creating stream:', err);
    return NextResponse.json({ error: err.message || 'Failed to initialize stream' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { videoProvider } from '@/lib/video';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Please sign in to broadcast live.' }, { status: 401 });
    }

    const { title, category, privateRatePerMin } = await req.json();

    // Ensure streamer profile exists (auto-create if missing for admin or user)
    let streamer = await prisma.streamerProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!streamer) {
      streamer = await prisma.streamerProfile.create({
        data: {
          userId: session.userId,
          displayName: session.username,
          bio: `Welcome to ${session.username}'s live broadcast channel!`,
          kycStatus: 'VERIFIED',
          kycVerifiedAt: new Date(),
        },
      });

      // Promote role to STREAMER if currently VIEWER
      if (session.role === 'VIEWER') {
        await prisma.user.update({
          where: { id: session.userId },
          data: { role: 'STREAMER' },
        });
      }
    }

    // End previous active streams for this streamer so only current stream is LIVE
    await prisma.stream.updateMany({
      where: {
        streamerId: streamer.id,
        status: { in: ['LIVE', 'PRIVATE'] },
      },
      data: {
        status: 'ENDED',
        endedAt: new Date(),
      },
    });

    const roomName = `room_${streamer.id}_${Date.now()}`;
    const roomDetails = await videoProvider.createStreamRoom(streamer.id, title || `${streamer.displayName}'s Live Room`);

    const stream = await prisma.stream.create({
      data: {
        streamerId: streamer.id,
        title: title?.trim() || `${streamer.displayName}'s Live Broadcast`,
        category: category || 'Gaming & Music',
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
        label: 'Community Goal: Support the Stream',
        targetAmount: 500,
        currentAmount: 0,
        active: true,
      },
    });

    // Notify connected socket clients that a stream has started
    if ((global as any).io) {
      (global as any).io.emit('stream_started', {
        streamId: stream.id,
        title: stream.title,
        streamerName: streamer.displayName,
      });
    }

    return NextResponse.json({ success: true, stream });
  } catch (err: any) {
    console.error('Error creating stream:', err);
    return NextResponse.json({ error: err.message || 'Failed to initialize stream' }, { status: 500 });
  }
}

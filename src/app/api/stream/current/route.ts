import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
    }

    // Ensure streamer profile exists
    let streamer = await prisma.streamerProfile.findUnique({
      where: { userId: session.userId },
      include: {
        tipMenus: { where: { active: true } },
      },
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
        include: {
          tipMenus: { where: { active: true } },
        },
      });

      if (session.role === 'VIEWER') {
        await prisma.user.update({
          where: { id: session.userId },
          data: { role: 'STREAMER' },
        });
      }
    }

    // Find the current active stream, or the latest stream
    let stream = await prisma.stream.findFirst({
      where: {
        streamerId: streamer.id,
        status: { in: ['LIVE', 'PRIVATE'] },
      },
      include: {
        streamer: {
          include: {
            user: {
              select: { id: true, username: true, avatarUrl: true },
            },
          },
        },
        tipGoals: { where: { active: true } },
        chatMessages: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { username: true, role: true } },
          },
        },
      },
    });

    if (!stream) {
      // Find the latest stream (even if OFFLINE or ENDED)
      stream = await prisma.stream.findFirst({
        where: { streamerId: streamer.id },
        orderBy: { createdAt: 'desc' },
        include: {
          streamer: {
            include: {
              user: {
                select: { id: true, username: true, avatarUrl: true },
              },
            },
          },
          tipGoals: { where: { active: true } },
          chatMessages: {
            take: 50,
            orderBy: { createdAt: 'desc' },
            include: {
              user: { select: { username: true, role: true } },
            },
          },
        },
      });
    }

    // If no stream exists at all, create a default channel stream record
    if (!stream) {
      const roomName = `room_${streamer.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      stream = await prisma.stream.create({
        data: {
          streamerId: streamer.id,
          title: `${streamer.displayName}'s Live Broadcast`,
          category: 'Gaming & Music',
          status: 'OFFLINE',
          roomName,
          privateRatePerMin: 60,
        },
        include: {
          streamer: {
            include: {
              user: {
                select: { id: true, username: true, avatarUrl: true },
              },
            },
          },
          tipGoals: { where: { active: true } },
          chatMessages: {
            take: 50,
            orderBy: { createdAt: 'desc' },
            include: {
              user: { select: { username: true, role: true } },
            },
          },
        },
      });
    }

    return NextResponse.json({ success: true, stream });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

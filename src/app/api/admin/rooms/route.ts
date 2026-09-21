import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logChangeData } from '@/lib/audit';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').trim();
    const statusFilter = (searchParams.get('status') || 'ALL').trim();

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { category: { contains: search } },
        { roomName: { contains: search } },
        { streamer: { displayName: { contains: search } } },
        { streamer: { user: { username: { contains: search } } } },
      ];
    }
    if (statusFilter && statusFilter !== 'ALL') {
      where.status = statusFilter;
    }

    const streams = await prisma.stream.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        streamer: {
          select: {
            id: true,
            displayName: true,
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            chatMessages: true,
            polls: true,
            tipGoals: true,
          },
        },
      },
    });

    const stats = {
      total: await prisma.stream.count(),
      live: await prisma.stream.count({ where: { status: 'LIVE' } }),
      private: await prisma.stream.count({ where: { status: 'PRIVATE' } }),
      offline: await prisma.stream.count({ where: { status: 'OFFLINE' } }),
      ended: await prisma.stream.count({ where: { status: 'ENDED' } }),
    };

    return NextResponse.json({ success: true, streams, stats });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { streamerId, title, category, sourceType, externalStreamUrl, isPrivate, privateRatePerMin } = await req.json();

    if (!streamerId || !title) {
      return NextResponse.json({ error: 'Streamer ID and Room Title are required' }, { status: 400 });
    }

    const streamer = await prisma.streamerProfile.findUnique({
      where: { id: streamerId },
      include: { user: true },
    });

    if (!streamer) {
      return NextResponse.json({ error: 'Streamer profile not found' }, { status: 404 });
    }

    const randomSuffix = crypto.randomBytes(4).toString('hex');
    const roomName = `room-${streamer.user.username}-${randomSuffix}`;
    const streamKey = `live_${crypto.randomBytes(12).toString('hex')}`;

    const stream = await prisma.stream.create({
      data: {
        streamerId,
        title: String(title).trim(),
        category: category ? String(category).trim() : 'Gaming & Chat',
        sourceType: sourceType || 'WEBRTC',
        externalStreamUrl: externalStreamUrl ? String(externalStreamUrl).trim() : undefined,
        isPrivate: !!isPrivate,
        privateRatePerMin: privateRatePerMin ? parseInt(privateRatePerMin, 10) : 60,
        roomName,
        streamKey,
        status: 'OFFLINE',
      },
      include: {
        streamer: {
          select: {
            displayName: true,
            user: { select: { username: true } },
          },
        },
      },
    });

    await logChangeData({
      actorUserId: session.userId,
      action: 'ADMIN_CREATE_STREAM_ROOM',
      entityType: 'Stream',
      entityId: stream.id,
      payload: { title: stream.title, roomName: stream.roomName },
    });

    return NextResponse.json({ success: true, stream });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { streamId, action, title, category, sourceType, externalStreamUrl, privateRatePerMin } = body;

    if (!streamId) {
      return NextResponse.json({ error: 'Stream ID is required' }, { status: 400 });
    }

    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      include: { streamer: true },
    });

    if (!stream) {
      return NextResponse.json({ error: 'Stream room not found' }, { status: 404 });
    }

    // Force-terminate live stream action
    if (action === 'TERMINATE_LIVE') {
      const updated = await prisma.stream.update({
        where: { id: streamId },
        data: {
          status: 'ENDED',
          endedAt: new Date(),
          viewerCount: 0,
        },
      });

      // Broadcast termination event immediately via Socket.IO
      if ((global as any).io) {
        (global as any).io.emit('stream_status_changed', { streamId, status: 'ENDED' });
        (global as any).io.to(stream.roomName).emit('stream_force_ended', {
          reason: 'This live broadcast was terminated by a platform administrator.',
        });
      }

      await logChangeData({
        actorUserId: session.userId,
        action: 'ADMIN_FORCE_TERMINATE_STREAM',
        entityType: 'Stream',
        entityId: streamId,
        payload: { title: stream.title, roomName: stream.roomName },
      });

      return NextResponse.json({
        success: true,
        message: `Live stream "${stream.title}" was force-terminated in real time.`,
        stream: updated,
      });
    }

    // General room edit
    const updateData: any = {};
    if (title) updateData.title = String(title).trim();
    if (category) updateData.category = String(category).trim();
    if (sourceType) updateData.sourceType = sourceType;
    if (typeof externalStreamUrl === 'string') updateData.externalStreamUrl = externalStreamUrl.trim() || null;
    if (typeof privateRatePerMin === 'number') updateData.privateRatePerMin = privateRatePerMin;

    const updated = await prisma.stream.update({
      where: { id: streamId },
      data: updateData,
    });

    await logChangeData({
      actorUserId: session.userId,
      action: 'ADMIN_UPDATE_STREAM_ROOM',
      entityType: 'Stream',
      entityId: streamId,
      payload: updateData,
    });

    return NextResponse.json({ success: true, stream: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const streamId = searchParams.get('id');

    if (!streamId) {
      return NextResponse.json({ error: 'Stream ID is required' }, { status: 400 });
    }

    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      select: { title: true, roomName: true, status: true },
    });

    if (!stream) {
      return NextResponse.json({ error: 'Stream room not found' }, { status: 404 });
    }

    // If live, emit kill event first
    if (stream.status === 'LIVE' && (global as any).io) {
      (global as any).io.emit('stream_status_changed', { streamId, status: 'ENDED' });
    }

    await prisma.stream.delete({
      where: { id: streamId },
    });

    await logChangeData({
      actorUserId: session.userId,
      action: 'ADMIN_DELETE_STREAM_ROOM',
      entityType: 'Stream',
      entityId: streamId,
      payload: { title: stream.title, roomName: stream.roomName },
    });

    return NextResponse.json({
      success: true,
      message: `Stream room "${stream.title}" deleted successfully.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

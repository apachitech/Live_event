import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logChangeData } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { streamId: string } }
) {
  try {
    const { streamId } = params;

    const messages = await prisma.chatMessage.findMany({
      where: { streamId },
      orderBy: { createdAt: 'asc' },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
            avatarUrl: true,
          },
        },
      },
    });

    const formatted = messages.map((m) => ({
      id: m.id,
      streamId: m.streamId,
      userId: m.userId,
      username: m.user?.username || 'Viewer',
      role: m.user?.role || 'VIEWER',
      body: m.body,
      flagged: m.flagged,
      createdAt: m.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, messages: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { streamId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Please sign in to send messages.' }, { status: 401 });
    }

    const { streamId } = params;
    const { body } = await req.json();

    if (!body || !body.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 });
    }

    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
    });

    if (!stream) {
      return NextResponse.json({ error: 'Stream not found.' }, { status: 404 });
    }

    // Basic profanity / harmful content filter
    const bannedWords = ['scam', 'phishing', 'botnet', 'malware', 'exploit'];
    const containsBanned = bannedWords.some((w) => body.toLowerCase().includes(w));
    const cleanBody = containsBanned ? '[Flagged Message: Under Review]' : body.trim();

    // Hard copy chat message to database
    const savedMsg = await prisma.chatMessage.create({
      data: {
        streamId,
        userId: session.userId,
        body: cleanBody,
        flagged: containsBanned,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    // Hard copy change data if message is flagged
    if (containsBanned) {
      await logChangeData({
        actorUserId: session.userId,
        action: 'CHAT_MESSAGE_FLAGGED',
        entityType: 'ChatMessage',
        entityId: savedMsg.id,
        payload: {
          originalBody: body.trim(),
          streamId,
          flaggedReason: 'Banned term detected',
        },
      });
    }

    const payload = {
      id: savedMsg.id,
      streamId,
      userId: session.userId,
      username: session.username,
      role: session.role,
      body: cleanBody,
      flagged: containsBanned,
      createdAt: savedMsg.createdAt.toISOString(),
    };

    // Broadcast over Socket.io
    if ((global as any).io) {
      (global as any).io.to(`stream:${streamId}`).emit('new_chat_message', payload);
    }

    return NextResponse.json({ success: true, message: payload });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { streamId: string } }) {
  try {
    const { streamId } = params;

    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      include: {
        streamer: {
          include: {
            user: {
              select: { id: true, username: true, avatarUrl: true },
            },
            tipMenus: {
              where: { active: true },
            },
          },
        },
        tipGoals: {
          where: { active: true },
        },
        chatMessages: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { username: true, role: true },
            },
          },
        },
      },
    });

    if (!stream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, stream });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

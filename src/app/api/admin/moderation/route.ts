import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const flags = await prisma.moderationFlag.findMany({
      include: {
        reportedByUser: {
          select: { username: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, flags });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const { targetType, targetId, reason, action, flagId } = await req.json();

    // User reporting a stream or message
    if (!flagId) {
      const flag = await prisma.moderationFlag.create({
        data: {
          targetType: targetType || 'STREAM',
          targetId: targetId || 'general',
          reason: reason || 'Inappropriate content',
          reportedByUserId: session?.userId,
          status: 'PENDING',
        },
      });
      return NextResponse.json({ success: true, flag });
    }

    // Admin taking moderation action
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.moderationFlag.update({
      where: { id: flagId },
      data: {
        status: action === 'DISMISS' ? 'DISMISSED' : 'ACTIONED',
        actionTaken: action,
      },
    });

    return NextResponse.json({ success: true, flag: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

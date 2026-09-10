import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { streamId: string } }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { streamId } = params;
    const { label, targetAmount } = await req.json();

    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      include: { streamer: true },
    });

    if (!stream || stream.streamer.userId !== session.userId) {
      return NextResponse.json({ error: 'Only the streamer can create tip goals' }, { status: 403 });
    }

    // Deactivate previous active goals
    await prisma.tipGoal.updateMany({
      where: { streamId, active: true },
      data: { active: false },
    });

    const goal = await prisma.tipGoal.create({
      data: {
        streamId,
        label,
        targetAmount: parseInt(targetAmount, 10),
        currentAmount: 0,
        active: true,
      },
    });

    if ((global as any).io) {
      (global as any).io.to(`stream:${streamId}`).emit('goal_updated', goal);
    }

    return NextResponse.json({ success: true, goal });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

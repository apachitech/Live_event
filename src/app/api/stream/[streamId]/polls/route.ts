import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { streamId: string } }) {
  try {
    const session = await getSession();
    const { streamId } = params;

    const poll = await prisma.poll.findFirst({
      where: { streamId, active: true },
      include: {
        options: true,
        votes: session ? { where: { userId: session.userId } } : false,
      },
    });

    if (!poll) {
      return NextResponse.json({ success: true, poll: null });
    }

    const userVotedOptionId = poll.votes?.[0]?.optionId || null;
    const totalVotes = poll.options.reduce((acc, opt) => acc + opt.voteCount, 0);

    return NextResponse.json({
      success: true,
      poll: {
        id: poll.id,
        question: poll.question,
        tokenCost: poll.tokenCost,
        active: poll.active,
        totalVotes,
        userVotedOptionId,
        options: poll.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          voteCount: opt.voteCount,
          percentage: totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0,
        })),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { streamId: string } }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { streamId } = params;
    const { question, options, tokenCost = 0 } = await req.json();

    if (!question || !options || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json({ error: 'Poll requires a question and at least 2 options.' }, { status: 400 });
    }

    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      include: { streamer: true },
    });

    if (!stream || stream.streamer.userId !== session.userId) {
      return NextResponse.json({ error: 'Only the streamer can launch polls.' }, { status: 403 });
    }

    // Deactivate previous active polls
    await prisma.poll.updateMany({
      where: { streamId, active: true },
      data: { active: false, endedAt: new Date() },
    });

    const poll = await prisma.poll.create({
      data: {
        streamId,
        question,
        tokenCost: parseInt(tokenCost, 10) || 0,
        active: true,
        options: {
          create: options.map((optText: string) => ({
            text: optText.trim(),
            voteCount: 0,
          })),
        },
      },
      include: {
        options: true,
      },
    });

    const pollPayload = {
      id: poll.id,
      streamId,
      question: poll.question,
      tokenCost: poll.tokenCost,
      active: true,
      totalVotes: 0,
      options: poll.options.map((o) => ({
        id: o.id,
        text: o.text,
        voteCount: 0,
        percentage: 0,
      })),
    };

    if ((global as any).io) {
      (global as any).io.to(`stream:${streamId}`).emit('poll_updated', pollPayload);
    }

    return NextResponse.json({ success: true, poll: pollPayload });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { streamId: string } }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { streamId } = params;
    const { pollId } = await req.json();

    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      include: { streamer: true },
    });

    if (!stream || stream.streamer.userId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.poll.update({
      where: { id: pollId },
      data: { active: false, endedAt: new Date() },
      include: { options: true },
    });

    if ((global as any).io) {
      (global as any).io.to(`stream:${streamId}`).emit('poll_closed', { pollId });
    }

    return NextResponse.json({ success: true, poll: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getPlatformRevenueSplit } from '@/lib/ledger/walletService';

export async function POST(req: Request, { params }: { params: { streamId: string } }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Please sign in to vote' }, { status: 401 });
    }

    const { streamId } = params;
    const { pollId, optionId } = await req.json();

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        stream: { include: { streamer: true } },
        options: true,
      },
    });

    if (!poll || !poll.active) {
      return NextResponse.json({ error: 'This poll is no longer active.' }, { status: 400 });
    }

    // Check if user has already voted
    const existingVote = await prisma.pollVote.findUnique({
      where: {
        pollId_userId: {
          pollId,
          userId: session.userId,
        },
      },
    });

    if (existingVote) {
      return NextResponse.json({ error: 'You have already voted in this poll.' }, { status: 400 });
    }

    // Process Token-Paid vote if tokenCost > 0
    if (poll.tokenCost > 0) {
      const viewerWallet = await prisma.wallet.findUnique({
        where: { userId: session.userId },
      });

      if (!viewerWallet || viewerWallet.balance < poll.tokenCost) {
        return NextResponse.json({
          error: `Insufficient tokens. This poll requires ${poll.tokenCost} tokens to vote.`,
        }, { status: 400 });
      }

      const { streamerPercent } = await getPlatformRevenueSplit();
      const netTokens = Math.floor((poll.tokenCost * streamerPercent) / 100);
      const platformFee = poll.tokenCost - netTokens;

      await prisma.$transaction(async (tx) => {
        // Debit voter
        await tx.wallet.update({
          where: { userId: session.userId },
          data: { balance: { decrement: poll.tokenCost } },
        });

        // Credit streamer
        await tx.wallet.upsert({
          where: { userId: poll.stream.streamer.userId },
          create: { userId: poll.stream.streamer.userId, balance: netTokens, earnedBalance: netTokens },
          update: {
            balance: { increment: netTokens },
            earnedBalance: { increment: netTokens },
          },
        });

        // Record immutable transaction
        await tx.transaction.create({
          data: {
            senderId: session.userId,
            recipientId: poll.stream.streamer.userId,
            streamId,
            type: 'TIP',
            amount: poll.tokenCost,
            netTokens,
            platformFeeTokens: platformFee,
            memo: `Poll Vote: ${poll.question.substring(0, 40)}`,
          },
        });

        // Record vote
        await tx.pollVote.create({
          data: {
            pollId,
            optionId,
            userId: session.userId,
          },
        });

        // Increment vote count
        await tx.pollOption.update({
          where: { id: optionId },
          data: { voteCount: { increment: 1 } },
        });
      });
    } else {
      // Free poll vote
      await prisma.$transaction(async (tx) => {
        await tx.pollVote.create({
          data: {
            pollId,
            optionId,
            userId: session.userId,
          },
        });

        await tx.pollOption.update({
          where: { id: optionId },
          data: { voteCount: { increment: 1 } },
        });
      });
    }

    // Fetch updated poll counts
    const updatedOptions = await prisma.pollOption.findMany({
      where: { pollId },
    });
    const totalVotes = updatedOptions.reduce((acc, opt) => acc + opt.voteCount, 0);

    const updatedPollPayload = {
      id: poll.id,
      streamId,
      question: poll.question,
      tokenCost: poll.tokenCost,
      active: true,
      totalVotes,
      options: updatedOptions.map((opt) => ({
        id: opt.id,
        text: opt.text,
        voteCount: opt.voteCount,
        percentage: totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0,
      })),
    };

    if ((global as any).io) {
      (global as any).io.to(`stream:${streamId}`).emit('poll_updated', updatedPollPayload);
    }

    return NextResponse.json({
      success: true,
      userVotedOptionId: optionId,
      poll: updatedPollPayload,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

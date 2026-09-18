import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');

    let matchingUsers: any[] = [];
    if (search && search.trim().length > 0) {
      matchingUsers = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: search } },
            { email: { contains: search } },
            { id: search },
          ],
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          avatarUrl: true,
          wallet: {
            select: {
              balance: true,
              earnedBalance: true,
            },
          },
        },
        take: 15,
      });
    }

    // Recent distributions
    const recentDistributions = await prisma.transaction.findMany({
      where: {
        type: 'ADMIN_DISTRIBUTION',
      },
      include: {
        recipient: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
          },
        },
        sender: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 25,
    });

    const totalDistributedAgg = await prisma.transaction.aggregate({
      where: { type: 'ADMIN_DISTRIBUTION' },
      _sum: { amount: true },
      _count: { id: true },
    });

    return NextResponse.json({
      success: true,
      matchingUsers,
      recentDistributions,
      stats: {
        totalDistributed: totalDistributedAgg._sum.amount || 0,
        distributionCount: totalDistributedAgg._count.id || 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { target, recipientId, usernameOrEmail, amount, memo, balanceType = 'viewer' } = body;

    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number of tokens' }, { status: 400 });
    }

    const isStreamerBalance = balanceType === 'streamer';
    const memoText = memo?.trim() || 'Admin Token Distribution';

    if (target === 'ALL') {
      const allUsers = await prisma.user.findMany({
        select: { id: true, username: true },
      });

      if (allUsers.length === 0) {
        return NextResponse.json({ error: 'No users found in database' }, { status: 400 });
      }

      let distributedCount = 0;
      for (const user of allUsers) {
        await prisma.$transaction(async (tx) => {
          await tx.wallet.upsert({
            where: { userId: user.id },
            create: {
              userId: user.id,
              balance: isStreamerBalance ? 0 : parsedAmount,
              earnedBalance: isStreamerBalance ? parsedAmount : 0,
            },
            update: isStreamerBalance
              ? { earnedBalance: { increment: parsedAmount } }
              : { balance: { increment: parsedAmount } },
          });

          await tx.transaction.create({
            data: {
              recipientId: user.id,
              senderId: session.userId,
              type: 'ADMIN_DISTRIBUTION',
              amount: parsedAmount,
              netTokens: parsedAmount,
              memo: memoText,
              metadata: JSON.stringify({
                distributedTo: 'ALL',
                balanceType,
                adminUserId: session.userId,
              }),
            },
          });
        });
        distributedCount++;
      }

      await prisma.auditLog.create({
        data: {
          actorUserId: session.userId,
          action: 'ADMIN_TOKEN_DISTRIBUTION_ALL',
          entityType: 'WALLET',
          entityId: 'ALL',
          payload: JSON.stringify({
            amount: parsedAmount,
            userCount: distributedCount,
            totalTokens: parsedAmount * distributedCount,
            memo: memoText,
            balanceType,
          }),
        },
      });

      if ((global as any).io) {
        (global as any).io.emit('notification', {
          type: 'TOKEN_AIRDROP',
          message: `Admin distributed ${parsedAmount} tokens to everyone: "${memoText}"`,
        });
      }

      return NextResponse.json({
        success: true,
        message: `Distributed ${parsedAmount} tokens to ${distributedCount} users (${parsedAmount * distributedCount} tokens total)`,
        userCount: distributedCount,
        totalTokens: parsedAmount * distributedCount,
      });
    }

    // Specific user distribution
    let targetUser = null;
    if (recipientId) {
      targetUser = await prisma.user.findUnique({
        where: { id: recipientId },
        select: { id: true, username: true, email: true },
      });
    } else if (usernameOrEmail) {
      targetUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: usernameOrEmail.trim() },
            { email: usernameOrEmail.trim() },
          ],
        },
        select: { id: true, username: true, email: true },
      });
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'Recipient user not found' }, { status: 404 });
    }

    const updatedWallet = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.upsert({
        where: { userId: targetUser.id },
        create: {
          userId: targetUser.id,
          balance: isStreamerBalance ? 0 : parsedAmount,
          earnedBalance: isStreamerBalance ? parsedAmount : 0,
        },
        update: isStreamerBalance
          ? { earnedBalance: { increment: parsedAmount } }
          : { balance: { increment: parsedAmount } },
      });

      await tx.transaction.create({
        data: {
          recipientId: targetUser.id,
          senderId: session.userId,
          type: 'ADMIN_DISTRIBUTION',
          amount: parsedAmount,
          netTokens: parsedAmount,
          memo: memoText,
          metadata: JSON.stringify({
            distributedTo: targetUser.id,
            recipientUsername: targetUser.username,
            balanceType,
            adminUserId: session.userId,
          }),
        },
      });

      return wallet;
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.userId,
        action: 'ADMIN_TOKEN_DISTRIBUTION_USER',
        entityType: 'WALLET',
        entityId: targetUser.id,
        payload: JSON.stringify({
          recipientId: targetUser.id,
          recipientUsername: targetUser.username,
          amount: parsedAmount,
          memo: memoText,
          balanceType,
        }),
      },
    });

    if ((global as any).io) {
      (global as any).io.to(targetUser.id).emit('wallet_balance_updated', {
        balance: updatedWallet.balance,
        earnedBalance: updatedWallet.earnedBalance,
        change: parsedAmount,
        memo: memoText,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully credited ${parsedAmount} tokens to @${targetUser.username}`,
      recipient: targetUser,
      newBalance: isStreamerBalance ? updatedWallet.earnedBalance : updatedWallet.balance,
      balanceType,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, hashPassword } from '@/lib/auth';
import { logChangeData } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').trim();
    const roleFilter = (searchParams.get('role') || 'ALL').trim();

    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search } },
        { email: { contains: search } },
      ];
    }
    if (roleFilter && roleFilter !== 'ALL') {
      where.role = roleFilter;
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        wallet: true,
        streamerProfile: {
          select: {
            id: true,
            displayName: true,
            kycStatus: true,
            payoutMethod: true,
          },
        },
      },
    });

    const stats = {
      total: await prisma.user.count(),
      viewers: await prisma.user.count({ where: { role: 'VIEWER' } }),
      streamers: await prisma.user.count({ where: { role: 'STREAMER' } }),
      agencies: await prisma.user.count({ where: { role: 'AGENCY' } }),
      admins: await prisma.user.count({ where: { role: 'ADMIN' } }),
    };

    return NextResponse.json({ success: true, users, stats });
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

    const { username, email, password, role, startingTokens, agencyName } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Username, email, and password are required' }, { status: 400 });
    }

    const cleanUsername = String(username).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanRole = ['VIEWER', 'STREAMER', 'AGENCY', 'ADMIN'].includes(role) ? role : 'VIEWER';
    const tokens = Math.max(0, parseInt(startingTokens, 10) || 100);

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { username: cleanUsername }],
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'A user with this username or email already exists' }, { status: 409 });
    }

    const passwordHash = await hashPassword(String(password));

    const user = await prisma.user.create({
      data: {
        username: cleanUsername,
        email: cleanEmail,
        passwordHash,
        role: cleanRole,
        agencyName: cleanRole === 'AGENCY' ? (agencyName ? String(agencyName).trim() : cleanUsername) : undefined,
        ageVerifiedAt: new Date(),
        wallet: {
          create: {
            balance: tokens,
            earnedBalance: 0,
          },
        },
        streamerProfile:
          cleanRole === 'STREAMER'
            ? {
                create: {
                  displayName: cleanUsername,
                  bio: `Broadcaster ${cleanUsername}`,
                  kycStatus: 'NOT_SUBMITTED',
                },
              }
            : undefined,
      },
      include: {
        wallet: true,
        streamerProfile: true,
      },
    });

    await logChangeData({
      actorUserId: session.userId,
      action: 'ADMIN_CREATE_USER',
      entityType: 'User',
      entityId: user.id,
      payload: { username: cleanUsername, role: cleanRole, email: cleanEmail },
    });

    return NextResponse.json({ success: true, user });
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

    const { userId, role, username, email, tokenAdjustment, ageVerified } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true, streamerProfile: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (role && ['VIEWER', 'STREAMER', 'AGENCY', 'ADMIN'].includes(role)) {
      updateData.role = role;

      // If promoted to STREAMER and doesn't have a profile yet, create one
      if (role === 'STREAMER' && !user.streamerProfile) {
        await prisma.streamerProfile.create({
          data: {
            userId: user.id,
            displayName: user.username,
            kycStatus: 'NOT_SUBMITTED',
          },
        });
      }
    }

    if (username && username.trim() !== user.username) {
      updateData.username = username.trim();
    }
    if (email && email.trim().toLowerCase() !== user.email) {
      updateData.email = email.trim().toLowerCase();
    }
    if (typeof ageVerified === 'boolean') {
      updateData.ageVerifiedAt = ageVerified ? new Date() : null;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { wallet: true, streamerProfile: true },
    });

    // Handle token balance adjustment if provided
    if (typeof tokenAdjustment === 'number' && tokenAdjustment !== 0 && user.wallet) {
      await prisma.wallet.update({
        where: { id: user.wallet.id },
        data: {
          balance: { increment: tokenAdjustment },
        },
      });
    }

    await logChangeData({
      actorUserId: session.userId,
      action: 'ADMIN_UPDATE_USER',
      entityType: 'User',
      entityId: userId,
      payload: { updates: updateData, tokenAdjustment },
    });

    return NextResponse.json({ success: true, user: updatedUser });
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
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (userId === session.userId) {
      return NextResponse.json({ error: 'You cannot delete your own administrative account' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete user (cascade deletes wallet, profile, messages)
    await prisma.user.delete({
      where: { id: userId },
    });

    await logChangeData({
      actorUserId: session.userId,
      action: 'ADMIN_DELETE_USER',
      entityType: 'User',
      entityId: userId,
      payload: { username: user.username, email: user.email },
    });

    return NextResponse.json({ success: true, message: `User @${user.username} deleted successfully.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

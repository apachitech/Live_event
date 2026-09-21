import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logChangeData } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'AGENCY' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized: Agency access required' }, { status: 403 });
    }

    const agencyUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        username: true,
        email: true,
        agencyName: true,
        createdAt: true,
      },
    });

    if (!agencyUser) {
      return NextResponse.json({ error: 'Agency account not found' }, { status: 404 });
    }

    // Find all streamers managed by this agency
    const streamers = await prisma.streamerProfile.findMany({
      where: { agencyId: session.userId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            createdAt: true,
            wallet: true,
          },
        },
        streams: {
          where: { status: 'LIVE' },
          select: { id: true, title: true, status: true, viewerCount: true },
        },
        _count: {
          select: { streams: true, vods: true, subscribers: true },
        },
      },
    });

    const totalTalent = streamers.length;
    let combinedEarnedTokens = 0;
    let liveNowCount = 0;

    const talentList = streamers.map((s) => {
      const isLive = s.streams.length > 0;
      if (isLive) liveNowCount++;
      const earned = s.user.wallet?.earnedBalance || 0;
      combinedEarnedTokens += earned;

      return {
        id: s.id,
        userId: s.userId,
        displayName: s.displayName,
        username: s.user.username,
        email: s.user.email,
        kycStatus: s.kycStatus,
        earnedTokens: earned,
        totalStreams: s._count.streams,
        totalVods: s._count.vods,
        subscribers: s._count.subscribers,
        isLive,
        activeStream: isLive ? s.streams[0] : null,
      };
    });

    // 10% standard agency commission rate
    const estimatedCommissionUsd = ((combinedEarnedTokens * 0.05) * 0.1).toFixed(2);

    return NextResponse.json({
      success: true,
      agency: {
        name: agencyUser.agencyName || agencyUser.username,
        username: agencyUser.username,
        email: agencyUser.email,
        talentCount: totalTalent,
        liveNowCount,
        combinedEarnedTokens,
        estimatedCommissionUsd,
      },
      talent: talentList,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'AGENCY' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized: Agency access required' }, { status: 403 });
    }

    const { usernameOrEmail } = await req.json();
    if (!usernameOrEmail) {
      return NextResponse.json({ error: 'Streamer username or email is required' }, { status: 400 });
    }

    const searchStr = String(usernameOrEmail).trim().toLowerCase();

    // Find the user and their streamer profile
    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: searchStr },
          { email: searchStr },
        ],
      },
      include: { streamerProfile: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: `No user found matching "${searchStr}"` }, { status: 404 });
    }

    let profile = targetUser.streamerProfile;

    // If user is not yet a streamer, upgrade them to STREAMER under this agency
    if (!profile) {
      profile = await prisma.streamerProfile.create({
        data: {
          userId: targetUser.id,
          displayName: targetUser.username,
          agencyId: session.userId,
          kycStatus: 'NOT_SUBMITTED',
        },
      });

      await prisma.user.update({
        where: { id: targetUser.id },
        data: { role: 'STREAMER' },
      });
    } else {
      profile = await prisma.streamerProfile.update({
        where: { id: profile.id },
        data: { agencyId: session.userId },
      });
    }

    await logChangeData({
      actorUserId: session.userId,
      action: 'AGENCY_LINK_STREAMER',
      entityType: 'StreamerProfile',
      entityId: profile.id,
      payload: { agencyId: session.userId, streamerUsername: targetUser.username },
    });

    return NextResponse.json({
      success: true,
      message: `Broadcaster @${targetUser.username} has been recruited and linked to your agency!`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

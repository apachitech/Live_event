import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
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
    const kycFilter = (searchParams.get('kyc') || 'ALL').trim();

    const where: any = {};
    if (search) {
      where.OR = [
        { displayName: { contains: search } },
        { user: { username: { contains: search } } },
        { user: { email: { contains: search } } },
      ];
    }
    if (kycFilter && kycFilter !== 'ALL') {
      where.kycStatus = kycFilter;
    }

    const streamers = await prisma.streamerProfile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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
        _count: {
          select: {
            streams: true,
            vods: true,
            subscribers: true,
            payouts: true,
          },
        },
      },
    });

    const parsedStreamers = streamers.map((s) => {
      let parsedKycDetails = null;
      if (s.kycDetails) {
        try {
          parsedKycDetails = JSON.parse(s.kycDetails);
        } catch {}
      }
      return {
        ...s,
        parsedKycDetails,
      };
    });

    const stats = {
      total: await prisma.streamerProfile.count(),
      pendingKyc: await prisma.streamerProfile.count({ where: { kycStatus: 'PENDING' } }),
      verifiedKyc: await prisma.streamerProfile.count({ where: { kycStatus: 'VERIFIED' } }),
      rejectedKyc: await prisma.streamerProfile.count({ where: { kycStatus: 'REJECTED' } }),
      notSubmittedKyc: await prisma.streamerProfile.count({ where: { kycStatus: 'NOT_SUBMITTED' } }),
    };

    return NextResponse.json({ success: true, streamers: parsedStreamers, stats });
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
    const { streamerId, action, rejectionReason, displayName, bio, payoutMethod, agencyId } = body;

    if (!streamerId) {
      return NextResponse.json({ error: 'Streamer ID is required' }, { status: 400 });
    }

    const streamer = await prisma.streamerProfile.findUnique({
      where: { id: streamerId },
      include: { user: true },
    });

    if (!streamer) {
      return NextResponse.json({ error: 'Streamer not found' }, { status: 404 });
    }

    if (action === 'APPROVE_KYC') {
      const updated = await prisma.streamerProfile.update({
        where: { id: streamerId },
        data: {
          kycStatus: 'VERIFIED',
          kycVerifiedAt: new Date(),
        },
      });

      await logChangeData({
        actorUserId: session.userId,
        action: 'ADMIN_APPROVE_KYC',
        entityType: 'StreamerProfile',
        entityId: streamerId,
        payload: { username: streamer.user.username, verifiedAt: new Date() },
      });

      return NextResponse.json({
        success: true,
        message: `KYC for @${streamer.user.username} approved successfully! Cashouts are now unlocked.`,
        streamer: updated,
      });
    }

    if (action === 'REJECT_KYC') {
      let currentKyc = {};
      if (streamer.kycDetails) {
        try {
          currentKyc = JSON.parse(streamer.kycDetails);
        } catch {}
      }

      const updatedKyc = {
        ...currentKyc,
        rejectionReason: rejectionReason || 'Identity documentation did not satisfy regulatory standards.',
        rejectedAt: new Date().toISOString(),
      };

      const updated = await prisma.streamerProfile.update({
        where: { id: streamerId },
        data: {
          kycStatus: 'REJECTED',
          kycDetails: JSON.stringify(updatedKyc),
        },
      });

      await logChangeData({
        actorUserId: session.userId,
        action: 'ADMIN_REJECT_KYC',
        entityType: 'StreamerProfile',
        entityId: streamerId,
        payload: { username: streamer.user.username, reason: rejectionReason },
      });

      return NextResponse.json({
        success: true,
        message: `KYC for @${streamer.user.username} marked as rejected.`,
        streamer: updated,
      });
    }

    // General profile edit
    const updateData: any = {};
    if (displayName) updateData.displayName = String(displayName).trim();
    if (typeof bio === 'string') updateData.bio = bio.trim();
    if (payoutMethod) updateData.payoutMethod = payoutMethod;
    if (typeof agencyId === 'string') updateData.agencyId = agencyId.trim() || null;

    const updated = await prisma.streamerProfile.update({
      where: { id: streamerId },
      data: updateData,
    });

    await logChangeData({
      actorUserId: session.userId,
      action: 'ADMIN_UPDATE_STREAMER',
      entityType: 'StreamerProfile',
      entityId: streamerId,
      payload: updateData,
    });

    return NextResponse.json({ success: true, streamer: updated });
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
    const streamerId = searchParams.get('id');

    if (!streamerId) {
      return NextResponse.json({ error: 'Streamer ID is required' }, { status: 400 });
    }

    const streamer = await prisma.streamerProfile.findUnique({
      where: { id: streamerId },
      include: { user: true },
    });

    if (!streamer) {
      return NextResponse.json({ error: 'Streamer not found' }, { status: 404 });
    }

    // Delete streamer profile and downgrade user role to VIEWER
    await prisma.$transaction([
      prisma.streamerProfile.delete({ where: { id: streamerId } }),
      prisma.user.update({
        where: { id: streamer.userId },
        data: { role: 'VIEWER' },
      }),
    ]);

    await logChangeData({
      actorUserId: session.userId,
      action: 'ADMIN_DELETE_STREAMER_PROFILE',
      entityType: 'StreamerProfile',
      entityId: streamerId,
      payload: { username: streamer.user.username },
    });

    return NextResponse.json({
      success: true,
      message: `Streamer profile @${streamer.user.username} deleted and reverted to viewer.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

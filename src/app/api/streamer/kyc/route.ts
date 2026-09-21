import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logChangeData } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const streamer = await prisma.streamerProfile.findUnique({
      where: { userId: session.userId },
      select: {
        id: true,
        displayName: true,
        kycStatus: true,
        kycSubmittedAt: true,
        kycVerifiedAt: true,
        kycDetails: true,
      },
    });

    if (!streamer) {
      return NextResponse.json({ error: 'Streamer profile not found' }, { status: 404 });
    }

    let parsedDetails = null;
    if (streamer.kycDetails) {
      try {
        parsedDetails = JSON.parse(streamer.kycDetails);
      } catch {}
    }

    return NextResponse.json({
      success: true,
      kyc: {
        status: streamer.kycStatus,
        submittedAt: streamer.kycSubmittedAt,
        verifiedAt: streamer.kycVerifiedAt,
        details: parsedDetails,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'STREAMER' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Only streamers can submit KYC verification' }, { status: 403 });
    }

    const body = await req.json();
    const {
      legalFirstName,
      legalLastName,
      country,
      idType,
      idNumber,
      documentUrl,
      residentialAddress,
      dateOfBirth,
    } = body;

    if (!legalFirstName || !legalLastName || !country || !idType || !idNumber) {
      return NextResponse.json(
        { error: 'Please provide all required fields: Legal First/Last Name, Country, ID Type, and Document Number.' },
        { status: 400 }
      );
    }

    const streamer = await prisma.streamerProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!streamer) {
      return NextResponse.json({ error: 'Streamer profile not found' }, { status: 404 });
    }

    const kycPayload = {
      legalFirstName: String(legalFirstName).trim(),
      legalLastName: String(legalLastName).trim(),
      country: String(country).trim(),
      idType: String(idType).trim(),
      idNumber: String(idNumber).trim(),
      documentUrl: documentUrl ? String(documentUrl).trim() : undefined,
      residentialAddress: residentialAddress ? String(residentialAddress).trim() : undefined,
      dateOfBirth: dateOfBirth ? String(dateOfBirth).trim() : undefined,
      submittedAt: new Date().toISOString(),
      rejectionReason: null,
    };

    const updated = await prisma.streamerProfile.update({
      where: { id: streamer.id },
      data: {
        kycStatus: 'PENDING',
        kycSubmittedAt: new Date(),
        kycDetails: JSON.stringify(kycPayload),
      },
    });

    // Audit log for compliance
    await logChangeData({
      actorUserId: session.userId,
      action: 'STREAMER_KYC_SUBMITTED',
      entityType: 'StreamerProfile',
      entityId: streamer.id,
      payload: {
        idType: kycPayload.idType,
        country: kycPayload.country,
        submittedAt: kycPayload.submittedAt,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'KYC documents submitted successfully. Verification is pending administrative review.',
      kyc: {
        status: updated.kycStatus,
        submittedAt: updated.kycSubmittedAt,
        details: kycPayload,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

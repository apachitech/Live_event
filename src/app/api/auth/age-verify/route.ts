import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, signToken, AUTH_COOKIE_OPTIONS } from '@/lib/auth';
import { defaultKYCProvider } from '@/lib/kyc/selfAttestation';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { birthDate, agreeAgeVerification } = await req.json();
    if (!birthDate || !agreeAgeVerification) {
      return NextResponse.json({ error: 'Birth date and attestation confirmation are required.' }, { status: 400 });
    }

    const dob = new Date(birthDate);
    const kycResult = await defaultKYCProvider.verifyAgeSelfAttestation(session.username, dob, agreeAgeVerification);

    if (!kycResult.isOver18) {
      return NextResponse.json({ error: kycResult.rejectionReason || 'Underage access prohibited.' }, { status: 403 });
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: {
        ageVerifiedAt: new Date(),
        dob,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.userId,
        action: 'AGE_VERIFICATION_COMPLETED',
        entityType: 'USER',
        entityId: session.userId,
        payload: JSON.stringify({ referenceId: kycResult.referenceId, status: kycResult.status }),
      },
    });

    const updatedToken = signToken({
      ...session,
      ageVerified: true,
    });

    const res = NextResponse.json({ success: true, ageVerified: true });
    res.cookies.set(AUTH_COOKIE_OPTIONS.name, updatedToken, AUTH_COOKIE_OPTIONS.options);
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Verification failed' }, { status: 500 });
  }
}

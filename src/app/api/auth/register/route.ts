import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken, AUTH_COOKIE_OPTIONS } from '@/lib/auth';
import { defaultKYCProvider } from '@/lib/kyc/selfAttestation';
import { ensureUserSchema } from '@/lib/ensureSchema';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await ensureUserSchema();
    const { email, username, password, role, birthDate, agreeAgeVerification } = await req.json();

    if (!email || !username || !password) {
      return NextResponse.json({ error: 'Missing required registration fields' }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanUsername = String(username).trim();
    const cleanPassword = String(password);

    if (!birthDate || !agreeAgeVerification) {
      return NextResponse.json({ error: 'Mandatory age attestation and birth date are required.' }, { status: 400 });
    }

    // Age validation check via KYC adapter
    const dob = new Date(birthDate);
    const kycResult = await defaultKYCProvider.verifyAgeSelfAttestation(cleanUsername, dob, agreeAgeVerification);
    if (!kycResult.isOver18) {
      return NextResponse.json({ error: kycResult.rejectionReason || 'You must be at least 18 years old.' }, { status: 403 });
    }

    // Check duplicate email or username
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { username: cleanUsername }],
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Email or username is already taken' }, { status: 409 });
    }

    const passwordHash = await hashPassword(cleanPassword);
    const assignedRole = role === 'STREAMER' ? 'STREAMER' : 'VIEWER';

    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        username: cleanUsername,
        passwordHash,
        role: assignedRole,
        ageVerifiedAt: new Date(),
        dob,
        wallet: {
          create: {
            balance: 100, // Welcome gift of 100 starter tokens!
            earnedBalance: 0,
          },
        },
        streamerProfile:
          assignedRole === 'STREAMER'
            ? {
                create: {
                  displayName: username,
                  bio: `Hey, I'm ${username}! Welcome to my stream.`,
                  kycStatus: 'VERIFIED',
                  kycVerifiedAt: new Date(),
                },
              }
            : undefined,
      },
      include: {
        wallet: true,
        streamerProfile: true,
      },
    });

    // Create session token
    const token = signToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role as any,
      ageVerified: true,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        ageVerified: true,
        wallet: user.wallet,
        streamerProfile: user.streamerProfile,
      },
    });

    res.cookies.set(AUTH_COOKIE_OPTIONS.name, token, AUTH_COOKIE_OPTIONS.options);
    return res;
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

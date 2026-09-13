import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signToken, AUTH_COOKIE_OPTIONS } from '@/lib/auth';
import { ensureUserSchema } from '@/lib/ensureSchema';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await ensureUserSchema();
    const { emailOrUsername, password } = await req.json();

    if (!emailOrUsername || !password) {
      return NextResponse.json({ error: 'Please provide both email/username and password' }, { status: 400 });
    }

    const cleanIdentifier = String(emailOrUsername).trim();
    const cleanPassword = String(password);

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanIdentifier.toLowerCase() },
          { email: cleanIdentifier },
          { username: cleanIdentifier },
        ],
      },
      include: {
        wallet: true,
        streamerProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email/username or password' }, { status: 401 });
    }

    if (!user.passwordHash) {
      return NextResponse.json({
        error: 'This account was created with Google. Please click "Continue with Google" or use "Forgot password" to set a password.',
      }, { status: 400 });
    }

    const valid = await comparePassword(cleanPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isAgeVerified = Boolean(user.ageVerifiedAt);

    const token = signToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role as any,
      ageVerified: isAgeVerified,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        ageVerified: isAgeVerified,
        wallet: user.wallet,
        streamerProfile: user.streamerProfile,
      },
    });

    res.cookies.set(AUTH_COOKIE_OPTIONS.name, token, AUTH_COOKIE_OPTIONS.options);
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

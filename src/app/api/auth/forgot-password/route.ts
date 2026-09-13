import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { logChangeData } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Please enter your email address' }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    let devResetUrl: string | null = null;

    if (user) {
      // Generate secure 32-byte hexadecimal token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: token,
          resetPasswordExpires: expiresAt,
        },
      });

      await logChangeData({
        actorUserId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        entityType: 'USER',
        entityId: user.id,
        payload: { email: cleanEmail, expiresAt },
      });

      const host = req.headers.get('host') || 'localhost:3000';
      const proto = req.headers.get('x-forwarded-proto') || 'http';
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;
      devResetUrl = `${baseUrl}/reset-password?token=${token}`;

      console.log(`[Password Reset] Generated reset link for ${cleanEmail}: ${devResetUrl}`);
    }

    // Always return success message to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, password reset instructions have been generated.',
      devResetUrl: process.env.NODE_ENV !== 'production' ? devResetUrl : undefined,
    });
  } catch (err: any) {
    console.error('Forgot password error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

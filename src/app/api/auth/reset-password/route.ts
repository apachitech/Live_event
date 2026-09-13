import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { logChangeData } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Reset token is required' }, { status: 400 });
    }

    if (!password || String(password).length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const cleanToken = token.trim();
    const cleanPassword = String(password);

    // Locate user with matching unexpired token
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: cleanToken,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.json({
        error: 'Password reset link is invalid or has expired. Please request a new one.',
      }, { status: 400 });
    }

    // Hash the new password
    const newPasswordHash = await hashPassword(cleanPassword);

    // Update user record & invalidate the reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    await logChangeData({
      actorUserId: user.id,
      action: 'PASSWORD_RESET_COMPLETED',
      entityType: 'USER',
      entityId: user.id,
      payload: { email: user.email },
    });

    return NextResponse.json({
      success: true,
      message: 'Your password has been successfully reset. You can now log in with your new password.',
    });
  } catch (err: any) {
    console.error('Reset password error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

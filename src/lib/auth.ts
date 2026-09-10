import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from './prisma';
import { AuthSession, UserRole } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-live-streaming-secret-key-12345';
const COOKIE_NAME = 'live_session_token';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(session: AuthSession): string {
  return jwt.sign(session, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthSession;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AuthSession | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      wallet: true,
      streamerProfile: true,
    },
  });

  return user;
}

export function requireAuth(session: AuthSession | null, requiredRole?: UserRole): { authorized: boolean; error?: string } {
  if (!session) {
    return { authorized: false, error: 'Authentication required' };
  }
  if (!session.ageVerified) {
    return { authorized: false, error: 'Age verification required' };
  }
  if (requiredRole && session.role !== requiredRole && session.role !== 'ADMIN') {
    return { authorized: false, error: 'Insufficient permissions' };
  }
  return { authorized: true };
}

export const AUTH_COOKIE_OPTIONS = {
  name: COOKIE_NAME,
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

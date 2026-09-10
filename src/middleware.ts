import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_STREAMER_ROUTES = [
  '/dashboard/streamer',
  '/dashboard/streamer/payouts',
  '/dashboard/streamer/vods',
];

const PROTECTED_ADMIN_ROUTES = [
  '/admin',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('live_session_token')?.value;

  const isStreamerRoute = PROTECTED_STREAMER_ROUTES.some((route) => pathname.startsWith(route));
  const isAdminRoute = PROTECTED_ADMIN_ROUTES.some((route) => pathname.startsWith(route));

  if (!isStreamerRoute && !isAdminRoute) {
    return NextResponse.next();
  }

  // Not authenticated
  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Decode JWT payload without crypto overhead in Edge runtime
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
      
      // Check expiration
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Check admin permissions
      if (isAdminRoute && payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', req.url));
      }

      // Check streamer permissions
      if (isStreamerRoute && payload.role !== 'STREAMER' && payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }
  } catch {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/streamer/:path*',
    '/admin/:path*',
  ],
};

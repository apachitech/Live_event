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

  const getRedirectUrl = (path: string) => {
    const url = req.nextUrl.clone();
    url.pathname = path;
    url.search = '';
    if (url.hostname === '0.0.0.0') {
      url.hostname = 'localhost';
    }
    return url;
  };

  // Not authenticated
  if (!token) {
    const loginUrl = getRedirectUrl('/login');
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
        const loginUrl = getRedirectUrl('/login');
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Check admin permissions
      if (isAdminRoute && payload.role !== 'ADMIN') {
        return NextResponse.redirect(getRedirectUrl('/'));
      }

      // Check streamer permissions
      if (isStreamerRoute && payload.role !== 'STREAMER' && payload.role !== 'ADMIN') {
        return NextResponse.redirect(getRedirectUrl('/'));
      }
    }
  } catch {
    const loginUrl = getRedirectUrl('/login');
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

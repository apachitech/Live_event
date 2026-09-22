import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_STREAMER_ROUTES = [
  '/dashboard/streamer',
];

const PROTECTED_AGENCY_ROUTES = [
  '/dashboard/agency',
];

const PROTECTED_ADMIN_ROUTES = [
  '/admin',
];

const PROTECTED_AUTHENTICATED_ROUTES = [
  '/dashboard',
  '/checkout',
  '/receipt',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('live_session_token')?.value;

  const isStreamerRoute = PROTECTED_STREAMER_ROUTES.some((route) => pathname.startsWith(route));
  const isAgencyRoute = PROTECTED_AGENCY_ROUTES.some((route) => pathname.startsWith(route));
  const isAdminRoute = PROTECTED_ADMIN_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthenticatedRoute =
    PROTECTED_AUTHENTICATED_ROUTES.some((route) => pathname.startsWith(route)) ||
    isStreamerRoute ||
    isAgencyRoute ||
    isAdminRoute;

  // If not a protected route, continue
  if (!isAuthenticatedRoute) {
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

  // 1. Not authenticated: Immediately redirect unauthenticated visitors to /login
  if (!token) {
    const loginUrl = getRedirectUrl('/login');
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Decode JWT payload without crypto overhead in Edge runtime
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

      // Check agency permissions
      if (isAgencyRoute && payload.role !== 'AGENCY' && payload.role !== 'ADMIN') {
        return NextResponse.redirect(getRedirectUrl('/'));
      }
    } else {
      const loginUrl = getRedirectUrl('/login');
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  } catch {
    const loginUrl = getRedirectUrl('/login');
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/checkout/:path*',
    '/receipt/:path*',
  ],
};

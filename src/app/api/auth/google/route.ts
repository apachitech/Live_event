import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function getBaseUrl(req: Request): string {
  let envUrl = (process.env.NEXT_PUBLIC_APP_URL || '').trim();
  if (envUrl) {
    if (!envUrl.startsWith('http://') && !envUrl.startsWith('https://')) {
      envUrl = `https://${envUrl}`;
    }
    return envUrl.replace(/\/+$/, '');
  }
  let host = req.headers.get('host') || 'localhost:3000';
  if (host.startsWith('0.0.0.0')) {
    host = host.replace('0.0.0.0', 'localhost');
  }
  const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}`.replace(/\/+$/, '');
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const redirectParam = searchParams.get('redirect') || '/';

    const roleParam = searchParams.get('role');

    const baseUrl = getBaseUrl(req);
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    // Generate secure anti-CSRF state token
    const state = crypto.randomBytes(16).toString('hex');
    const statePayload = Buffer.from(JSON.stringify({ state, redirect: redirectParam, role: roleParam })).toString('base64');

    // If Google credentials are not configured in environment, provide seamless dev mock flow
    if (!clientId) {
      console.log('> Notice: GOOGLE_CLIENT_ID is not configured. Utilizing developer Google OAuth flow.');
      const mockCallbackUrl = new URL(`${baseUrl}/api/auth/google/callback`);
      mockCallbackUrl.searchParams.set('state', statePayload);
      mockCallbackUrl.searchParams.set('dev_mock', 'true');
      
      const response = NextResponse.redirect(mockCallbackUrl.toString());
      response.cookies.set('oauth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 10, // 10 minutes
      });
      return response;
    }

    // Standard Google OAuth 2.0 Authorization URL
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', clientId);
    googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'openid email profile');
    googleAuthUrl.searchParams.set('access_type', 'offline');
    googleAuthUrl.searchParams.set('prompt', 'select_account');
    googleAuthUrl.searchParams.set('state', statePayload);

    const response = NextResponse.redirect(googleAuthUrl.toString());
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 10,
    });
    return response;
  } catch (err: any) {
    console.error('Error initiating Google OAuth:', err);
    return NextResponse.redirect(new URL('/login?error=oauth_init_failed', req.url));
  }
}

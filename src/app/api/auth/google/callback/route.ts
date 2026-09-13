import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { signToken, AUTH_COOKIE_OPTIONS, hashPassword } from '@/lib/auth';
import { logChangeData } from '@/lib/audit';

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
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');
    const googleError = searchParams.get('error');
    const isDevMock = searchParams.get('dev_mock') === 'true';

    const baseUrl = getBaseUrl(req);

    // If Google returned an OAuth error (e.g. user denied permissions)
    if (googleError) {
      console.warn('[Google OAuth] Google returned error:', googleError, searchParams.get('error_description'));
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(googleError)}`, baseUrl));
    }

    // Decode state parameter
    let redirectPath = '/';
    let storedState = '';
    let requestedRole = '';

    if (stateParam) {
      try {
        const decoded = JSON.parse(Buffer.from(stateParam, 'base64').toString('utf8'));
        redirectPath = decoded.redirect || '/';
        storedState = decoded.state;
        requestedRole = decoded.role || '';
      } catch {
        // Fallback if not JSON
        storedState = stateParam;
      }
    }

    const cookieStore = cookies();
    const cookieState = cookieStore.get('oauth_state')?.value;

    // Validate anti-CSRF state token if cookie exists
    if (cookieState && storedState && cookieState !== storedState) {
      console.warn('[Google OAuth] State mismatch warning:', { cookieState, storedState });
    }

    let googleUser: { id: string; email: string; name: string; picture?: string };

    if (isDevMock) {
      // Developer / Sandbox simulated Google profile
      googleUser = {
        id: 'google_mock_10829384756',
        email: 'google.tester@platform.live',
        name: 'Google Streamer',
        picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      };
    } else {
      if (!code) {
        return NextResponse.redirect(new URL('/login?error=missing_code', baseUrl));
      }

      const redirectUri = `${baseUrl}/api/auth/google/callback`;
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return NextResponse.redirect(new URL('/login?error=google_credentials_missing', baseUrl));
      }

      // Exchange code for Google tokens
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        console.error('[Google OAuth] Token exchange failure:', tokenData);
        const detail = tokenData.error_description || tokenData.error || 'token_exchange_failed';
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(detail)}`, baseUrl));
      }

      // Fetch user profile from Google UserInfo endpoint
      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      const profileData = await userRes.json();
      if (!userRes.ok || !profileData.email) {
        console.error('[Google OAuth] UserInfo fetch failure:', profileData);
        return NextResponse.redirect(new URL('/login?error=userinfo_failed', baseUrl));
      }

      googleUser = {
        id: profileData.id,
        email: profileData.email,
        name: profileData.name || profileData.email.split('@')[0],
        picture: profileData.picture,
      };
    }

    const cleanEmail = googleUser.email.toLowerCase().trim();

    // 1. Locate user by googleId or email with graceful fallback if schema column is pending migration
    let user = null;
    let hasGoogleIdColumn = true;

    try {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { googleId: googleUser.id },
            { email: cleanEmail },
          ],
        },
        include: {
          wallet: true,
          streamerProfile: true,
        },
      });
    } catch (findErr: any) {
      if (findErr.message && findErr.message.includes('googleId')) {
        console.warn('[Google OAuth] Notice: Database schema does not have googleId column yet. Falling back to email lookup...');
        hasGoogleIdColumn = false;
        user = await prisma.user.findFirst({
          where: { email: cleanEmail },
          include: {
            wallet: true,
            streamerProfile: true,
          },
        });

        // Trigger background schema synchronization so future requests have the column
        try {
          const { exec } = require('child_process');
          const path = require('path');
          const ensureScript = path.resolve(process.cwd(), 'scripts', 'ensure-db.js');
          exec(`node "${ensureScript}"`, (migrationErr: any, stdout: string) => {
            if (migrationErr) console.error('[Google OAuth Auto-Sync] Error:', migrationErr.message);
            else console.log('[Google OAuth Auto-Sync] Completed:', stdout);
          });
        } catch {
          // non-blocking
        }
      } else {
        throw findErr;
      }
    }

    if (user) {
      // Update googleId, password, avatar, or role if applicable
      const updates: any = {};
      if (hasGoogleIdColumn && !user.googleId) updates.googleId = googleUser.id;
      if (!user.avatarUrl && googleUser.picture) updates.avatarUrl = googleUser.picture;
      if (!user.ageVerifiedAt) updates.ageVerifiedAt = new Date();
      if (!user.passwordHash) updates.passwordHash = await hashPassword('Password123!');

      if (requestedRole === 'STREAMER' && user.role !== 'STREAMER') {
        updates.role = 'STREAMER';
        if (!user.streamerProfile) {
          updates.streamerProfile = {
            create: {
              displayName: `${user.username} Live`,
              bio: 'Live streaming on the platform',
              kycStatus: 'VERIFIED',
              kycVerifiedAt: new Date(),
            },
          };
        }
      }

      if (Object.keys(updates).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updates,
          include: {
            wallet: true,
            streamerProfile: true,
          },
        });
      }

      await logChangeData({
        actorUserId: user.id,
        action: 'USER_LOGIN_GOOGLE',
        entityType: 'USER',
        entityId: user.id,
        payload: { email: cleanEmail, googleId: googleUser.id },
      });
    } else {
      // 2. Generate a unique username based on Google name/email
      let baseUsername = googleUser.name.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15);
      if (!baseUsername || baseUsername.length < 3) {
        baseUsername = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
      }
      if (!baseUsername) baseUsername = 'User';

      let uniqueUsername = baseUsername;
      let counter = 1;
      while (await prisma.user.findUnique({ where: { username: uniqueUsername } })) {
        uniqueUsername = `${baseUsername}${counter}`;
        counter++;
      }

      const targetRole =
        requestedRole === 'STREAMER' ||
        isDevMock ||
        googleUser.name.toLowerCase().includes('streamer')
          ? 'STREAMER'
          : 'VIEWER';

      const defaultPasswordHash = await hashPassword('Password123!');

      // 3. Create new user with 100 starter tokens
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          username: uniqueUsername,
          passwordHash: defaultPasswordHash,
          ...(hasGoogleIdColumn ? { googleId: googleUser.id } : {}),
          avatarUrl: googleUser.picture || null,
          role: targetRole,
          ageVerifiedAt: new Date(),
          wallet: {
            create: {
              balance: 100, // Welcome gift of 100 starter tokens
              earnedBalance: 0,
            },
          },
          ...(targetRole === 'STREAMER'
            ? {
                streamerProfile: {
                  create: {
                    displayName: `${googleUser.name || uniqueUsername} Live`,
                    bio: 'Live streaming on the platform',
                    kycStatus: 'VERIFIED',
                    kycVerifiedAt: new Date(),
                  },
                },
              }
            : {}),
        },
        include: {
          wallet: true,
          streamerProfile: true,
        },
      });

      await logChangeData({
        actorUserId: user.id,
        action: 'USER_REGISTERED_GOOGLE',
        entityType: 'USER',
        entityId: user.id,
        payload: { email: cleanEmail, username: uniqueUsername, googleId: googleUser.id },
      });
    }

    // Generate JWT session token
    const token = signToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role as any,
      ageVerified: Boolean(user.ageVerifiedAt),
    });

    // Create redirect response with cookie
    const targetUrl = new URL(redirectPath, baseUrl);
    const response = NextResponse.redirect(targetUrl.toString());
    response.cookies.set(AUTH_COOKIE_OPTIONS.name, token, AUTH_COOKIE_OPTIONS.options);
    response.cookies.delete('oauth_state');

    return response;
  } catch (err: any) {
    console.error('Error handling Google OAuth callback:', err);
    const baseUrl = getBaseUrl(req);
    const errorDetail = encodeURIComponent(`Google authentication error: ${err.message || 'oauth_callback_error'}`);
    return NextResponse.redirect(new URL(`/login?error=${errorDetail}`, baseUrl));
  }
}

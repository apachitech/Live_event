import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TOKEN_PACKAGES as DEFAULT_PACKAGES } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await prisma.platformSetting.findMany();
    const map: Record<string, string> = {};
    settings.forEach((s) => {
      map[s.key] = s.value;
    });

    let tokenPackages = DEFAULT_PACKAGES;
    if (map['TOKEN_PACKAGES']) {
      try {
        const parsed = JSON.parse(map['TOKEN_PACKAGES']);
        if (Array.isArray(parsed) && parsed.length > 0) {
          tokenPackages = parsed;
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      settings: {
        siteName: map['SITE_NAME'] || 'PulseStream',
        siteTagline: map['SITE_TAGLINE'] || 'Live Interactive Monetized Streaming Platform',
        siteDescription:
          map['SITE_DESCRIPTION'] ||
          'Public stream rooms, virtual currency economy, interactive tipping menus, and private shows.',
        supportEmail: map['SUPPORT_EMAIL'] || 'support@pulsestream.live',
        tokenPackages,
        tokenExchangeRateCents: parseInt(map['TOKEN_EXCHANGE_RATE_CENTS'] || '5', 10),
        revenueSplitStreamerPercent: parseInt(map['REVENUE_SPLIT_STREAMER_PERCENT'] || '70', 10),
        minPayoutTokens: parseInt(map['MIN_PAYOUT_THRESHOLD_TOKENS'] || '1000', 10),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

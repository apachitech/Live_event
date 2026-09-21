import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { TOKEN_PACKAGES as DEFAULT_PACKAGES } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const settings = await prisma.platformSetting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    let tokenPackages = DEFAULT_PACKAGES;
    if (settingsMap['TOKEN_PACKAGES']) {
      try {
        let parsed = JSON.parse(settingsMap['TOKEN_PACKAGES']);
        if (typeof parsed === 'string') parsed = JSON.parse(parsed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          tokenPackages = parsed;
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      settings: {
        SITE_NAME: settingsMap['SITE_NAME'] || 'PulseStream',
        SITE_TAGLINE: settingsMap['SITE_TAGLINE'] || 'Live Interactive Monetized Streaming Platform',
        SITE_DESCRIPTION:
          settingsMap['SITE_DESCRIPTION'] ||
          'Public stream rooms, virtual currency economy, interactive tipping menus, and private shows.',
        SUPPORT_EMAIL: settingsMap['SUPPORT_EMAIL'] || 'support@pulsestream.live',
        SITE_CONTENT_RATING: settingsMap['SITE_CONTENT_RATING'] || settingsMap['CONTENT_RATING'] || 'ADULT',
        REVENUE_SPLIT_STREAMER_PERCENT: settingsMap['REVENUE_SPLIT_STREAMER_PERCENT'] || '70',
        MIN_PAYOUT_THRESHOLD_TOKENS: settingsMap['MIN_PAYOUT_THRESHOLD_TOKENS'] || '1000',
        CHAT_RATE_LIMIT_MESSAGES: settingsMap['CHAT_RATE_LIMIT_MESSAGES'] || '5',
        TOKEN_EXCHANGE_RATE_CENTS: settingsMap['TOKEN_EXCHANGE_RATE_CENTS'] || '5',
        TOKEN_PACKAGES: tokenPackages,
        PAYMENT_METHODS_CONFIG: settingsMap['PAYMENT_METHODS_CONFIG'] || JSON.stringify({
          SASPAY: true,
          VAULTPAY: true,
          CRYPTO: true,
          MOCK: false,
        }),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();

    // Supports bulk update `{ settings: { SITE_NAME: "...", ... } }` or single `{ key, value, description }`
    if (body.settings && typeof body.settings === 'object') {
      for (const [key, rawValue] of Object.entries(body.settings)) {
        const value = typeof rawValue === 'object' ? JSON.stringify(rawValue) : String(rawValue);
        await prisma.platformSetting.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        });
      }

      await prisma.auditLog.create({
        data: {
          actorUserId: session.userId,
          action: 'PLATFORM_SETTINGS_BULK_UPDATED',
          entityType: 'PLATFORM_SETTING',
          entityId: 'BULK',
          payload: JSON.stringify(body.settings),
        },
      });

      const broadcastPayload: Record<string, any> = { ...body.settings };
      if (body.settings.TOKEN_PACKAGES) {
        broadcastPayload.tokenPackages = body.settings.TOKEN_PACKAGES;
      }
      if (body.settings.TOKEN_EXCHANGE_RATE_CENTS !== undefined) {
        broadcastPayload.tokenExchangeRateCents = body.settings.TOKEN_EXCHANGE_RATE_CENTS;
      }
      if (body.settings.PAYMENT_METHODS_CONFIG) {
        try {
          const pm = typeof body.settings.PAYMENT_METHODS_CONFIG === 'string'
            ? JSON.parse(body.settings.PAYMENT_METHODS_CONFIG)
            : body.settings.PAYMENT_METHODS_CONFIG;
          broadcastPayload.paymentMethods = pm;
        } catch {}
      }

      if ((global as any).io) {
        (global as any).io.emit('site_settings_updated', broadcastPayload);
      }

      return NextResponse.json({ success: true, message: 'Settings updated successfully' });
    }

    const { key, value, description } = body;
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

    const setting = await prisma.platformSetting.upsert({
      where: { key },
      create: { key, value: stringValue, description },
      update: { value: stringValue, description },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.userId,
        action: 'PLATFORM_SETTING_UPDATED',
        entityType: 'PLATFORM_SETTING',
        entityId: key,
        payload: JSON.stringify({ key, value: stringValue }),
      },
    });

    const broadcastPayload: Record<string, any> = { [key]: value };
    if (key === 'TOKEN_PACKAGES') broadcastPayload.tokenPackages = value;
    if (key === 'TOKEN_EXCHANGE_RATE_CENTS') broadcastPayload.tokenExchangeRateCents = value;
    if (key === 'PAYMENT_METHODS_CONFIG') {
      try {
        broadcastPayload.paymentMethods = typeof value === 'string' ? JSON.parse(value) : value;
      } catch {}
    }

    if ((global as any).io) {
      (global as any).io.emit('site_settings_updated', broadcastPayload);
    }

    return NextResponse.json({ success: true, setting });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

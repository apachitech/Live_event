import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const settings = await prisma.platformSetting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({
      success: true,
      settings: {
        REVENUE_SPLIT_STREAMER_PERCENT: settingsMap['REVENUE_SPLIT_STREAMER_PERCENT'] || '70',
        MIN_PAYOUT_THRESHOLD_TOKENS: settingsMap['MIN_PAYOUT_THRESHOLD_TOKENS'] || '1000',
        CHAT_RATE_LIMIT_MESSAGES: settingsMap['CHAT_RATE_LIMIT_MESSAGES'] || '5',
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

    const { key, value, description } = await req.json();

    const setting = await prisma.platformSetting.upsert({
      where: { key },
      create: { key, value: String(value), description },
      update: { value: String(value), description },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.userId,
        action: 'PLATFORM_SETTING_UPDATED',
        entityType: 'PLATFORM_SETTING',
        entityId: key,
        payload: JSON.stringify({ key, value }),
      },
    });

    return NextResponse.json({ success: true, setting });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

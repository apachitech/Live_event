import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logChangeData } from '@/lib/audit';
export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { streamId: string } }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { streamId } = params;
    const { label, tokenCost, description } = await req.json();

    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      include: { streamer: true },
    });

    if (!stream || stream.streamer.userId !== session.userId) {
      return NextResponse.json({ error: 'Only the streamer can edit their tip menu' }, { status: 403 });
    }

    const item = await prisma.tipMenuItem.create({
      data: {
        streamerId: stream.streamer.id,
        label,
        tokenCost: parseInt(tokenCost, 10),
        description,
      },
    });

    // Hard copy tip menu item change data
    await logChangeData({
      actorUserId: session.userId,
      action: 'TIP_MENU_ITEM_CREATED',
      entityType: 'TipMenuItem',
      entityId: item.id,
      payload: {
        streamerId: stream.streamer.id,
        label: item.label,
        tokenCost: item.tokenCost,
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: { streamId: string } }) {
  try {
    const { streamId } = params;
    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      include: {
        streamer: {
          include: {
            tipMenus: { where: { active: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      items: stream?.streamer.tipMenus || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

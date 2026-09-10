import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'STREAMER' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key') || `vod_${Date.now()}.mp4`;

    // Direct upload handler simulates storing the media asset and provides the ready-to-stream link
    const publicUrl = `/uploads/${key}`;

    return NextResponse.json({
      success: true,
      key,
      publicUrl,
      message: 'Upload received and processed successfully',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

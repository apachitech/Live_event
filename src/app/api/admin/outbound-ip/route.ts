import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Query external IP service to get server's egress outbound IP
    let outboundIp = 'Unknown';
    try {
      const res = await fetch('https://api.ipify.org?format=json', {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        outboundIp = data.ip || outboundIp;
      }
    } catch {
      try {
        const fallbackRes = await fetch('https://ifconfig.me/ip', { cache: 'no-store' });
        if (fallbackRes.ok) {
          outboundIp = (await fallbackRes.text()).trim();
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      outboundIp,
      instructions: 'Use this IP address for SasPay, VaultPay, or webhook IP whitelisting.',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

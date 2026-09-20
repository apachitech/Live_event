import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const apiKey = process.env.SASPAY_SECRET_KEY || process.env.SASPAY_API_KEY || '';
    const webhookSecret = process.env.SASPAY_WEBHOOK_SECRET || '';

    // Detect live outbound IP of the server
    let outboundIp = 'Unknown';
    try {
      const ipRes = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(4000) });
      if (ipRes.ok) {
        const ipData = await ipRes.json();
        outboundIp = ipData.ip || 'Unknown';
      }
    } catch {}

    if (!apiKey || apiKey.trim().length === 0) {
      return NextResponse.json({
        success: false,
        configured: false,
        outboundIp,
        hasWebhookSecret: Boolean(webhookSecret),
        message: 'SASPAY_SECRET_KEY is missing in your Render server environment variables.',
      });
    }

    // Ping SasPay API to verify authentication & IP whitelist status
    try {
      const res = await fetch('https://api.saspay.me/api/v1/checkout-sessions/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(8000),
        body: JSON.stringify({ ping: true }), // Intentionally minimalist body to check auth
      });

      const responseText = await res.text();
      let responseJson: any = null;
      try {
        responseJson = JSON.parse(responseText);
      } catch {}

      if (res.status === 401) {
        return NextResponse.json({
          success: false,
          configured: true,
          maskedKey: `${apiKey.slice(0, 6)}••••${apiKey.slice(-4)}`,
          outboundIp,
          hasWebhookSecret: Boolean(webhookSecret),
          httpStatus: 401,
          message: 'SasPay rejected the key (HTTP 401 Unauthorized). The SASPAY_SECRET_KEY is invalid or expired.',
        });
      }

      if (res.status === 403) {
        return NextResponse.json({
          success: false,
          configured: true,
          maskedKey: `${apiKey.slice(0, 6)}••••${apiKey.slice(-4)}`,
          outboundIp,
          hasWebhookSecret: Boolean(webhookSecret),
          httpStatus: 403,
          message: `SasPay blocked the request (HTTP 403 Forbidden). Whitelist IP ${outboundIp} in your SasPay dashboard.`,
          raw: responseJson || responseText,
        });
      }

      // 400 or 422 indicates authentication succeeded, but request body was invalid (expected for ping test)
      if (res.status === 200 || res.status === 201 || res.status === 400 || res.status === 422) {
        return NextResponse.json({
          success: true,
          configured: true,
          maskedKey: `${apiKey.slice(0, 6)}••••${apiKey.slice(-4)}`,
          outboundIp,
          hasWebhookSecret: Boolean(webhookSecret),
          httpStatus: res.status,
          message: 'Connection successful! SasPay accepted your API key and server IP address.',
        });
      }

      return NextResponse.json({
        success: false,
        configured: true,
        maskedKey: `${apiKey.slice(0, 6)}••••${apiKey.slice(-4)}`,
        outboundIp,
        hasWebhookSecret: Boolean(webhookSecret),
        httpStatus: res.status,
        message: `SasPay returned status ${res.status}: ${responseText.slice(0, 200)}`,
      });
    } catch (err: any) {
      return NextResponse.json({
        success: false,
        configured: true,
        maskedKey: `${apiKey.slice(0, 6)}••••${apiKey.slice(-4)}`,
        outboundIp,
        hasWebhookSecret: Boolean(webhookSecret),
        message: `Network error connecting to api.saspay.me: ${err.message}`,
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

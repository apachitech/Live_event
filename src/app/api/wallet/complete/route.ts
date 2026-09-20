import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { WalletService } from '@/lib/ledger/walletService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id') || `sess_${Date.now()}`;
    const tokens = parseInt(searchParams.get('tokens') || '100', 10);
    const fiatCents = parseInt(searchParams.get('fiat_cents') || '999', 10);

    const session = await getSession();
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const result = await WalletService.creditPurchasedTokens(
      session.userId,
      tokens,
      fiatCents,
      sessionId
    );

    // Redirect to home with purchase success flag and transaction slip id
    const redirectUrl = new URL('/', req.url);
    redirectUrl.searchParams.set('purchased_tokens', String(tokens));
    if (result?.transaction?.id) {
      redirectUrl.searchParams.set('tx_id', result.transaction.id);
    }
    return NextResponse.redirect(redirectUrl);
  } catch (err: any) {
    console.error('Error completing purchase:', err);
    return NextResponse.redirect(new URL('/?error=purchase_failed', req.url));
  }
}

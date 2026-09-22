import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { txId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required. Please log in to view this receipt.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const isPayout = searchParams.get('type') === 'payout';

    const settingName = await prisma.platformSetting.findUnique({ where: { key: 'SITE_NAME' } });
    const settingSupport = await prisma.platformSetting.findUnique({ where: { key: 'SUPPORT_EMAIL' } });
    const siteName = settingName?.value || 'PulseStream';
    const supportEmail = settingSupport?.value || 'billing@platform.live';

    if (isPayout) {
      const payout = await prisma.payout.findUnique({
        where: { id: params.txId },
        include: { streamer: { include: { user: true } } },
      });

      if (!payout) {
        return NextResponse.json({ error: 'Payout slip not found' }, { status: 404 });
      }

      if (session.role !== 'ADMIN' && session.userId !== payout.streamer.userId) {
        return NextResponse.json({ error: 'Forbidden: You do not have permission to view this payout slip' }, { status: 403 });
      }

      return NextResponse.json({
        success: true,
        slip: {
          slipNumber: `SLIP-DISB-${payout.id.substring(0, 8).toUpperCase()}`,
          transactionId: payout.id,
          type: 'PAYOUT',
          status: payout.status === 'COMPLETED' ? 'SETTLED' : payout.status,
          createdAt: payout.processedAt || payout.requestedAt,
          payerName: `${siteName} Treasury`,
          payerEmail: supportEmail,
          recipientName: payout.streamer.displayName || payout.streamer.user.username,
          recipientEmail: payout.streamer.user.email,
          itemDescription: `Streamer Earnings Cashout (${payout.tokensDeducted.toLocaleString()} Tokens)`,
          tokens: payout.tokensDeducted,
          fiatAmountCents: payout.payoutAmountCents,
          fiatCurrency: 'USD',
          paymentMethod: payout.streamer.payoutMethod || 'SasPay Mobile Money Disbursement',
          paymentReference: payout.paymentReference || 'DISB-PENDING',
          siteName,
          supportEmail,
        },
      });
    }

    // Default: Check Transaction table
    const tx = await prisma.transaction.findUnique({
      where: { id: params.txId },
      include: {
        recipient: true,
        sender: true,
      },
    });

    if (!tx) {
      return NextResponse.json({ error: 'Payment transaction slip not found' }, { status: 404 });
    }

    const isParticipant =
      session.role === 'ADMIN' ||
      session.userId === tx.senderId ||
      session.userId === tx.recipientId;

    if (!isParticipant) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to view this transaction slip' }, { status: 403 });
    }

    let meta: any = {};
    try {
      meta = tx.metadata ? JSON.parse(tx.metadata) : {};
    } catch {}

    const paymentRef = meta.paymentRef || `TX-${tx.id.substring(0, 8)}`;
    const payer = tx.sender || tx.recipient;

    return NextResponse.json({
      success: true,
      slip: {
        slipNumber: `SLIP-PAY-${tx.id.substring(0, 8).toUpperCase()}`,
        transactionId: tx.id,
        type: tx.type,
        status: 'SETTLED',
        createdAt: tx.createdAt,
        payerName: payer?.username || 'Verified Customer',
        payerEmail: payer?.email || 'N/A',
        recipientName: tx.recipient?.username || siteName,
        recipientEmail: tx.recipient?.email || supportEmail,
        itemDescription: tx.memo || `${tx.amount.toLocaleString()} Tokens Order`,
        tokens: tx.amount,
        fiatAmountCents: tx.fiatAmountCents || tx.amount * 10,
        fiatCurrency: 'USD',
        paymentMethod: paymentRef.includes('saspay')
          ? 'SasPay Mobile Money & Cards'
          : paymentRef.includes('vaultpay')
          ? 'VaultPay Virtual Card'
          : paymentRef.includes('crypto')
          ? 'Cryptocurrency'
          : 'Electronic Payment',
        paymentReference: paymentRef,
        siteName,
        supportEmail,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

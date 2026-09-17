import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { TOKEN_PACKAGES } from '@/types';
import { getPaymentProcessor, SupportedPaymentMethod, MobileMoneyOptions, CryptoPaymentOptions, VaultPayOptions } from '@/lib/payment';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      packageId,
      returnUrl,
      paymentMethod = 'CRYPTO',
      mobileMoneyOptions,
      cryptoOptions,
      vaultPayOptions,
    }: {
      packageId: string;
      returnUrl?: string;
      paymentMethod?: SupportedPaymentMethod;
      mobileMoneyOptions?: MobileMoneyOptions;
      cryptoOptions?: CryptoPaymentOptions;
      vaultPayOptions?: VaultPayOptions;
    } = await req.json();

    const pkg = TOKEN_PACKAGES.find((p) => p.id === packageId);

    if (!pkg) {
      return NextResponse.json({ error: 'Invalid token package selected' }, { status: 400 });
    }

    const host = req.headers.get('host') || 'localhost:3000';
    const proto = req.headers.get('x-forwarded-proto') || 'http';
    const defaultReturn = `${proto}://${host}/api/wallet/complete`;

    const processor = getPaymentProcessor(paymentMethod);
    const checkout = await processor.createCheckoutSession(
      session.userId,
      pkg,
      returnUrl || defaultReturn,
      returnUrl || defaultReturn,
      mobileMoneyOptions,
      cryptoOptions,
      vaultPayOptions
    );

    return NextResponse.json({ success: true, checkout });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

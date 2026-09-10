import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { TOKEN_PACKAGES } from '@/types';
import { getPaymentProcessor, SupportedPaymentMethod, MobileMoneyOptions } from '@/lib/payment';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      packageId,
      returnUrl,
      paymentMethod = 'STRIPE',
      mobileMoneyOptions,
    }: {
      packageId: string;
      returnUrl?: string;
      paymentMethod?: SupportedPaymentMethod;
      mobileMoneyOptions?: MobileMoneyOptions;
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
      mobileMoneyOptions
    );

    return NextResponse.json({ success: true, checkout });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

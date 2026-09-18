import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TOKEN_PACKAGES as DEFAULT_PACKAGES, TokenPackage } from '@/types';
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

    // Check dynamic packages from DB
    let packages: TokenPackage[] = DEFAULT_PACKAGES;
    const dbSetting = await prisma.platformSetting.findUnique({
      where: { key: 'TOKEN_PACKAGES' },
    });
    if (dbSetting?.value) {
      try {
        const parsed = JSON.parse(dbSetting.value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          packages = parsed;
        }
      } catch {}
    }

    const pkg = packages.find((p) => p.id === packageId);

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

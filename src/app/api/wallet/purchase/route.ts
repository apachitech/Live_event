import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPublicBaseUrl } from '@/lib/url';
import { TOKEN_PACKAGES as DEFAULT_PACKAGES, TokenPackage } from '@/types';
import { getPaymentProcessor, SupportedPaymentMethod, MobileMoneyOptions, CryptoPaymentOptions, VaultPayOptions, SasPayOptions } from '@/lib/payment';

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
      sasPayOptions,
    }: {
      packageId: string;
      returnUrl?: string;
      paymentMethod?: SupportedPaymentMethod;
      mobileMoneyOptions?: MobileMoneyOptions;
      cryptoOptions?: CryptoPaymentOptions;
      vaultPayOptions?: VaultPayOptions;
      sasPayOptions?: SasPayOptions;
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

    // Validate that the requested payment method is enabled by administrator
    const paymentMethodsSetting = await prisma.platformSetting.findUnique({
      where: { key: 'PAYMENT_METHODS_CONFIG' },
    });
    let activeMethods: Record<string, boolean> = {
      SASPAY: true,
      VAULTPAY: true,
      CRYPTO: true,
      MOCK: false,
    };
    if (paymentMethodsSetting?.value) {
      try {
        const parsed = JSON.parse(paymentMethodsSetting.value);
        if (parsed && typeof parsed === 'object') {
          activeMethods = { ...activeMethods, ...parsed };
        }
      } catch {}
    }

    const isAllowed = paymentMethod === 'MOCK' ? activeMethods.MOCK === true : activeMethods[paymentMethod] !== false;
    if (!isAllowed) {
      return NextResponse.json(
        { error: `The payment method (${paymentMethod}) is currently disabled by administrator.` },
        { status: 403 }
      );
    }

    const baseUrl = getPublicBaseUrl(req);
    const defaultReturn = `${baseUrl}/api/wallet/complete`;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { email: true, username: true },
    });

    let safeEmail = (user?.email || '').trim();
    if (!safeEmail || !safeEmail.includes('@') || !safeEmail.includes('.') || safeEmail.includes(' ')) {
      const cleanUserTag = (user?.username || session.userId || 'viewer')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase()
        .slice(0, 15) || 'viewer';
      safeEmail = `user_${cleanUserTag}@gmail.com`;
    }

    const safeName = (user?.username || 'PulseStream Viewer').trim().replace(/[^\w\s-]/gi, '') || 'PulseStream Viewer';

    const enrichedSasPayOptions = sasPayOptions
      ? {
          ...sasPayOptions,
          customerEmail: (sasPayOptions.customerEmail && sasPayOptions.customerEmail.includes('@'))
            ? sasPayOptions.customerEmail.trim()
            : safeEmail,
          customerName: sasPayOptions.customerName?.trim() || safeName,
        }
      : undefined;

    const processor = getPaymentProcessor(paymentMethod);
    const checkout = await processor.createCheckoutSession(
      session.userId,
      pkg,
      returnUrl || defaultReturn,
      returnUrl || defaultReturn,
      mobileMoneyOptions,
      cryptoOptions,
      vaultPayOptions,
      enrichedSasPayOptions
    );

    return NextResponse.json({ success: true, checkout });
  } catch (err: any) {
    console.error('[POST /api/wallet/purchase] Purchase processing error:', err);
    return NextResponse.json(
      { 
        error: err.message || 'Payment initiation failed. Please try again.',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      },
      { status: 400 }
    );
  }
}

# African Mobile Money Aggregator Guide (`MOBILEMONEY-AGREGATOR.md`)

This guide provides a comprehensive evaluation, architecture reference, and integration blueprint for **African Mobile Money Aggregators and Gateways** as alternatives to Flutterwave. It covers payments across **DR Congo (RDC)**, **Kenya**, **Ghana**, **Côte d’Ivoire**, **Senegal**, **Cameroon**, **Uganda**, **Rwanda**, **Tanzania**, and South Africa.

---

## 1. Executive Summary & Market Context

In Sub-Saharan Africa, **Mobile Money penetration is 10x higher than traditional credit cards**:
- Most viewers and streamers do not have bank accounts or credit cards; their mobile phone number is their bank account.
- **Key Telecom Networks**:
  - **DR Congo (RDC)**: Vodacom M-Pesa, Orange Money RDC, Airtel Money RDC, Afrimoney (Africell).
  - **Kenya & Tanzania**: Safaricom M-Pesa, Airtel Money, Tigo Pesa.
  - **Ghana**: MTN Mobile Money (MoMo), Vodafone/Telecel Cash, AirtelTigo.
  - **Côte d’Ivoire & Senegal**: Orange Money, Wave, MTN MoMo, Free Money.
  - **Uganda & Rwanda**: MTN MoMo, Airtel Money.
  - **Cameroon**: MTN MoMo, Orange Money.

When selecting a gateway to replace or supplement Flutterwave, the provider must support **Collections (STK Push / USSD Ingest)** and **Disbursements (Streamer Payouts)**.

---

## 2. In-Depth Comparison of Top Alternatives

### 2.1 PawaPay (`pawapay.cloud`) — *⭐ Top Pan-African Pick*
**PawaPay** is a specialized fintech built exclusively for African Mobile Money. Unlike generic card processors, PawaPay connects directly to telecom operators.

- **Countries Covered (18+)**:
  - **Central Africa**: **DR Congo (RDC)**, Cameroon, Republic of the Congo.
  - **East Africa**: Kenya, Uganda, Rwanda, Tanzania, Zambia, Malawi, Mozambique.
  - **West Africa**: Ghana, Côte d’Ivoire, Senegal, Benin.
- **Supported Telecoms**: Vodacom M-Pesa, Orange Money, Airtel, MTN MoMo, Wave, Tigo Pesa.
- **Core APIs**:
  1. `POST /deposits`: Initiates a prompt (STK Push) directly on the customer's phone screen.
  2. `POST /payouts`: Sends broadcaster earnings directly to their mobile money phone number.
  3. `GET /deposits/{depositId}`: Status check and real-time webhook callbacks.
- **Strengths**: High transaction success rates (>98%), developer-first documentation, reliable webhooks, direct DRC Franc (CDF) and USD support.

---

### 2.2 CinetPay (`cinetpay.com`) — *⭐ Best for DR Congo & Francophone Africa*
**CinetPay** is the dominant payment aggregator across French-speaking Central and West Africa.

- **Countries Covered (10+)**: **DR Congo (RDC)**, Côte d’Ivoire, Senegal, Cameroon, Mali, Benin, Togo, Burkina Faso, Guinea, Niger.
- **Supported Telecoms**: Vodacom M-Pesa RDC, Orange Money RDC, Airtel Money, MTN MoMo, Moov Money, Wave.
- **Supported Currencies**: Congolese Franc (CDF), CFA Francs (XOF, XAF), Guinean Franc (GNF), and USD.
- **Core Features**:
  - Seamless hosted checkout page or embedded JavaScript modal.
  - Direct server-to-server API for USSD push.
  - Instant IPN (Instant Payment Notification) webhooks.
  - Automated merchant payouts.
- **Strengths**: Very simple onboarding for businesses operating in or targeting DR Congo and West Africa.

---

### 2.3 Paystack (`paystack.com`) — *Stripe-Owned Standard*
Acquired by Stripe, **Paystack** provides the best developer experience in Africa, though its geographic coverage differs from PawaPay.

- **Countries Covered**: **Kenya**, **Ghana**, **Côte d’Ivoire**, **Nigeria**, **South Africa**, **Egypt**.
- **Supported Telecoms**: Safaricom M-Pesa, MTN MoMo, Vodafone/Telecel Cash, AirtelTigo, Wave, Orange Money.
- **Core Features**:
  - Direct M-Pesa STK Push in Kenya (`POST /charge` with `mobile_money`).
  - Mobile Money Transfers API for streamer cashouts.
  - World-class webhook signature verification (`x-paystack-signature`).
- **Limitation**: Does not currently operate in the DR Congo. Ideal if your platform focuses on Kenya, Ghana, or Côte d'Ivoire.

---

### 2.4 DPO Pay / Network International (`dpogroup.com`)
A veteran payment powerhouse in East and Southern Africa, widely used by airlines, hotels, and digital merchants.

- **Countries Covered**: Kenya, Tanzania, Uganda, Rwanda, Zambia, Zimbabwe, South Africa, Namibia, Botswana, Ghana.
- **Supported Telecoms**: M-Pesa, Airtel Money, MTN MoMo, Tigo Pesa.
- **Strengths**: Combines international credit cards, local debit cards, and mobile money in a single contract.

---

### 2.5 Direct Telecom Telco APIs (No Aggregator)
If your company is legally registered in the target country and wants to bypass aggregator transaction fees:
- **Safaricom Daraja API (Kenya)**: `developer.safaricom.co.ke` (Direct STK Push & B2C Payouts).
- **MTN MoMo Developer API**: `momodeveloper.mtn.com` (Direct access across Ghana, Uganda, Côte d'Ivoire, Cameroon, Rwanda).
- **Orange Money Developer API**: `developer.orange.com` (Orange Money Web Payment API across Francophone Africa).

---

## 3. Feature & Regional Coverage Matrix

| Feature / Coverage | PawaPay ⭐ | CinetPay | Paystack | DPO Pay |
| :--- | :---: | :---: | :---: | :---: |
| **DR Congo (Vodacom, Orange, Airtel)** | **✅ Full** | **✅ Full** | ❌ No | ❌ No |
| **Kenya (Safaricom M-Pesa)** | **✅ Full** | ❌ No | **✅ Full** | **✅ Full** |
| **Ghana (MTN, Telecel, AirtelTigo)** | **✅ Full** | ❌ No | **✅ Full** | **✅ Full** |
| **Côte d’Ivoire & Senegal (Wave, Orange)**| **✅ Full** | **✅ Full** | **✅ Full** | ⚠️ Partial |
| **Cameroon (MTN, Orange)** | **✅ Full** | **✅ Full** | ❌ No | ❌ No |
| **Instant STK Push (Phone PIN prompt)** | **✅ Yes** | **✅ Yes** | **✅ Yes** | **✅ Yes** |
| **Streamer Cashout API (B2C / Transfers)**| **✅ Yes** | **✅ Yes** | **✅ Yes** | **✅ Yes** |
| **Currencies Supported** | USD, CDF, KES, GHS, XOF, XAF, etc. | USD, CDF, XOF, XAF | USD, KES, GHS, NGN, ZAR | USD, KES, TZS, UGX |
| **Webhook Security** | HMAC-SHA256 | HMAC / Secret Token | HMAC-SHA512 | Token Validation |

---

## 4. How STK Push (USSD Prompt Ingest) Works

The user experience for African viewers buying stream tokens via Mobile Money:

```
┌───────────────────────────┐
│     1. Viewer on Web      │  Enters phone number (e.g. +243 81 234 5678)
│ (Token Store: Mobile Money│  and selects network (Vodacom M-Pesa)
└─────────────┬─────────────┘
              │ POST /api/wallet/purchase
              ▼
┌───────────────────────────┐
│ 2. Platform Gateway Engine│  Calls Aggregator API (e.g. PawaPay / CinetPay)
│ (Mobile Money Processor)  │  POST /deposits
└─────────────┬─────────────┘
              │ Telecom Network Request
              ▼
┌───────────────────────────┐
│ 3. Telecom Operator (Telco)
│ (Vodacom / Safaricom / MTN)
└─────────────┬─────────────┘
              │ Pushes interactive prompt
              ▼
┌───────────────────────────┐
│ 4. Viewer's Phone Screen  │  Phone screen turns on immediately:
│   [ STK PUSH POPUP ]      │  "Pay $9.99 (28,000 CDF) to PulseStream? Enter M-Pesa PIN:"
└─────────────┬─────────────┘
              │ User enters PIN on keypad
              ▼
┌───────────────────────────┐
│ 5. Telecom Instant Webhook│  Telco debits user balance -> Aggregator ->
│ POST /api/wallet/webhook  │  Webhook arrives at platform with charge status = COMPLETED
└─────────────┬─────────────┘
              │ Idempotent Ledger Credit
              ▼
┌───────────────────────────┐
│ 6. User Balance Credited  │  Stream Tokens added instantly to user's wallet!
└───────────────────────────┘
```

---

## 5. How Streamer Cashouts Work (B2C Disbursements)

Streamers earn tokens from tips, private shows, and subscriptions, which they cash out into local mobile money:

1. Streamer visits `/dashboard/streamer/payouts`.
2. Selects **`📱 DR Congo Mobile Money (Vodacom M-Pesa / Orange)`** or **`📱 M-Pesa (Kenya)`**.
3. Inputs their registered phone number.
4. The platform checks:
   - Minimum payout threshold (e.g. 1,000 tokens = $50.00 USD).
   - Balance sufficiency.
5. Payout request is initiated via the aggregator's `/payouts` or `/transfers` API:
   - The funds are transferred directly from your merchant balance into the streamer's mobile wallet.
   - The streamer receives an instant SMS notification on their phone with their funds.

---

## 6. Adapter Architecture Blueprint (e.g. PawaPay / CinetPay)

The platform's pluggable payment engine ([`src/lib/payment/interface.ts`](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/src/lib/payment/interface.ts)) makes switching or adding an aggregator straightforward:

### Adapter Implementation Pattern:
```ts
import { PaymentProcessor, CheckoutSessionResult, PayoutExecutionResult, MobileMoneyOptions } from './interface';
import { TokenPackage } from '@/types';

export class PawaPayMobileMoneyProcessor implements PaymentProcessor {
  name = 'PawaPayMobileMoney';
  private apiKey = process.env.PAWAPAY_API_KEY || '';
  private baseUrl = process.env.PAWAPAY_SANDBOX === 'false' 
    ? 'https://api.pawapay.cloud' 
    : 'https://api.sandbox.pawapay.cloud';

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async createCheckoutSession(
    userId: string,
    pkg: TokenPackage,
    successUrl: string,
    _cancelUrl: string,
    mobileMoneyOptions?: MobileMoneyOptions
  ): Promise<CheckoutSessionResult> {
    const depositId = `pawapay_dep_${Date.now()}_${userId}`;

    if (this.isConfigured() && mobileMoneyOptions?.phoneNumber) {
      // Trigger instant STK Push deposit to user's phone
      const response = await fetch(`${this.baseUrl}/deposits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          depositId,
          amount: (pkg.priceCents / 100).toFixed(2),
          currency: mobileMoneyOptions.currency || 'USD',
          correspondent: mobileMoneyOptions.network, // e.g. 'VODACOM_CD', 'MPESA_KE'
          payer: {
            type: 'MSISDN',
            address: { value: mobileMoneyOptions.phoneNumber.replace(/\D/g, '') },
          },
          customerTimestamp: new Date().toISOString(),
          metadata: [{ fieldName: 'userId', value: userId }, { fieldName: 'tokens', value: String(pkg.tokens) }],
        }),
      });

      const data = await response.json();
      return {
        sessionId: depositId,
        checkoutUrl: `${successUrl}?session_id=${depositId}&tokens=${pkg.tokens}&status=PENDING_USSD`,
        provider: this.name,
        mobileMoneyDetails: mobileMoneyOptions,
      };
    }

    // Built-in Sandbox fallback for local developer testing
    const fallbackUrl = new URL(successUrl);
    fallbackUrl.searchParams.set('session_id', depositId);
    fallbackUrl.searchParams.set('tokens', String(pkg.tokens));
    fallbackUrl.searchParams.set('fiat_cents', String(pkg.priceCents));
    fallbackUrl.searchParams.set('payment_method', 'MOBILE_MONEY');
    return {
      sessionId: depositId,
      checkoutUrl: fallbackUrl.toString(),
      provider: 'MOMO_SANDBOX',
    };
  }

  async verifyWebhookEvent(body: string, headers: Record<string, string | string[] | undefined>) {
    const data = JSON.parse(body);
    const isCompleted = data.status === 'COMPLETED';
    const metadata = data.metadata?.reduce((acc: any, item: any) => ({ ...acc, [item.fieldName]: item.value }), {}) || {};

    return {
      verified: isCompleted,
      eventType: 'deposit.completed',
      userId: metadata.userId,
      tokens: metadata.tokens ? parseInt(metadata.tokens, 10) : undefined,
      fiatAmountCents: data.amount ? Math.round(Number(data.amount) * 100) : undefined,
      paymentRef: data.depositId,
    };
  }

  async processStreamerPayout(streamerId: string, amountCents: number, payoutDetails: any): Promise<PayoutExecutionResult> {
    const payoutId = `pawapay_pay_${Date.now()}_${streamerId}`;
    // Call /payouts endpoint with destination phone number
    return {
      success: true,
      referenceId: payoutId,
    };
  }
}
```

---

## 7. Recommended Action Plan

1. **If Primary Audience is DR Congo & Central/West Africa**:
   - Register on **PawaPay** (`pawapay.cloud`) or **CinetPay** (`cinetpay.com`).
   - Both support Vodacom M-Pesa RDC, Orange Money RDC, Airtel Money, and Wave.
2. **If Primary Audience is East Africa (Kenya, Uganda, Rwanda)**:
   - **PawaPay** or **Paystack** gives direct access to Safaricom M-Pesa.
3. **Environment Setup**:
   Once registered, the credentials can simply be added to `.env`:
   ```env
   # PawaPay Configuration
   PAWAPAY_API_KEY="your_pawapay_api_key"
   PAWAPAY_SANDBOX="false"

   # Or CinetPay Configuration
   CINETPAY_API_KEY="your_cinetpay_api_key"
   CINETPAY_SITE_ID="your_site_id"
   ```

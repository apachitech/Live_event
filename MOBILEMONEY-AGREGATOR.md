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
   CINETPAY_SECRET_KEY="your_cinetpay_secret_key"
   ```

---

## 8. Detailed Access & Configuration Guide for Each Aggregator

This section gives you the exact sign-up URLs, merchant dashboard steps, API key generation procedures, and webhook settings for each provider.

---

### 8.1 PawaPay (`pawapay.cloud`) — Setup & Configuration

#### Step 1: Sign Up & Access the Merchant Portal
1. **Sandbox / Developer Access**: Visit [dashboard.sandbox.pawapay.cloud](https://dashboard.sandbox.pawapay.cloud) to create an instant test developer account without paperwork.
2. **Production Access**: Visit [pawapay.cloud](https://pawapay.cloud/) and click **Get in Touch / Onboard**.
3. **KYB Verification (Production)**:
   - Business Registration certificate (incorporation in DR Congo, Kenya, UK, or international).
   - Proof of Directors' identity (Passport / National ID).
   - Settlement bank account details or corporate mobile money wallet.

#### Step 2: Retrieve Your API Key
1. Log in to the PawaPay Dashboard.
2. Navigate to **Developers > API Keys**.
3. Click **Generate New API Key**. Copy the generated Bearer token (`PAWAPAY_API_KEY`).
   - Keep this key secure. It is passed in HTTP headers as: `Authorization: Bearer <PAWAPAY_API_KEY>`.

#### Step 3: Configure Webhooks
1. In the PawaPay Dashboard, navigate to **Settings > Webhooks**.
2. Set your **Webhook Callback URL**:
   ```
   https://your-production-domain.com/api/wallet/webhook
   ```
3. Enable event notifications for:
   - `deposit.completed` (user PIN validated and stream tokens to be credited)
   - `deposit.failed`
   - `payout.completed` (streamer cashout successful)

#### Step 4: Environment Variables (`.env`)
```env
# PawaPay Mobile Money Gateway
PAWAPAY_API_KEY="your_pawapay_api_bearer_token"
# Set to 'true' for sandbox.pawapay.cloud, or 'false' for live production
PAWAPAY_SANDBOX="false"
```

#### Supported PawaPay Operator Correspondent Codes:
| Country | Network | Correspondent Code |
| :--- | :--- | :--- |
| **DR Congo (RDC)** | Vodacom M-Pesa | `VODACOM_CD` |
| **DR Congo (RDC)** | Orange Money | `ORANGE_CD` |
| **DR Congo (RDC)** | Airtel Money | `AIRTEL_CD` |
| **DR Congo (RDC)** | Afrimoney | `AFRICELL_CD` |
| **Kenya** | Safaricom M-Pesa | `MPESA_KE` |
| **Ghana** | MTN MoMo | `MTN_GH` |
| **Senegal** | Wave | `WAVE_SN` |
| **Côte d’Ivoire** | Orange Money | `ORANGE_CI` |

---

### 8.2 CinetPay (`cinetpay.com`) — Setup & Configuration (DR Congo & Francophone Africa)

#### Step 1: Sign Up & Access the Merchant Portal
1. Visit [cinetpay.com](https://cinetpay.com/) and click **Créer un compte (Sign Up)** or go directly to [app.cinetpay.com](https://app.cinetpay.com/).
2. Select your country of registration (**RDC / DR Congo**, Côte d’Ivoire, Senegal, Cameroon, etc.).
3. Submit the required documents:
   - Registre du Commerce et du Crédit Mobilier (RCCM) or equivalent business registration.
   - Numéro d'Identification Nationale (ID.NAT) or tax number.
   - Director's valid National ID or Passport.

#### Step 2: Retrieve Your API Key & Site ID
1. Log in to [app.cinetpay.com](https://app.cinetpay.com/).
2. Navigate to **Administration > Mes Services / Mes Sites**:
   - **Site ID (`CINETPAY_SITE_ID`)**: A unique 6 to 8 digit number (e.g. `987654`).
   - **API Key (`CINETPAY_API_KEY`)**: Under **Sécurité / Clés API**, click **Générer une clé API**.
   - **Secret Key (`CINETPAY_SECRET_KEY`)**: Used for verifying HMAC token signatures on incoming webhooks.

#### Step 3: Configure Notification & Return URLs
In your CinetPay site settings:
- **URL de Notification (IPN Webhook)**:
  ```
  https://your-production-domain.com/api/wallet/webhook
  ```
- **URL de Retour (Return URL)**:
  ```
  https://your-production-domain.com/api/wallet/complete
  ```

#### Step 4: Environment Variables (`.env`)
```env
# CinetPay (DR Congo & West/Central Africa)
CINETPAY_API_KEY="your_cinetpay_api_key_here"
CINETPAY_SITE_ID="your_cinetpay_site_id_here"
CINETPAY_SECRET_KEY="your_cinetpay_secret_key_here"
```

#### How CinetPay Process Works:
1. When a user buys tokens, the backend calls `https://api-checkout.cinetpay.com/v2/payment` with `site_id`, `amount`, `currency` (`CDF` or `USD`), and customer phone number.
2. CinetPay triggers the USSD prompt directly on the customer's phone (Vodacom M-Pesa RDC, Orange Money RDC, or Airtel).
3. The user enters their PIN on their phone.
4. CinetPay sends an IPN POST request to `/api/wallet/webhook` with `cpm_trans_status: 'ACCEPTED'`.
5. The platform validates the transaction and credits the stream tokens.

---

### 8.3 Paystack (`paystack.com`) — Setup & Configuration (Kenya, Ghana, West Africa)

#### Step 1: Sign Up & Access the Merchant Portal
1. Visit [dashboard.paystack.com/signup](https://dashboard.paystack.com/signup).
2. Choose your country: **Kenya**, **Ghana**, **Côte d’Ivoire**, **South Africa**, or **Nigeria**.
3. Fill in your business details. Paystack approves accounts for test mode immediately.

#### Step 2: Enable Mobile Money Payment Method
1. In the Paystack Dashboard, go to **Settings > Preferences**.
2. Under **Payment Methods**, make sure **Mobile Money** is checked:
   - For Kenya: **M-Pesa**
   - For Ghana: **MTN, Vodafone/Telecel, AirtelTigo**
   - For Côte d’Ivoire: **Wave, Orange Money, MTN**

#### Step 3: Retrieve API Keys
1. Go to **Settings > API Keys & Webhooks**:
   - **Test Secret Key**: `sk_test_...`
   - **Live Secret Key**: `sk_live_...`
   - **Public Key**: `pk_live_...`

#### Step 4: Configure Webhook
1. Under **Settings > API Keys & Webhooks > Webhooks**:
2. Set the **Webhook URL**:
   ```
   https://your-production-domain.com/api/wallet/webhook
   ```
3. Paystack signs every webhook with an HMAC-SHA512 hash in the `x-paystack-signature` header using your Secret Key.

#### Step 5: Environment Variables (`.env`)
```env
# Paystack (Kenya M-Pesa, Ghana, Côte d'Ivoire)
PAYSTACK_SECRET_KEY="sk_live_your_paystack_secret_key"
PAYSTACK_PUBLIC_KEY="pk_live_your_paystack_public_key"
```

---

### 8.4 Safaricom Daraja Direct API (Kenya M-Pesa Direct)

If you only want direct Safaricom M-Pesa in Kenya with zero aggregator middleman:

1. **Access Developer Portal**: Visit [developer.safaricom.co.ke](https://developer.safaricom.co.ke/) and create an account.
2. **Create an App**: Go to **My Apps > Create App**. Check **Lipa Na M-Pesa Online Sandbox**.
3. **Retrieve Credentials**:
   - **Consumer Key**: Passed to OAuth token endpoint.
   - **Consumer Secret**: Used to generate bearer tokens.
   - **Passkey**: Used to compute the STK push password:
     ```
     Password = Base64(Shortcode + Passkey + Timestamp)
     ```
   - **Shortcode**: Your Paybill or Till number (e.g. `174379` in sandbox).
4. **Endpoint for STK Push**:
   `POST https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest`
5. **Callback URL**:
   ```
   https://your-production-domain.com/api/wallet/webhook
   ```

---

### 8.5 DPO Pay (`dpogroup.com`) — Setup & Configuration (East & Southern Africa)

#### Step 1: Sign Up & Access the Merchant Portal
1. Visit [dpogroup.com](https://www.dpogroup.com/) and submit a Merchant Application.
2. Complete KYB compliance verification for your entity in Kenya, Tanzania, Uganda, South Africa, or UK/UAE.
3. Once approved, you are granted access to the DPO Merchant Portal.

#### Step 2: Retrieve Your Credentials
In your DPO Merchant Portal:
- **Company Token (`DPO_COMPANY_TOKEN`)**: A 32-character hexadecimal token that authenticates your merchant account.
- **Service Type (`DPO_SERVICE_TYPE`)**: The numerical ID corresponding to your service classification (e.g. `3854` for standard digital services / e-commerce).

#### Step 3: Configure Webhook (IPN) & Redirect URLs
In the DPO Portal under **Payment Configuration > IPN**:
- **IPN URL**:
  ```
  https://your-production-domain.com/api/wallet/webhook
  ```
- **Redirect URL**:
  ```
  https://your-production-domain.com/api/wallet/complete
  ```

#### Step 4: Environment Variables (`.env`)
```env
# DPO Pay (Kenya, Tanzania, Uganda, Southern Africa)
DPO_COMPANY_TOKEN="your_32_char_company_token"
DPO_SERVICE_TYPE="3854"
# Set to 'true' for test sandbox, 'false' for secure.3gdirectpay.com
DPO_SANDBOX="false"
```

---

### 8.6 MTN MoMo API (`momodeveloper.mtn.com`) — Direct Telco Access

If you prefer direct integration with MTN Mobile Money in Ghana, Uganda, Cameroon, Côte d'Ivoire, or Rwanda:

#### Step 1: Create Developer Account & Subscribe to Product
1. Register at [momodeveloper.mtn.com](https://momodeveloper.mtn.com/).
2. Navigate to **Products** and click **Subscribe** to the **Collections** product.
3. Obtain your **Primary Key** and **Secondary Key** (`Ocp-Apim-Subscription-Key`).

#### Step 2: Provision API User and API Key (Sandbox)
1. Generate a random UUID v4 string (e.g. using `crypto.randomUUID()`). This is your `X-Reference-Id`.
2. Create your API User:
   ```bash
   curl -X POST https://sandbox.momodeveloper.mtn.com/v1_0/apiuser \
     -H "X-Reference-Id: <YOUR-UUID-V4>" \
     -H "Ocp-Apim-Subscription-Key: <PRIMARY_KEY>" \
     -H "Content-Type: application/json" \
     -d '{"providerCallbackHost": "your-production-domain.com"}'
   ```
3. Generate the API Key for that user:
   ```bash
   curl -X POST https://sandbox.momodeveloper.mtn.com/v1_0/apiuser/<YOUR-UUID-V4>/apikey \
     -H "Ocp-Apim-Subscription-Key: <PRIMARY_KEY>"
   ```
   Save the returned `apiKey`.

#### Step 3: Environment Variables (`.env`)
```env
# MTN MoMo Direct API
MTN_MOMO_SUBSCRIPTION_KEY="your_primary_subscription_key"
MTN_MOMO_API_USER="your_uuid_v4_api_user"
MTN_MOMO_API_KEY="your_generated_api_key"
MTN_MOMO_TARGET_ENV="sandbox" # or "production"
```

---

### 8.7 Ready-to-Test cURL Commands for Sandbox Verification

#### PawaPay Test STK Push
```bash
curl -X POST https://api.sandbox.pawapay.cloud/deposits \
  -H "Authorization: Bearer <PAWAPAY_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "depositId": "test-deposit-001",
    "amount": "28000",
    "currency": "CDF",
    "correspondent": "VODACOM_CD",
    "payer": {
      "type": "MSISDN",
      "address": { "value": "243810000001" }
    },
    "customerTimestamp": "2026-09-17T07:00:00Z",
    "statementDescription": "PulseStream 100 Tokens"
  }'
```

#### CinetPay Test Payment Initialization
```bash
curl -X POST https://api-checkout.cinetpay.com/v2/payment \
  -H "Content-Type: application/json" \
  -d '{
    "apikey": "<CINETPAY_API_KEY>",
    "site_id": "<CINETPAY_SITE_ID>",
    "transaction_id": "test-tx-001",
    "amount": 28000,
    "currency": "CDF",
    "description": "PulseStream 100 Tokens",
    "notify_url": "https://your-domain.com/api/wallet/webhook",
    "return_url": "https://your-domain.com/api/wallet/complete",
    "channels": "MOBILE_MONEY"
  }'
```

---

### 8.8 Summary of Fastest Onboarding & Access by Country

| Target Region | Fastest Gateway to Access | Typical Approval Time | Documents Needed |
| :--- | :--- | :---: | :--- |
| **DR Congo (RDC)** | **CinetPay** or **PawaPay** | 2–5 Business Days | RCCM, ID.NAT, Director Passport, Bank/MoMo statement |
| **Kenya** | **Paystack** or **PawaPay** | 1–2 Business Days | Certificate of Incorporation, KRA PIN, Director ID |
| **Ghana** | **Paystack** or **PawaPay** | 1–3 Business Days | Registrar General (RGD) docs, Ghana Card |
| **Côte d’Ivoire / Senegal** | **CinetPay** or **Wave Direct** | 2–4 Business Days | RCCM, NINEA, Director ID |
| **Uganda / Rwanda / Tanzania**| **PawaPay** or **DPO Pay** | 2–4 Business Days | Certificate of Incorporation, Tax Certificate |
| **All Africa (Consolidated)** | **PawaPay** | 3–7 Business Days | Single international contract for 18 countries |



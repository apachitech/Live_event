# VaultPay Ingest & Virtual Card Integration Guide (`VAULTPAY-INGEST.md`)

This guide provides a complete reference for connecting, configuring, and operating the **VaultPay Payment Gateway** and **Virtual Card Ingest System** for the Live Streaming Platform, covering both **Local Development** and **Live Production Deployments**.

---

## 1. Architecture Overview

**VaultPay** serves as a primary card rail enabling viewers—particularly across Central/West Africa (DR Congo, etc.) and global unbanked communities—to pay using **Virtual Visa Cards**, standard credit/debit cards, and mobile-linked cards.

```
┌───────────────────────────────────────┐
│           Viewer / Client             │
│    (Token Store - VaultPay Tab)       │
└──────────────────┬────────────────────┘
                   │ 1. POST /api/wallet/purchase
                   │    { paymentMethod: 'VAULTPAY', vaultPayOptions: { ... } }
                   ▼
┌────────────────────────────────────────────────────────┐
│             VaultPay Processor Layer                   │
│        (src/lib/payment/vaultPayAdapter.ts)            │
│  - Luhn checksum validation                            │
│  - Visa / Mastercard / Verve brand detection           │
└──────────────────┬─────────────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │ Is Configured?    │
         ├─── YES ───────────┴─── NO (Sandbox) ────────┐
         ▼                                             ▼
┌──────────────────────────────┐              ┌──────────────────────────────┐
│  Live VaultPay Gateway API   │              │  Interactive Dev Sandbox     │
│  https://api.vaultpay.io/v1  │              │  Instant 3D Secure Sim       │
│  (or sandbox.api.vaultpay.io)│              │  Quick-Fill Test Cards       │
└──────────────┬───────────────┘              └──────────────┬───────────────┘
               │                                             │
               │ 2. Webhook / Redirect                       │ 2. Instant Redirect
               ▼                                             ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                  Webhook Handler (POST /api/wallet/webhook)                │
│  - Verifies HMAC-SHA256 signature (x-vaultpay-signature)                  │
│  - Enforces ledger idempotency on paymentRef (vaultpay_*)                  │
│  - Credits stream tokens to User Wallet via WalletService.credit           │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Step-by-Step Gateway Connection

### Step 2.1: Obtain Merchant Credentials
1. Register or sign in to your **VaultPay Business Portal** at `vaultpay.io` or `getvaultpay.co`.
2. Go to **Settings > Developers / API Keys**:
   - **Secret API Key (`VAULTPAY_API_KEY`)**: e.g., `vp_live_sk_...` or `vp_test_sk_...`
   - **Merchant ID (`VAULTPAY_MERCHANT_ID`)**: e.g., `merch_9876543210`
3. Go to **Webhooks**:
   - Create or view your **Webhook Secret (`VAULTPAY_SECRET_KEY`)**.

### Step 2.2: Add Environment Variables
Add the following to your `.env` file (and in your hosting dashboard such as Render):

```env
# ==============================================================================
# VAULTPAY (VIRTUAL VISA & CARD PAYMENT GATEWAY)
# ==============================================================================

# Your VaultPay Secret API Key
VAULTPAY_API_KEY="vp_test_sk_your_vaultpay_api_key_here"

# Your VaultPay Merchant Account ID
VAULTPAY_MERCHANT_ID="merch_your_merchant_id_here"

# Your Webhook Secret for HMAC-SHA256 signature verification
VAULTPAY_SECRET_KEY="your_vaultpay_webhook_secret_here"

# Set to "false" for live production, or "true" for VaultPay test sandbox
VAULTPAY_SANDBOX="true"
```

### Step 2.3: Configure the Webhook URL
In your VaultPay Merchant Dashboard under **Webhooks**:
- **Endpoint URL**:
  ```
  https://your-production-domain.com/api/wallet/webhook
  ```
  *(For local testing, use an ngrok or Cloudflare tunnel, e.g. `https://xxxx.ngrok-free.app/api/wallet/webhook`)*
- **HTTP Method**: `POST`
- **Events to Subscribe To**:
  - `charge.completed`
  - `payment.success`

---

## 3. How Token Purchases Work (Viewer Flow)

### 3.1 In-App Virtual Card Entry
1. The viewer opens the Token Store modal and clicks **VaultPay**.
2. The UI renders the dedicated Virtual Card form:
   - **Cardholder Name**
   - **16-Digit Card Number** (with real-time `xxxx xxxx xxxx xxxx` spacing)
   - **Expiry Date** (`MM/YY`)
   - **Security Code (CVV)**
3. When the user clicks **Buy Tokens**, the frontend calls `POST /api/wallet/purchase`:
   ```json
   {
     "packageId": "pkg_standard",
     "paymentMethod": "VAULTPAY",
     "vaultPayOptions": {
       "cardNumber": "4242 4242 4242 4242",
       "cardExpiry": "12/28",
       "cardCvv": "888",
       "cardholderName": "Jean Kabamba",
       "isVirtualCard": true
     }
   }
   ```
4. **Backend Processing**:
   - If keys are configured, routes the charge to VaultPay Gateway API.
   - If in sandbox mode, validates the card number checksum using the **Luhn algorithm** and simulates an authorized charge.

---

## 4. Webhook Processing & Security

Incoming webhooks hit `POST /api/wallet/webhook`.

### 4.1 Signature Verification
VaultPay passes the cryptographic signature in the `x-vaultpay-signature` (or `x-signature`) header:
```ts
const signature = headers['x-vaultpay-signature'] || headers['x-signature'];
const hmac = crypto.createHmac('sha256', process.env.VAULTPAY_SECRET_KEY);
const expected = hmac.update(rawBody).digest('hex');
const isValid = signature.toLowerCase() === expected.toLowerCase();
```

### 4.2 Idempotency & Token Crediting
To guarantee viewers are never double-credited or missed:
```ts
const existingTx = await prisma.transaction.findFirst({
  where: {
    recipientId: userId,
    type: 'PURCHASE',
    metadata: { contains: paymentRef },
  },
});

if (!existingTx) {
  await WalletService.creditPurchasedTokens(userId, tokens, fiatAmountCents, paymentRef);
}
```

---

## 5. Streamer Cashouts to VaultPay Virtual Cards

Streamers can cash out their earned stream tokens directly to their **VaultPay Virtual Visa Card**:

1. Navigate to `/dashboard/streamer/payouts`.
2. Under **Payout Method**, select:
   ```
   💳 VaultPay Virtual Visa Card (Direct Disbursement)
   ```
3. Enter their 16-digit VaultPay virtual card number (or registered mobile phone number).
4. The backend validates the Luhn checksum in `/api/payout/request` before deducting tokens from `earnedBalance`.
5. Minimum payout threshold: **1,000 tokens** ($50.00 USD at $0.05 / token cashout rate).

---

## 6. Zero-Dependency Developer Sandbox Mode

If `VAULTPAY_API_KEY` is not present in `.env`, the platform automatically operates in **Interactive Sandbox Mode**:

### Sample Test Virtual Cards:
| Card Label | Card Number | Expiry | CVV | Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **VaultPay Virtual Visa (Instant Pass)** | `4242 4242 4242 4242` | `12/28` | `888` | Passes Luhn check; instant charge approval |
| **VaultPay High-Limit Virtual Visa** | `4111 1111 1111 1111` | `10/27` | `321` | Standard virtual card test |
| **VaultPay Virtual Mastercard** | `5555 5555 5555 4444` | `09/29` | `777` | Mastercard virtual rail test |

> [!TIP]
> In the Token Purchase Modal under VaultPay, click any of the **Quick Fill Sample VaultPay Cards** buttons to populate the fields with a single click.

---

## 7. Troubleshooting & FAQ

### Q: Why am I getting "Invalid VaultPay card number checksum (Luhn check failed)"?
**A:** Credit and virtual debit card numbers use the mathematical Luhn formula for checksum validation. Ensure you are using a valid test card number (e.g. `4242 4242 4242 4242` or `4111 1111 1111 1111`) rather than random numbers.

### Q: Does VaultPay support 3D Secure (OTP / SMS)?
**A:** Yes. When live mode is active, the VaultPay checkout URL or in-app 3D Secure modal prompts the user for their SMS/app authorization code before releasing funds.

### Q: Where are transactions logged?
**A:** All successful token purchases are recorded in the `Transaction` table with `type: 'PURCHASE'` and `metadata: '{"paymentRef": "vaultpay_..."}'`.
Streamer payouts are recorded with `type: 'STREAMER_PAYOUT'` and logged in the `AuditLog` table.

# SasPay (`saspay.me`) Payment Ingest & Mobile Money Payout Guide

This document provides a comprehensive technical and operational guide for integrating **SasPay (`https://saspay.me`)** into this live streaming platform for:
1. **Payment Ingestion (Payin / Token Purchases)**: Viewers buying stream tokens via Mobile Money (**Wave, Orange Money, MTN MoMo, Moov Money, Djamo**) and international cards (**Visa / Mastercard**) across Francophone West & Central Africa.
2. **Streamer Payouts (Disbursements / Retraits)**: Streamers withdrawing their token earnings directly into their Mobile Money wallets in seconds.

---

## 1. Architecture Overview

SasPay connects digital platforms to West and Central African telecom operators through a single, unified REST API:

```
┌─────────────────────────────────────────────────────────────┐
│                       Viewer / Client                       │
│    (Token Store - Mobile Money Tab: Wave, Orange, MTN, Moov)│
└──────────────────────────────┬──────────────────────────────┘
                               │ 1. POST /api/wallet/purchase
                               │    { paymentMethod: 'SASPAY', sasPayOptions: { ... } }
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    SasPay Payment Adapter                   │
│             (src/lib/payment/sasPayAdapter.ts)              │
│  - Converts USD tokens to CFA Francs (1 USD ≈ 600 XOF/XAF)  │
│  - Supports Hosted Checkout & USSD Softpay Push             │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            │   Is Configured with SASPAY Key?    │
            ├────────────── YES ──────────────────┴──────── NO (Dev Mode) ─────────┐
            ▼                                                                      ▼
┌───────────────────────────────────────┐                      ┌───────────────────────────────────────┐
│     SasPay Production REST API        │                      │       Interactive Dev Sandbox         │
│     POST /v1/checkout-sessions/       │                      │       /api/wallet/complete?session_...│
│  - Generates secure hosted link       │                      │  - Auto-simulates payment completion  │
│  - Redirects to pay.saspay.me         │                      │  - Credits tokens in local testing    │
└───────────────────┬───────────────────┘                      └───────────────────┬───────────────────┘
                    │                                                              │
                    │ 2. Payment Completed / Webhook Notification                  │ 2. Direct Credit
                    ▼                                                              ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              Webhook Handler (POST /api/wallet/webhook)                              │
│  - Verifies HMAC-SHA256 signature (X-SasPay-Signature)                                               │
│  - Idempotency guard: checks paymentRef in DB ledger                                                 │
│  - Credits stream tokens to User Wallet via WalletService.creditPurchasedTokens                      │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Supported Networks & Currencies

SasPay supports all major telecom operators across West and Central Africa:

| Operator | Country | Code | Currency | Supported Actions |
| :--- | :--- | :--- | :--- | :--- |
| **Wave** | Côte d'Ivoire | `wave_ci` | `XOF` | Payin & Payout |
| **Wave** | Sénégal | `wave_sn` | `XOF` | Payin & Payout |
| **Orange Money** | Côte d'Ivoire | `orange_ci` | `XOF` | Payin & Payout |
| **Orange Money** | Sénégal | `orange_sn` | `XOF` | Payin & Payout |
| **Orange Money** | Cameroun | `orange_cm` | `XAF` | Payin & Payout |
| **MTN Mobile Money** | Bénin | `mtn_bj` | `XOF` | Payin & Payout |
| **MTN MoMo** | Côte d'Ivoire | `mtn_ci` | `XOF` | Payin & Payout |
| **MTN MoMo** | Cameroun | `mtn_cm` | `XAF` | Payin & Payout |
| **Moov Money** | Bénin | `moov_bj` | `XOF` | Payin & Payout |
| **Moov Money** | Côte d'Ivoire | `moov_ci` | `XOF` | Payin & Payout |
| **Moov Money** | Togo | `moov_tg` | `XOF` | Payin & Payout |
| **Djamo** | Côte d'Ivoire | `djamo_ci` | `XOF` | Payin |
| **Cards (Visa / Mastercard)** | Pan-African / Global | `card` | `XOF` / `USD` | Payin |

---

## 3. Environment Configuration

To enable live processing on your production server (e.g. Render, Railway, or VPS), obtain your API keys from **[https://app.saspay.me](https://app.saspay.me)** and add them to your environment variables:

### Production (.env / Render Environment)
```env
# SasPay (saspay.me) Production Credentials
SASPAY_SECRET_KEY=saspay_live_secret_key_here
SASPAY_WEBHOOK_SECRET=saspay_webhook_secret_here
SASPAY_ENVIRONMENT=production
```

### Development / Sandbox (.env)
```env
# SasPay Sandbox Credentials
SASPAY_SECRET_KEY=saspay_test_secret_key_here
SASPAY_WEBHOOK_SECRET=saspay_test_webhook_secret_here
SASPAY_ENVIRONMENT=sandbox
```

---

## 4. IP Whitelisting for Streamer Payouts (Crucial Requirement)

SasPay enforces strict security rules for Automated Payouts (**B2C Disbursements**). You must whitelist your production server's outbound IP address.

### How to Find Your Production Outbound IP Address (Render & Platform)

#### Option A: Via Render Web Shell (Instant Live IP - Recommended)
1. Open your **[Render Dashboard](https://dashboard.render.com/)**.
2. Click on your Web Service (`live-streaming-web` or your service name).
3. Click the **Shell** tab on the left sidebar.
4. Run either command:
   ```bash
   curl -s https://api.ipify.org
   ```
   *or*
   ```bash
   curl -s https://ifconfig.me
   ```
5. The terminal will immediately print your server's current public outbound IP address (e.g. `52.12.34.56`). Copy this address.

#### Option B: Via Render Dashboard Settings (All Regional Egress IPs)
1. In your **Render Dashboard**, click on your Web Service.
2. Click the **Settings** tab on the left navigation.
3. Scroll down to the **Networking** or **Outbound IP Addresses** (Egress IPs) section.
4. Render will list all static IP addresses and CIDR ranges used by your service's region (e.g. Oregon, Frankfurt, Ohio). Add these IPs to your SasPay whitelist.

#### Option C: Via Your App's Admin API & Settings UI
1. **Via Direct URL**: While logged in as Admin, visit:
   ```text
   https://<your-render-app>.onrender.com/api/admin/outbound-ip
   ```
   This returns a JSON object containing `{ "success": true, "outboundIp": "xxx.xxx.xxx.xxx" }`.
2. **Via Admin Settings**: Go to `/admin/settings?tab=rules`, scroll to **Production Server Outbound IP**, and click **"Check Live Server IP"** to detect and copy the IP with 1 click.

---

### Adding the IP to SasPay Whitelist
1. Log in to your merchant dashboard at **[https://app.saspay.me](https://app.saspay.me)**.
2. Go to **Settings** > **Developers** > **API Keys**.
3. Ensure your API key has the **`PAYOUT`** or **`BOTH`** permission scope.
4. Go to **IP Whitelist** and enter the outbound IP obtained above.
5. Alternatively, your backend can register an entry via API:
   ```bash
   curl -X POST "https://api.saspay.me/api/v1/merchant-ip-whitelist-entries/" \
     -H "Authorization: Bearer <your_saspay_secret_key>" \
     -H "Content-Type: application/json" \
     -d '{"ip_address": "YOUR_SERVER_OUTBOUND_IP"}'
   ```

> [!WARNING]
> If your server IP is not whitelisted in SasPay, all automated payout requests will fail with `403 Forbidden` or `ip_not_whitelisted`.

---

## 5. Payin Flow (Token Purchases)

### Hosted Checkout Session (Default)
When a viewer selects a token bundle (e.g. 500 Tokens = $5.00 USD ≈ 3,000 FCFA), our backend calls:

```http
POST https://api.saspay.me/api/v1/checkout-sessions/
Authorization: Bearer <your_saspay_secret_key>
Content-Type: application/json
Idempotency-Key: saspay_cs_1710000000_usr_123

{
  "amount": "3000.00",
  "currency": "XOF",
  "description": "Live Stream 500 Tokens (Standard Pack)",
  "return_url": "https://your-live-site.com/api/wallet/complete?session_id={id}&package_id=tokens_500&tokens=500&provider=saspay",
  "metadata": {
    "userId": "usr_12345",
    "packageId": "tokens_500",
    "tokens": 500,
    "fiatAmountCents": 500
  }
}
```

The user is redirected to `checkout_url` on `pay.saspay.me` where they complete payment via their preferred operator (Wave, Orange, MTN, Moov, or Card).

---

## 6. Streamer Payout Flow (Mobile Money Cashouts)

### Step 1: Streamer Requests Cashout
A streamer with at least 1,000 earned tokens ($50.00 USD) requests a payout specifying:
- Mobile Money Phone Number (e.g. `+225 07 00 00 00 00`)
- Country: `CI` (Côte d'Ivoire), `BJ` (Bénin), `SN` (Sénégal), etc.
- Operator: `orange_ci`, `wave_ci`, `mtn_bj`, `moov_ci`, etc.

The request is logged in the database under `Payout` with status `REQUESTED`.

### Step 2: Admin Approval
In the Admin Dashboard (`/admin/payouts`), the Admin reviews the request and clicks **Approve**.

The server invokes `sasPayProcessor.processStreamerPayout(...)` which dispatches funds directly via:

```http
POST https://api.saspay.me/api/v1/payouts/initialize/
Authorization: Bearer <your_saspay_secret_key>
Content-Type: application/json
Idempotency-Key: saspay_payout_1710000000_streamer_456

{
  "amount": "30000.00",
  "currency": "XOF",
  "country": "CI",
  "method": "orange_ci",
  "description": "Streamer Cashout - Live Platform (30000 CFA)",
  "customer": {
    "email": "streamer@example.com",
    "phone": "0700000000"
  },
  "recipient": {
    "msisdn": "0700000000"
  }
}
```

Upon success:
- The streamer receives the cash in their mobile money wallet instantly.
- The payout status updates to `COMPLETED`.
- An immutable audit trail entry is logged in the database.

---

## 7. Webhook Configuration & Idempotency

Webhooks guarantee that tokens are credited to the user's account even if the user closes their browser before returning from the checkout page.

### 7.1. What Your Webhook URL Is
Your platform has a built-in webhook listener at `/api/wallet/webhook`:

- **On Render (Live Deployment)**:
  ```text
  https://<your-render-service-name>.onrender.com/api/wallet/webhook
  ```
  *(Example: `https://live-streaming-web.onrender.com/api/wallet/webhook`)*

- **If You Have a Custom Domain**:
  ```text
  https://yourdomain.com/api/wallet/webhook
  ```

---

### 7.2. Step-by-Step Setup in the SasPay Merchant Portal
1. Log in to your merchant dashboard at **[https://app.saspay.me](https://app.saspay.me)**.
2. In the navigation menu, go to **Developers** > **Webhooks** (or **Settings** → **Webhooks**).
3. Click **"Add Webhook"** or **"Configure Endpoint"**.
4. In the **URL / Endpoint** field, enter your full webhook URL:
   ```text
   https://<your-app>.onrender.com/api/wallet/webhook
   ```
5. In **Events to Subscribe**, select:
   - `payment.successful` (or select **"All Events"** / `checkout.session.completed`).
6. Click **Save** / **Create Endpoint**.
7. SasPay will display your **Webhook Secret** (e.g. `whsec_...` or a secret key string). **Copy this secret key.**

---

### 7.3. Step-by-Step in Render (Save the Webhook Secret)
To allow your backend to verify that incoming webhook notifications genuinely come from SasPay:
1. Go to your **[Render Dashboard](https://dashboard.render.com/)**.
2. Click on your Web Service.
3. Click the **Environment** tab on the left.
4. Add or update these variables:
   ```env
   SASPAY_SECRET_KEY=your_saspay_secret_key_here
   SASPAY_WEBHOOK_SECRET=your_saspay_webhook_secret_here
   SASPAY_ENVIRONMENT=production
   ```
5. Click **Save Changes**. Render will automatically redeploy with the active secret.

---

### 7.4. What SasPay Delivers (Payload Structure)
When a customer payment succeeds, SasPay dispatches an HTTP POST request:

```json
{
  "event": "payment.successful",
  "data": {
    "id": "pay_live_987654321",
    "amount": "3000.00",
    "currency": "XOF",
    "method": "wave_ci",
    "status": "SUCCESSFUL",
    "metadata": {
      "userId": "usr_12345",
      "packageId": "tokens_500",
      "tokens": 500,
      "fiatAmountCents": 500
    }
  }
}
```

Headers include:
- `Content-Type: application/json`
- `X-SasPay-Signature: <hmac_sha256_hex_hash>`

---

### 7.5. How Our Webhook Handler Processes the Event
In [`src/app/api/wallet/webhook/route.ts`](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/src/app/api/wallet/webhook/route.ts):

1. **HMAC-SHA256 Verification**:
   The incoming raw request body is hashed with `SASPAY_WEBHOOK_SECRET` and compared to `X-SasPay-Signature`. If the signature doesn't match, the request is rejected with `400 Bad Request`.
2. **Idempotency Guard**:
   The unique reference `saspay_pay_live_987654321` is checked against the database `Transaction` table. If it has already been processed, the webhook immediately returns `{ received: true, status: "ALREADY_PROCESSED" }` to prevent double-crediting.
3. **Double-Entry Ledger Credit**:
   Calls `WalletService.creditPurchasedTokens(userId, tokens, fiatAmountCents, paymentRef)`:
   - Increments user's `purchasedBalance`.
   - Creates an immutable `Transaction` record with type `PURCHASE`.
4. **200 OK Acknowledgment**:
   Returns HTTP 200 `{ received: true, status: "CREDITED" }` so SasPay knows the event was successfully handled.

---

### 7.6. Local Webhook Testing (Optional)
Because external payment providers cannot reach `localhost:3000` directly, use a secure tunnel during local development:

```bash
npx localtunnel --port 3000
```
*(or `ngrok http 3000`)*

Copy the generated public URL (e.g. `https://quiet-river-42.loca.lt`) and set your test webhook in SasPay sandbox to:
```text
https://quiet-river-42.loca.lt/api/wallet/webhook
```

---

## 8. Code Architecture & File Map

| Component | Path | Description |
| :--- | :--- | :--- |
| **SasPay Adapter** | [`src/lib/payment/sasPayAdapter.ts`](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/src/lib/payment/sasPayAdapter.ts) | Implements checkout creation, webhook HMAC verification, and B2C payout execution. |
| **Purchase Route** | [`src/app/api/wallet/purchase/route.ts`](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/src/app/api/wallet/purchase/route.ts) | Receives purchase intent, initializes checkout session, and returns payment URL. |
| **Webhook Route** | [`src/app/api/wallet/webhook/route.ts`](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/src/app/api/wallet/webhook/route.ts) | Verifies incoming webhooks, ensures idempotency, and credits user wallet ledger. |
| **Outbound IP API** | [`src/app/api/admin/outbound-ip/route.ts`](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/src/app/api/admin/outbound-ip/route.ts) | Diagnostic route to detect and display live server outbound IP for whitelisting. |
| **Admin Settings** | [`src/app/admin/settings/page.tsx`](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/src/app/admin/settings/page.tsx) | UI for inspecting and copying the live outbound IP directly from the Admin Panel. |
| **Token Purchase UI** | [`src/components/wallet/TokenPurchaseModal.tsx`](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/src/components/wallet/TokenPurchaseModal.tsx) | Client modal with Mobile Money (Wave, Orange, MTN, Moov) and SasPay checkout UI. |

---

## 9. Troubleshooting & Common Issues

| Issue | Cause | Resolution |
| :--- | :--- | :--- |
| **`403 ip_not_whitelisted` on Payout** | Production server outbound IP has not been added to SasPay merchant whitelist. | Follow **Section 4** to get your Render outbound IP via Shell (`curl ifconfig.me`) or Admin Settings and add it to **app.saspay.me > Developers > IP Whitelist**. |
| **`SIGNATURE_MISMATCH` in Webhook** | `SASPAY_WEBHOOK_SECRET` does not match the secret key generated in the SasPay portal. | Copy the Webhook Secret from SasPay and update `SASPAY_WEBHOOK_SECRET` in your Render Environment settings. |
| **Webhook Returns 404** | Webhook URL was typed incorrectly in the SasPay dashboard. | Ensure the endpoint path is strictly `/api/wallet/webhook` (e.g. `https://your-service.onrender.com/api/wallet/webhook`). |
| **Tokens Not Credited After Payment** | Webhook was not received or failed validation. | Check your server logs in Render (`Dashboard > Logs`) for `[Webhook]` entries to inspect the payload. |
| **Invalid Operator Code** | The country/network code does not match SasPay specs. | Use the exact codes listed in **Section 2** (e.g. `wave_ci`, `orange_ci`, `mtn_bj`). |

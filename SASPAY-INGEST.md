# SasPay (`saspay.me`) Payment Ingest & Mobile Money Payout Guide

This document provides a technical and operational guide for integrating **SasPay (`https://saspay.me`)** into this live streaming platform for:
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

To enable live processing on your production server (e.g. Render, Railway, or VPS), obtain your API keys from **[https://app.saspay.me](https://app.saspay.me)** and add them to `.env`:

```env
# SasPay (saspay.me) Credentials
SASPAY_SECRET_KEY=saspay_live_secret_key_here
SASPAY_WEBHOOK_SECRET=saspay_webhook_secret_here
SASPAY_ENVIRONMENT=production
```

For sandbox testing, use test keys:
```env
SASPAY_SECRET_KEY=saspay_test_secret_key_here
SASPAY_WEBHOOK_SECRET=saspay_test_webhook_secret_here
SASPAY_ENVIRONMENT=sandbox
```

---

## 4. IP Whitelisting for Streamer Payouts (Crucial Requirement)

SasPay enforces strict security rules for Automated Payouts (**B2C Disbursements**):
1. Log in to your merchant dashboard at **[https://app.saspay.me](https://app.saspay.me)**.
2. Go to **Settings** > **Developers** > **API Keys**.
3. Ensure your API key has the **`PAYOUT`** or **`BOTH`** permission scope.
4. Go to **IP Whitelist** and enter your production server's outbound IP address (e.g., Render outbound IP).
5. Alternatively, your backend can register an entry using:
   ```bash
   curl -X POST "https://api.saspay.me/api/v1/merchant-ip-whitelist-entries/" \
     -H "Authorization: Bearer <your_saspay_secret_key>" \
     -H "Content-Type: application/json" \
     -d '{"ip_address": "YOUR_SERVER_OUTBOUND_IP"}'
   ```

> [!WARNING]
> If the IP is not whitelisted, payout requests will fail with `403 Forbidden` or `ip_not_whitelisted`.

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

In your SasPay developer dashboard, configure your webhook URL:
`https://your-live-site.com/api/wallet/webhook`

When a payment succeeds, SasPay delivers:
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
      "tokens": 500,
      "fiatAmountCents": 500
    }
  }
}
```

Our webhook handler:
1. Validates the `X-SasPay-Signature` header with `SASPAY_WEBHOOK_SECRET`.
2. Checks that `paymentRef` (`saspay_pay_live_987654321`) has not already been credited.
3. Automatically increments the user's `purchasedBalance` in their database wallet and creates a double-entry ledger record.

# Platform Payments & Cryptocurrency Guide (PAYMENTS.md)

This document provides a comprehensive operational guide for the payment processing, cryptocurrency gateway, token purchase flows, and streamer cashouts across both **Local Development** and **Live Production Deployments**.

---

## 1. Architecture Overview

```
┌─────────────────────────┐
│     Viewer / Client     │
│ (Token Purchase Modal)  │
└────────────┬────────────┘
             │ 1. POST /api/wallet/purchase
             ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Payment Factory Layer                           │
│                     (getPaymentProcessor(method))                      │
└────────────┬──────────────┬──────────────┬──────────────┬──────────────┘
             │              │              │              │
    ┌────────▼────────┐ ┌───▼────┐ ┌───────▼──────┐ ┌─────▼──────┐
    │  Cryptocurrency │ │ Stripe │ │ LemonSqueezy │ │ MobileMoney│
    │  (NOWPayments)  │ │        │ │  (Merchant)  │ │(Flutterwave│
    └────────┬────────┘ └───┬────┘ └───────┬──────┘ └─────┬──────┘
             │              │              │              │
             └──────────────┼──────────────┴──────────────┘
                            │ 2. Webhook Callback (POST /api/wallet/webhook)
                            ▼
               ┌────────────────────────┐
               │    Wallet Ledger       │
               │ (WalletService.credit) │
               │   Idempotent Ledger    │
               └────────────────────────┘
```

---

## 2. Supported Payment Methods

| Method | Provider | Target Audience | Supported Assets / Currencies |
| :--- | :--- | :--- | :--- |
| **`VAULTPAY`** | VaultPay / Sandbox | Global, DR Congo, Africa | **VaultPay Virtual Visa Cards**, Mastercard, Local Virtual Cards |
| **`CRYPTO`** | NOWPayments / Sandbox | Global, Web3, Low Fees | **USDT (TRC-20)**, **USDT (ERC-20)**, **Solana (SOL)**, **Bitcoin (BTC)**, **Ethereum (ETH)**, **USDC** |
| **`LEMON_SQUEEZY`**| Lemon Squeezy | Global Credit Cards, Apple Pay | USD, EUR, GBP (Merchant of Record) |
| **`STRIPE`** | Stripe Hosted / Elements | US, EU, International Cards | USD, EUR, etc. |
| **`MOBILE_MONEY`** | Flutterwave | Sub-Saharan Africa | DR Congo (M-Pesa, Orange, Airtel, Afrimoney), Kenya (M-Pesa), Ghana/Uganda (MTN), Senegal (Wave) |
| **`CCBILL`** | CCBill | High-risk adult/digital entertainment | Cards & Wire transfers |
| **`MOCK`** | Internal Sandbox | Local Developers | Instant simulated token crediting |

---

## 3. Cryptocurrency Integration (BTC, ETH, USDT, SOL, USDC)

### 3.1 Checkout Flow
1. **User Selection**: In the Token Purchase Modal (`TokenPurchaseModal.tsx`), user selects **Crypto** and chooses their currency (e.g. USDT on TRON TRC-20 for zero network fees, or Solana for sub-second confirmation).
2. **Session Creation**:
   - `POST /api/wallet/purchase` with `{ packageId, paymentMethod: 'CRYPTO', cryptoOptions: { payCurrency: 'usdttrc20' } }`.
   - **Production (with `NOWPAYMENTS_API_KEY`)**: Calls `https://api.nowpayments.io/v1/invoice` with order metadata and IPN callback URL. Returns invoice redirect URL.
   - **Local Development / Sandbox**: Redirects to `/checkout/crypto?session_id=...` with calculated crypto amounts, QR code, and interactive simulation button.
3. **Checkout Screen (`/checkout/crypto`)**:
   - Displays real-time converted crypto amount (e.g. `$9.99` = `9.99 USDT` or `0.000155 BTC`).
   - Generates scan-ready QR code and one-click copyable wallet address.
   - 15-minute countdown timer with automatic network monitoring.
   - Includes instant simulation button in development mode.

### 3.2 Webhook Processing (`POST /api/wallet/webhook`)
- **Signature Verification**: Validates HMAC-SHA512 using `NOWPAYMENTS_IPN_SECRET` (`x-nowpayments-sig` header) over alphabetically sorted JSON payload keys.
- **Idempotency**: Verifies whether `paymentRef` (`crypto_{payment_id}`) has already been credited in `Transaction` ledger to prevent duplicate funding.
- **Token Delivery**: Calls `WalletService.creditPurchasedTokens(userId, tokens, fiatAmountCents, paymentRef)`.

---

## 4. Streamer Crypto Payouts (Cashouts)

Streamers can cash out their earned stream tokens directly to their personal cryptocurrency wallets from `/dashboard/streamer/payouts`:

### Supported Networks:
- **USDT (TRON TRC-20)**: Fast transfers, minimal gas fees (must start with `T` and be 34 characters).
- **Solana (SOL)**: Fast transfer speed (32–44 base58 characters).
- **Bitcoin (BTC)**: Standard Bitcoin addresses (`1...`, `3...`, `bc1...`).
- **Ethereum (ETH) & USDT (ERC-20)**: Ethereum hex addresses (must start with `0x` and be 42 characters).

### Validation & Security:
- Pre-flight address validation in `/api/payout/request` rejects malformed or invalid addresses before tokens are deducted.
- Minimum payout threshold: **1,000 tokens** ($50.00 USD at $0.05/token).
- Audit trails logged to `AuditLog` table with `PAYOUT_REQUESTED`.

---

## 4. VaultPay (Virtual Cards & Card Gateway)

VaultPay enables users (especially across Central/West Africa and globally) to pay using **Virtual Visa Cards** and standard credit/debit cards:

### 4.1 Ingest Flow
1. **User Selection**: User selects **VaultPay** in `TokenPurchaseModal.tsx`.
2. **Card Input**: User inputs their 16-digit VaultPay virtual card number, expiration (`MM/YY`), CVV, and name.
   - Built-in Luhn algorithm checks prevent mistyped card numbers.
   - Quick-fill sample cards (`4111 2222 3333 4444`) allow instant sandbox testing.
3. **Processing**:
   - In production (with `VAULTPAY_API_KEY` and `VAULTPAY_MERCHANT_ID`), charges the virtual card via VaultPay's Gateway API.
   - In sandbox mode, simulates 3D Secure / OTP authorization and credits tokens immediately.

### 4.2 Streamer Payouts (Direct to Virtual Card)
- Streamers can request payouts directly to their **VaultPay Virtual Visa Card** or registered phone number.
- Luhn checksum verification ensures payout card numbers are valid before tokens are debited.

---

## 5. Environment Configuration

Add the following to your `.env` file for production processing:

```env
# NOWPayments Cryptocurrency Gateway
NOWPAYMENTS_API_KEY="your_nowpayments_api_key"
NOWPAYMENTS_IPN_SECRET="your_nowpayments_ipn_secret"
NOWPAYMENTS_SANDBOX="false"

# VaultPay (Virtual Visa/Mastercard & Card Gateway)
VAULTPAY_API_KEY="your_vaultpay_api_key"
VAULTPAY_MERCHANT_ID="your_vaultpay_merchant_id"
VAULTPAY_SECRET_KEY="your_vaultpay_webhook_secret"
VAULTPAY_SANDBOX="true"
```

> [!NOTE]
> When external gateway keys are omitted, the platform runs in interactive developer sandbox mode, enabling full testing without live accounts or card fees.

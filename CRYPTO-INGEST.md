# Cryptocurrency Ingest & Mobile Money Integration Guide (`CRYPTO-INGEST.md`)

This guide provides a comprehensive technical and operational reference for the **Cryptocurrency Payment Ingest System** (supporting **USDT-TRC20**, **Solana**, **Bitcoin**, **Ethereum**, **USDT-ERC20**, and **USDC**) and explains how crypto operates in tandem with **African Mobile Money networks** (M-Pesa, Orange Money, MTN MoMo, Airtel, and Wave).

---

## 1. Architecture Overview

The cryptocurrency rail connects viewers and streamers worldwide through a non-custodial gateway with zero chargeback risk, instant settlement, and automatic developer sandbox simulation.

```
┌─────────────────────────────────────────────────────────────┐
│                       Viewer / Client                       │
│       (Token Store - Crypto Tab: USDT, SOL, BTC, ETH)       │
└──────────────────────────────┬──────────────────────────────┘
                               │ 1. POST /api/wallet/purchase
                               │    { paymentMethod: 'CRYPTO', cryptoOptions: { payCurrency } }
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Crypto Payment Processor                    │
│            (src/lib/payment/cryptoAdapter.ts)               │
│  - Real-time crypto conversion rate calculator              │
│  - Pre-flight blockchain address format validation          │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            │ Is Configured with NOWPAYMENTS Key? │
            ├────────────── YES ──────────────────┴──────── NO (Dev Mode) ─────────┐
            ▼                                                                      ▼
┌───────────────────────────────────────┐                      ┌───────────────────────────────────────┐
│     NOWPayments Production API        │                      │       Interactive Dev Sandbox         │
│     POST /v1/invoice                  │                      │       /checkout/crypto?session_id=... │
│  - Generates live blockchain invoice  │                      │  - Shows simulated QR & address       │
│  - Hosted redirect / dynamic deposit  │                      │  - One-click instant confirmation sim │
└───────────────────┬───────────────────┘                      └───────────────────┬───────────────────┘
                    │                                                              │
                    │ 2. Blockchain Confirmation / Instant IPN Webhook             │ 2. Direct Credit
                    ▼                                                              ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              Webhook Handler (POST /api/wallet/webhook)                              │
│  - Verifies HMAC-SHA512 signature (x-nowpayments-sig)                                                │
│  - Idempotency guard: verifies paymentRef (crypto_*) in Transaction table                            │
│  - Credits stream tokens to User Wallet via WalletService.creditPurchasedTokens                      │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Supported Cryptocurrencies

| Currency | Network | Code | Key Advantage | Target Audience |
| :--- | :--- | :--- | :--- | :--- |
| **Tether (USDT)** | **TRON (TRC-20)** | `usdttrc20` | **Near-zero gas fees (~$1)**, stable 1:1 USD | **Recommended default**, Global, Africa |
| **Solana (SOL)** | **Solana Network** | `sol` | **Sub-second confirmations (<5s)**, micro-fees | Web3 users, fast tipping |
| **Bitcoin (BTC)** | **Bitcoin Core** | `btc` | Industry standard gold standard | Global hodlers, high-value purchases |
| **Ethereum (ETH)**| **Ethereum (ERC-20)**| `eth` | Native Web3 / MetaMask standard | Web3 collectors & international viewers |
| **Tether (USDT)** | **Ethereum (ERC-20)**| `usdterc20` | Universal exchange compatibility | Institutional / high-limit users |
| **USD Coin (USDC)**| **Ethereum / Solana** | `usdc` | Fully regulated Circle stablecoin | Corporate & US/EU viewers |

---

## 3. Step-by-Step Gateway Configuration

### Step 3.1: Obtain NOWPayments API Credentials
1. Register for a merchant account on [nowpayments.io](https://nowpayments.io/) (or [account-sandbox.nowpayments.io](https://account-sandbox.nowpayments.io) for testing).
2. Go to **Store Settings**:
   - **Payout Wallet**: Add your personal cryptocurrency address (e.g. your USDT-TRC20, Bitcoin, or Solana address from Binance, Trust Wallet, Phantom, or your hardware wallet). All viewer payments will be forwarded directly here.
3. Go to **Settings > API Keys**:
   - Copy your **API Key (`NOWPAYMENTS_API_KEY`)**.
   - Generate your **Instant Payment Notification (IPN) Secret (`NOWPAYMENTS_IPN_SECRET`)**.

### Step 3.2: Environment Variables Setup
Add the following to your `.env` file (and in your production dashboard on Render):

```env
# ==============================================================================
# CRYPTOCURRENCY GATEWAY (NOWPAYMENTS)
# ==============================================================================

# Your NOWPayments Production API Key
NOWPAYMENTS_API_KEY="your_api_key_from_nowpayments_here"

# Secret key for verifying HMAC-SHA512 webhook signatures
NOWPAYMENTS_IPN_SECRET="your_ipn_secret_key_here"

# Set to 'false' for live blockchain transactions, or 'true' for sandbox testing
NOWPAYMENTS_SANDBOX="false"
```

### Step 3.3: Configure the Webhook Callback
In your NOWPayments account under **Store Settings > Instant Payment Notifications (IPN)**:
- **IPN Callback URL**:
  ```
  https://your-production-domain.com/api/wallet/webhook
  ```
  *(For local testing, use an ngrok or Cloudflare tunnel, e.g. `https://xxxx.ngrok-free.app/api/wallet/webhook`)*
- **Header Received**: NOWPayments sends the HMAC signature in the `x-nowpayments-sig` header.

---

## 4. How Crypto Works With Mobile Money (The Hybrid Rail)

In markets such as the **DR Congo, Kenya, Ghana, Uganda, Côte d'Ivoire, and Senegal**, Mobile Money (M-Pesa, Orange Money, MTN MoMo, Airtel, Wave) is the dominant payment infrastructure.

The platform bridges Crypto and Mobile Money seamlessly:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                             THE HYBRID PAYMENT BRIDGE                        │
├──────────────────────────────────────┬───────────────────────────────────────┤
│            TOKEN INGEST (Buy)        │           STREAMER CASHOUT (Payout)   │
├──────────────────────────────────────┼───────────────────────────────────────┤
│ Flow A: International Crypto (USDT)  │ ➔ Cashed out to Local M-Pesa / Orange │
│ Flow B: Local Mobile Money (M-Pesa)  │ ➔ Cashed out to Global USDT Wallet    │
│ Flow C: Direct MoMo to Crypto Ramp   │ ➔ Yellow Card / Binance P2P On-Ramp   │
└──────────────────────────────────────┴───────────────────────────────────────┘
```

### Flow A: Global Crypto In ➔ Local Mobile Money Out
- **Scenario**: Diaspora or international fans in the US, Europe, or Asia want to tip or subscribe to African streamers without paying exorbitant Western Union or wire transfer fees.
- **How It Works**:
  1. The international viewer buys tokens using **USDT (TRC-20)** or **Bitcoin** via the Token Purchase modal.
  2. Stream tokens are instantly credited to the viewer's wallet.
  3. The viewer tips the streamer during a live broadcast or pays for a private show.
  4. The streamer visits `/dashboard/streamer/payouts`, chooses **`📱 DR Congo Mobile Money (Vodacom M-Pesa / Orange)`** or **`📱 M-Pesa (Kenya)`**, and inputs their mobile phone number.
  5. The platform processes the payout via Mobile Money, and the streamer receives local currency directly on their phone.

### Flow B: Local Mobile Money In ➔ Global Crypto Out (Inflation Hedge)
- **Scenario**: Streamers in developing economies want to protect their earnings against local currency depreciation (e.g. Congolese Franc, Kenyan Shilling, Ghanaian Cedi).
- **How It Works**:
  1. Local viewers purchase tokens via **Mobile Money (M-Pesa, Orange, MTN, Wave)**.
  2. The streamer earns tokens from tips and subscriptions.
  3. When cashing out, the streamer chooses **`🪙 USDT (TRON TRC-20)`** and inputs their personal TRON wallet address.
  4. The streamer receives digital US Dollars (USDT) with near-zero transfer fees, protected from currency inflation.

### Flow C: Buying Crypto Directly With Mobile Money (On-Ramp Services)
Viewers who only have Mobile Money on their phone but want to pay via Crypto can use instant African On-Ramp platforms:
1. **[Yellow Card](https://yellowcard.io/)**: Available across 20+ African countries; allows users to deposit via M-Pesa or Orange Money and receive USDT in under 2 minutes.
2. **Binance P2P / Bybit P2P**: Direct Mobile Money to USDT purchases.
3. **Fonbnk**: Converts mobile airtime/cash directly into crypto.
4. The viewer then sends the crypto to the deposit address shown on our platform's [`/checkout/crypto`](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/src/app/checkout/crypto/page.tsx) screen.

---

## 5. Viewer Token Purchase Flow

1. The viewer opens the Token Store and clicks **Crypto**.
2. They select their preferred cryptocurrency:
   - **USDT (TRC-20)** *(Recommended / Low Fee)*
   - **Solana (SOL)** *(Fast)*
   - **Bitcoin (BTC)**
   - **Ethereum (ETH)**
   - **USD Coin (USDC)**
3. The frontend calls `POST /api/wallet/purchase`:
   ```json
   {
     "packageId": "pkg_standard",
     "paymentMethod": "CRYPTO",
     "cryptoOptions": {
       "payCurrency": "usdttrc20"
     }
   }
   ```
4. The user is redirected to the interactive checkout screen ([`/checkout/crypto`](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/src/app/checkout/crypto/page.tsx)):
   - Shows the exact converted crypto price (e.g. `$99.99` = `99.99 USDT` or `0.00155 BTC`).
   - Displays a clean scan-ready QR code and one-click copyable deposit address.
   - 15-minute countdown timer with automatic blockchain detection.
   - In developer mode: includes a **"Simulate Instant On-Chain Confirmation (Sandbox)"** button.

---

## 6. Webhook Processing & Security

Incoming webhooks from the crypto network hit `POST /api/wallet/webhook`.

### 6.1 HMAC-SHA512 Signature Verification
NOWPayments signs incoming IPN events by sorting the payload keys alphabetically and calculating an HMAC-SHA512 hash using your `NOWPAYMENTS_IPN_SECRET`:

```ts
const signature = headers['x-nowpayments-sig'];
const sortedPayload = sortObjectKeys(payload);
const hmac = crypto.createHmac('sha512', process.env.NOWPAYMENTS_IPN_SECRET);
const calculatedSig = hmac.update(JSON.stringify(sortedPayload)).digest('hex');

if (signature.toLowerCase() !== calculatedSig.toLowerCase()) {
  return NextResponse.json({ error: 'Signature mismatch' }, { status: 400 });
}
```

### 6.2 Idempotency Check & Token Credit
```ts
const existingTx = await prisma.transaction.findFirst({
  where: {
    recipientId: userId,
    type: 'PURCHASE',
    metadata: { contains: paymentRef }, // e.g. crypto_123456789
  },
});

if (!existingTx) {
  await WalletService.creditPurchasedTokens(userId, tokens, fiatAmountCents, paymentRef);
}
```

---

## 7. Streamer Crypto Cashouts (Payouts)

Streamers can cash out their earned tokens to any supported cryptocurrency wallet via `/dashboard/streamer/payouts`:

### Pre-Flight Address Validation
Before any tokens are deducted from a streamer's balance, the backend ([`src/app/api/payout/request/route.ts`](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/src/app/api/payout/request/route.ts)) runs strict on-chain format validation:
- **TRON (USDT TRC-20)**: Must start with `T` and be exactly 34 characters long.
- **Ethereum (ETH / USDT ERC-20)**: Must start with `0x` and be exactly 42 characters long.
- **Bitcoin (BTC)**: Must start with `1`, `3`, or `bc1` (25–62 alphanumeric characters).
- **Solana (SOL)**: Must be 32–44 base58 characters.

If an invalid address is provided, the request is rejected immediately with an informative error, protecting the streamer from lost funds.

---

## 8. Zero-Dependency Developer Sandbox Mode

If `NOWPAYMENTS_API_KEY` is omitted in `.env`, the platform automatically runs in **Full Simulation Mode**:
- Clicking "Crypto" in the Token Store routes to [`/checkout/crypto`](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/src/app/checkout/crypto/page.tsx).
- Displays realistic test addresses and QR codes for TRON, Bitcoin, Ethereum, and Solana.
- Clicking **"Simulate Instant On-Chain Confirmation"** immediately credits the test tokens to the user's wallet without spending real crypto.

---

## 9. Troubleshooting & FAQ

### Q: Why is USDT on TRON (TRC-20) recommended over Ethereum (ERC-20)?
**A:** Ethereum network gas fees can fluctuate between $5 and $30 per transaction, making micro-tipping unfeasible. TRON network gas fees are typically under $1.50 with faster confirmation times (~60 seconds).

### Q: What happens if a viewer sends the wrong cryptocurrency to a deposit address?
**A:** Crypto transactions sent to an incompatible network cannot be recovered. The checkout UI clearly displays: *"Send only {coin} on {network}. Automatic detection."* to prevent user error.

### Q: Does the streamer need KYC to cash out in crypto?
**A:** The platform requires basic identity and age verification (18+) before a streamer profile is approved for cashouts.

# Converting Crypto to African Mobile Money (`CRYPTO-CONVERT-MOBILEMONEY.md`)

This guide provides an end-to-end operational manual, step-by-step instructions, and automated architecture for converting cryptocurrency (USDT, BTC, ETH, SOL) into **African Mobile Money** (Vodacom M-Pesa, Orange Money, Airtel Money, Safaricom M-Pesa, MTN Mobile Money, Wave, Afrimoney) and sending funds directly to your mobile phone wallet.

---

## 1. Executive Summary & Conversion Rails

Converting cryptocurrency into African mobile money can be performed via three primary methods:

1. **Binance P2P (Peer-to-Peer) — *⭐ Best for Manual Cashout (0% Fees)***:
   - Available across **18+ African countries**.
   - Direct conversion of USDT/BTC into local cash delivered to your phone.
   - Protected by Binance automated escrow.
2. **Binance Pay / Send Cash — *Automated Direct Transfer***:
   - Direct integration available in select regions (e.g., Kenya, Ghana) where crypto is converted at real-time market rates and deposited to M-Pesa.
3. **Automated Enterprise Off-Ramps (Yellow Card / Kotani Pay API) — *⭐ Best for Platform Broadcaster Payouts***:
   - Fully programmatic API for your streaming platform backend to disburse creator earnings in mobile money after viewers tip in crypto.

---

## 2. Method 1: Binance P2P (Step-by-Step Walkthrough)

### How Escrow Works
```
┌─────────────────┐       1. Locks USDT in Escrow       ┌──────────────────┐
│   Seller (You)  │ ─────────────────────────────────> │  Binance Escrow  │
└────────┬────────┘                                     └─────────┬────────┘
         │                                                        │
         │ 2. Sends Local Currency via Mobile Money               │ 4. Releases USDT
         │    (Vodacom M-Pesa / Safaricom / MTN MoMo)             │    to Buyer
         ▼                                                        ▼
┌─────────────────┐                                     ┌──────────────────┐
│   Buyer (P2P    │ ─────────────────────────────────> │   Buyer Account  │
│   Merchant)     │        3. You Verify Phone Balance  └──────────────────┘
└─────────────────┘           & Click "Payment Received"
```

---

### Step 1: Move Crypto to your Binance Funding Wallet
1. Open the **Binance App** or log in to [binance.com](https://www.binance.com/).
2. Go to **Wallets (Portefeuille) > Transfer (Transférer)**.
3. Set the transfer direction:
   - **From**: *Spot Wallet* (Portefeuille Spot)
   - **To**: *Funding Wallet* (Portefeuille Financement)
   - **Coin**: **USDT** (Tether).
   > **Pro Tip**: If you hold Bitcoin (BTC), Ethereum (ETH), or Solana (SOL), swap them to **USDT** on Binance Convert first. USDT offers the tightest spreads, deepest liquidity, and highest number of Mobile Money buyers.

---

### Step 2: Add your Mobile Money Phone Wallet as a Payment Method
1. In the Binance app, tap your **Profile Icon** (top left).
2. Go to **Payment Methods (Modes de paiement) > P2P Payment Methods**.
3. Tap **Add a payment method (Ajouter un mode de paiement)**.
4. Search for your network:
   - **DR Congo (RDC)**: `Vodacom M-Pesa`, `Orange Money`, `Airtel Money`, or `Afrimoney`.
   - **Kenya**: `M-Pesa (Kenya)` or `Airtel Money`.
   - **Ghana**: `MTN Mobile Money`, `Vodafone/Telecel Cash`, or `AirtelTigo`.
   - **Uganda / Rwanda**: `MTN Mobile Money`, `Airtel Money`.
   - **Cameroon**: `MTN Mobile Money`, `Orange Money`.
   - **Senegal / Côte d’Ivoire**: `Wave`, `Orange Money`, `Moov Money`.
5. Fill in your details:
   - **Account Holder Name**: Must match your KYC legal name on Binance.
   - **Mobile Phone Number**: Enter your full MSISDN with country code (e.g., `+243 81...` or `+254 7...`).
6. Complete SMS / Authenticator verification to save the payment method.

---

### Step 3: Find a Verified Merchant and Place the Sell Order
1. Go to **Trade > P2P** (or tap **P2P Trading** on the Binance App homepage).
2. At the top, select **Sell (Vendre)**.
3. Select **USDT** as the crypto asset.
4. Set the Fiat Currency filter:
   - `CDF` — Congolese Franc (DR Congo)
   - `KES` — Kenyan Shilling (Kenya)
   - `GHS` — Ghanaian Cedi (Ghana)
   - `XAF` — Central African CFA Franc (Cameroon, Congo-Brazzaville, Gabon)
   - `XOF` — West African CFA Franc (Côte d'Ivoire, Senegal, Benin, Togo)
   - `USD` — US Dollar (Available on DRC Vodacom M-Pesa USD wallets)
5. Filter by **Payment Method**: Select your mobile money operator (e.g. `Vodacom M-Pesa`).
6. Filter by **Amount**: Enter the approximate amount you wish to withdraw to hide merchants with high minimum limits.
7. Choose the right merchant using these criteria:
   - **Completion Rate**: Above **98%**.
   - **Total Orders**: At least **100+ orders** completed.
   - **Verified Badge**: Look for the yellow checkmark (Binance Verified Merchant).
8. Tap **Sell (Vendre)** next to the merchant.
9. Enter the quantity of USDT you want to sell (e.g., `50 USDT`).
10. Confirm your selected Mobile Money payment method and tap **Sell USDT**.

---

### Step 4: Wait for Mobile Money Inbound & Confirm Receipt
1. The buyer is given a payment window (usually **15 minutes**) to transfer the funds to your mobile money number.
2. The buyer marks the transaction as **"Paid"**.
3. **DO NOT RELEASE IMMEDIATELY**.
4. **Inspect your phone wallet**:
   - Check the official SMS notification from your telecom provider (e.g., Vodacom, Safaricom, MTN).
   - **Better yet**, open your telecom app (e.g., *M-Pesa App*, *Orange Money App*, *MyMTN*) or dial your balance USSD code:
     - Vodacom DRC: `*1122#`
     - Orange DRC: `*144#`
     - Airtel DRC: `*501#`
     - Safaricom Kenya: `*334#` or `*234#`
     - MTN Ghana: `*170#`
   - Confirm that your mobile money balance has actually increased by the exact agreed amount.
5. Verify that the sender name on the mobile money notification matches the buyer's verified name on Binance.

---

### Step 5: Release the Crypto
1. Return to the Binance P2P screen.
2. Tap **"Payment Received" (Paiement reçu)**.
3. Select the verification checkbox: *"I have received the correct amount of payment and confirmed the sender's account information"*.
4. Authenticate using your Binance 2FA (Google Authenticator, Passkey, or SMS OTP).
5. Binance releases the USDT from escrow to the buyer. The transaction is complete.

---

## 3. Method 2: Binance Pay / Send Cash (Automated Direct Transfer)

In select African countries (Kenya, Ghana, Nigeria), Binance offers **Send Cash** under Binance Pay:

1. Open the Binance App and tap the **Binance Pay icon** (top right on homepage).
2. Tap **Send Cash**.
3. Select destination country and choose **Mobile Money** (e.g., Safaricom M-Pesa).
4. Enter the recipient’s mobile money phone number.
5. Binance displays the live exchange rate (e.g., `1 USDT = 132 KES`).
6. Confirm with your Binance Pay PIN.
7. Funds arrive in the recipient's mobile money wallet automatically within 1 to 5 minutes via Binance’s authorized licensed payment partners.

---

## 4. Method 3: Automated API Off-Ramps for Platform Creators

If you want your platform backend to **automatically convert crypto tips into mobile money payouts** for content creators and streamers:

### Architecture: Crypto Tips to Streamer Mobile Money
```
┌─────────────────────────────────┐
│ 1. Viewer pays Tip in USDT / SOL│  Platform receives Crypto
└────────────────┬────────────────┘  (NOWPayments / Wallet)
                 ▼
┌─────────────────────────────────┐
│ 2. Platform Off-Ramp Engine     │  Triggers Automated Payout
│    (Yellow Card / Kotani Pay)   │  POST /payouts
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│ 3. Mobile Money Telecom Rail    │  Telecom credits streamer phone:
│    (Vodacom, Orange, MTN, M-Pesa│  "$25.00 credited to +243 81 234 5678"
└─────────────────────────────────┘
```

### Top Institutional Off-Ramp Providers:

#### 1. Yellow Card (`yellowcard.io`) — *The Leading African Crypto Rail*
- **Coverage**: DR Congo, Kenya, Cameroon, Ghana, Nigeria, Senegal, Côte d'Ivoire, Uganda, Rwanda, Zambia, Tanzania.
- **Features**:
  - Deposits: USDT (TRC-20, ERC-20), BTC, ETH.
  - Automatic conversion to local currency (CDF, KES, XAF, XOF, GHS).
  - Direct B2C Disbursements API to any African Mobile Money number.
- **API Example (Node.js/TypeScript)**:
  ```typescript
  import axios from 'axios';

  export async function sendMobileMoneyPayout(params: {
    phone: string;
    amount: number;
    currency: 'CDF' | 'KES' | 'USD';
    network: 'VODACOM' | 'ORANGE' | 'AIRTEL' | 'MPESA';
  }) {
    const response = await axios.post(
      'https://api.yellowcard.io/business/v1/disbursements',
      {
        recipient: {
          phone_number: params.phone,
          network: params.network,
        },
        amount: params.amount,
        currency: params.currency,
        reason: 'Streamer earnings cashout',
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.YELLOWCARD_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  }
  ```

#### 2. Kotani Pay (`kotanipay.com`) — *Specialized Crypto-to-MoMo Middleware*
- Seamless API bridging stablecoins (USDT, USDC, cUSD) directly to M-Pesa and MTN MoMo.
- Instant settlement without waiting for manual P2P counterparties.

---

## 5. Country & Telecom Network Matrix

| Country | Local Currency | Supported Mobile Money Networks | Recommended Off-Ramp Route |
| :--- | :---: | :--- | :--- |
| **DR Congo (RDC)** | `CDF` & `USD` | Vodacom M-Pesa, Orange Money, Airtel, Afrimoney | **Binance P2P** (`CDF`/`USD`) or **Yellow Card** |
| **Kenya** | `KES` | Safaricom M-Pesa, Airtel Money | **Binance P2P** or **Binance Send Cash** |
| **Ghana** | `GHS` | MTN Mobile Money, Telecel Cash, AirtelTigo | **Binance P2P** or **Binance Pay** |
| **Cameroon** | `XAF` | MTN MoMo, Orange Money | **Binance P2P** (`XAF`) or **Yellow Card** |
| **Côte d’Ivoire** | `XOF` | Wave, Orange Money, MTN MoMo, Moov | **Binance P2P** (`XOF`) or **Yellow Card** |
| **Senegal** | `XOF` | Wave, Orange Money, Free Money | **Binance P2P** (`XOF`) |
| **Uganda** | `UGX` | MTN MoMo, Airtel Money | **Binance P2P** or **Kotani Pay** |
| **Tanzania** | `TZS` | Vodacom M-Pesa, Tigo Pesa, Airtel Money | **Binance P2P** |

---

## 6. Critical Security Rules & Anti-Scam Protocols

When converting crypto to mobile money via P2P, follow these safety principles:

1. **Verify Official Balances, NOT SMS Screenshots**:
   - Fraudulent buyers can send fake SMS messages imitating telecom headers (SMS Spoofing).
   - Always open your official mobile money app or dial your carrier USSD code (`*1122#`, `*334#`, etc.) to confirm balance increments.
2. **Never Release Before Payment Confirmation**:
   - If the buyer urges you with *"I have already paid, release quickly, my bank is delayed"*, **NEVER** release until the funds are in your wallet.
3. **No Third-Party Payments**:
   - The name of the sender on Mobile Money must match the verified name of the buyer on Binance. If a buyer pays from an unauthorized third party's phone, reject the transaction and file an appeal.
4. **Keep Communications in Binance Chat**:
   - Never continue the trade on WhatsApp, Telegram, or phone calls. All evidence for Binance Customer Support appeals must be documented in the Binance trade chat.
5. **Report & Appeal Promptly**:
   - If a buyer marks the trade as paid but you have not received funds within 15 minutes, click **Appeal (Faire appel)** and submit your mobile money statement screenshot. Binance escrow will keep your crypto safe.

---

## 7. Platform Integration Summary

For our live streaming platform:
- **For Platform Creators & Streamers**: They can link their **Vodacom M-Pesa / Safaricom M-Pesa** number in their Creator Wallet settings. The platform can disburse their token earnings directly to their phone using **Yellow Card / Kotani Pay API**, or streamers can withdraw via USDT and liquidate on **Binance P2P**.
- **For Viewers Buying Tokens**: Viewers can pay with **Crypto (NOWPayments USDT/BTC/SOL)** or **Mobile Money STK Push (PawaPay/CinetPay)** as documented in [CRYPTO-INGEST.md](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/CRYPTO-INGEST.md) and [MOBILEMONEY-AGREGATOR.md](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/MOBILEMONEY-AGREGATOR.md).

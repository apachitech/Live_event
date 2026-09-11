# Production Environment Variable Requirements Guide

This document provides a step-by-step walk-through for obtaining, configuring, and verifying all environment variables required for deploying **PulseStream** on **Render.com**.

---

## Table of Contents
1. [Automatic Variables (Handled by Render Blueprint)](#1-automatic-variables-handled-by-render-blueprint)
2. [Step-by-Step: Platform & App URL](#2-step-by-step-platform--app-url)
3. [Step-by-Step: LiveKit Cloud (Real-time WebRTC Video)](#3-step-by-step-livekit-cloud-real-time-webrtc-video)
4. [Step-by-Step: Payment Processors (Africa & Worldwide)](#4-step-by-step-payment-processors-africa--worldwide)
   - [A. African Founder Payment Strategy (No Stripe / Lemon Squeezy Rejected)](#a-african-founder-payment-strategy-what-to-do-when-stripe--lemonsqueezy-reject-you)
   - [B. Flutterwave (Primary Recommended for Africa — Cards & Mobile Money)](#b-flutterwave-primary-recommended-for-africa--cards--mobile-money)
   - [C. Lemon Squeezy (Merchant of Record — Worldwide)](#c-lemon-squeezy-merchant-of-record--worldwide)
   - [D. CCBill (Adult / High-Risk — US/UK LLC Requirement)](#d-ccbill-adult--high-risk-entertainment--usuk-llc-requirement)
   - [E. Paystack (African Alternative)](#e-paystack-african-alternative)
   - [F. Stripe (Optional — US/EU/UK Only or via US LLC)](#f-stripe-optional--useuuk-only-or-via-us-llc)
5. [Step-by-Step: Cloud Media & VOD Storage (Cloudflare R2)](#5-step-by-step-cloud-media--vod-storage-cloudflare-r2)
6. [Step-by-Step: Cloudinary (Live Video Ingest & Embeds)](#6-step-by-step-cloudinary-live-video-ingest--embeds)
7. [Step-by-Step: 18+ KYC Identity Verification (Optional)](#7-step-by-step-18-kyc-identity-verification-optional)
8. [Summary Reference Table for Render Dashboard](#8-summary-reference-table-for-render-dashboard)
9. [How to Input Variables on Render](#9-how-to-input-variables-on-render)
10. [How Authentication is Handled with Render](#10-how-authentication-is-handled-with-render)

---

## 1. Automatic Variables (Handled by Render Blueprint)

When deploying via `render.yaml`, Render automatically provisions and injects these variables:
- `DATABASE_URL`: Injected automatically from the linked Render PostgreSQL instance.
- `REDIS_URL`: Injected automatically from the linked Render Redis instance.
- `JWT_SECRET`: Automatically generated with a high-entropy cryptographically secure string (`generateValue: true`).
- `NODE_ENV`: Set to `production`.
- `PORT`: Set to `3000`.

> [!NOTE]
> You do **not** need to manually generate values for `DATABASE_URL`, `REDIS_URL`, or `JWT_SECRET` when deploying with the Blueprint.

---

## 2. Step-by-Step: Platform & App URL

### `NEXT_PUBLIC_APP_URL`
This is the public HTTPS URL of your Render service (used for Socket.IO origin protection, webhook verification, and redirects).

1. In the **Render Dashboard**, click on your **`live-streaming-web`** service.
2. Under the service name, copy your default `.onrender.com` domain (e.g. `https://pulsestream.onrender.com`) or your attached custom domain (e.g. `https://live.yourdomain.com`).
3. Set `NEXT_PUBLIC_APP_URL` to this full HTTPS URL (without trailing slash).

---

## 3. Step-by-Step: LiveKit Cloud (Real-time WebRTC Video)

LiveKit Cloud powers the ultra-low latency WebRTC video mesh and OBS RTMP ingest server.

### Required Variables:
- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`

### How to obtain them:
1. Go to **[https://cloud.livekit.io](https://cloud.livekit.io)** and create a free account.
2. Create a new project (e.g., `pulsestream-prod`).
3. In the project dashboard, locate the **Project Settings** (gear icon) → **Keys**.
4. Click **Generate Key**:
   - Copy the **WebSocket URL** (looks like `wss://pulsestream-xxxxxx.livekit.cloud`) ➔ This is `LIVEKIT_URL`.
   - Copy the **API Key** (starts with `API...`) ➔ This is `LIVEKIT_API_KEY`.
   - Copy the **Secret Key** (alphanumeric string) ➔ This is `LIVEKIT_API_SECRET`.
5. *(Optional)* Under **Ingress**, verify that RTMP ingest is enabled for OBS broadcasters.

---

## 4. Step-by-Step: Payment Processors (Africa & Worldwide)

PulseStream features multi-processor payments with automated routing. You **only need to configure the processor(s) you intend to use**.

> [!IMPORTANT]
> **Which Processor Should You Use?**
> - **If you are based in Africa**: Use **[Flutterwave](#b-flutterwave-primary-recommended-for-africa--cards--mobile-money)** (or **[Paystack](#e-paystack-african-alternative)**). You do **NOT** need Stripe or US/European bank accounts. Flutterwave accepts local African IDs, allows fans worldwide to pay with Visa/Mastercard, and deposits payouts directly into your local African bank account or Mobile Money wallet.
> - **If you have an approved Merchant of Record (MoR)**: Use **[Lemon Squeezy](#c-lemon-squeezy-merchant-of-record--worldwide)**.
> - **If you want CCBill (Adult/High-Risk)**: CCBill requires a US/UK company (see [Section D](#d-ccbill-adult--high-risk-entertainment--usuk-llc-requirement) for the US LLC guide).
> - **Stripe**: Optional. Only available if you have a US/EU/UK business entity.

---

### A. African Founder Payment Strategy (What to do when Stripe / LemonSqueezy Reject You)

Many African entrepreneurs get blocked because Stripe does not operate in most African countries, and Lemon Squeezy (now owned by Stripe) frequently rejects African national IDs or virtual bank accounts.

**The Solution:**
1. **Use Flutterwave as your main gateway**: Flutterwave was founded in Africa, is legally incorporated across Africa, accepts your local National ID / Passport / Driver's License without friction, and enables:
   - **International Card Payments**: Viewers in the USA, Europe, Canada, etc. can pay you with **Visa, Mastercard, American Express, or Google Pay** in USD/EUR.
   - **Local African Mobile Money**: Viewers across Africa can pay with **Vodacom M-Pesa, MTN Mobile Money, Orange Money, Airtel, Wave, or Afrimoney**.
   - **Direct Payouts**: Flutterwave deposits your earnings directly to your local bank or Mobile Money wallet.
2. **If you need US processors (Stripe or CCBill) later**:
   - You can form a US Wyoming LLC online via **[Doola](https://www.doola.com)** or **[Firstbase](https://www.firstbase.io)** ($197–$297).
   - They provide an official US address, IRS **EIN**, and an online US business bank account (**Mercury Bank** or **Relay**).
   - With this US company, you can open any US merchant account (CCBill, Stripe, Lemon Squeezy).

---

### B. Flutterwave (Primary Recommended for Africa — Cards & Mobile Money)

Powers instant token purchases via **credit/debit cards globally (Visa, Mastercard, Amex)** and **African Mobile Money** across 30+ African nations (DR Congo, Nigeria, Kenya, Ghana, Côte d'Ivoire, South Africa, Senegal, Cameroon, Rwanda, Uganda, etc.).

#### Required Variables:
- `FLUTTERWAVE_SECRET_KEY`
- `FLUTTERWAVE_SECRET_HASH`

#### Step-by-Step Setup:
1. Go to **[https://dashboard.flutterwave.com/signup](https://dashboard.flutterwave.com/signup)** and register.
2. Complete your identity verification:
   - Choose your African country.
   - Upload your local **National ID Card, International Passport, or Voter's Card**.
   - Link your local bank account or Mobile Money wallet (e.g. M-Pesa, Orange, MTN).
3. In the left navigation, go to **Settings** → **API Keys**:
   - Copy the **Secret Key** (starts with `FLWSECK_TEST-...` for test mode or `FLWSECK_LIVE-...` for production) ➔ This is `FLUTTERWAVE_SECRET_KEY`.
4. In the left navigation, go to **Settings** → **Webhooks**:
   - Set the **Webhook URL** to:
     ```text
     https://live-event-uz3r.onrender.com/api/wallet/webhook
     ```
   - In the **Secret hash** field, enter a custom secret password (e.g., `pulse_flw_secret_2026`).
   - Click **Save**.
   - Copy that secret string ➔ This is `FLUTTERWAVE_SECRET_HASH`.

---

### C. Lemon Squeezy (Merchant of Record — Worldwide)

Lemon Squeezy acts as a Merchant of Record, automatically handling global VAT/sales tax and card checkouts in 135+ currencies.

*(Full setup walkthrough is also available in [**`LEMONSQUEEZY.md`**](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/LEMONSQUEEZY.md))*

#### Required Variables:
- `LEMON_SQUEEZY_API_KEY`
- `LEMON_SQUEEZY_STORE_ID`
- `LEMON_SQUEEZY_WEBHOOK_SECRET`
- `LEMON_SQUEEZY_VARIANT_100`
- `LEMON_SQUEEZY_VARIANT_500`
- `LEMON_SQUEEZY_VARIANT_1200`

#### Step-by-Step Setup:
1. Log into **[https://www.lemonsqueezy.com](https://www.lemonsqueezy.com)**.
2. Go to **Settings** → **Stores** → Copy your **Store ID** (e.g. `123456`) ➔ `LEMON_SQUEEZY_STORE_ID`.
3. Go to **Products** → Create products for your token tiers:
   - `100 Stream Tokens` ($9.99)
   - `500 Stream Tokens` ($44.99)
   - `1,200 Stream Tokens` ($99.99)
   - Under each product's **Variants** tab, click `...` and copy the numeric **Variant ID** (e.g. `589124`) ➔ Set to `LEMON_SQUEEZY_VARIANT_100`, `500`, `1200`.
4. Go to **Settings** → **API Keys** → click **Create API Key** ➔ Copy the token to `LEMON_SQUEEZY_API_KEY`.
5. Go to **Settings** → **Webhooks** → click **Add Webhook**:
   - **Callback URL**: `https://live-event-uz3r.onrender.com/api/wallet/webhook`
   - **Signing Secret**: Any secure string (e.g. `whsec_lemonsqueezy_pulse_2026`) ➔ `LEMON_SQUEEZY_WEBHOOK_SECRET`.
   - **Events**: Check `order_created`.

> [!NOTE]
> If your Lemon Squeezy identity verification was rejected, simply leave these variables blank. Your site will automatically use **Flutterwave** or the sandbox processor without error.

---

### D. CCBill (Adult / High-Risk Entertainment — US/UK LLC Requirement)

CCBill is an industry-standard payment processor for 18+ adult streaming platforms and creator economies.

#### Does CCBill Work in Africa?
- **For Buyers**: **YES.** Any viewer worldwide can pay using an internationally enabled Visa or Mastercard.
- **For Merchants (Sellers)**: **Not directly with a local African bank account.** CCBill requires a registered business entity in the **United States, Canada, the United Kingdom, the European Union, or Australia**.

#### How African Founders Use CCBill:
1. Register a US Wyoming LLC using **[Doola](https://www.doola.com)** or **[Firstbase](https://www.firstbase.io)** ($197–$297 online).
2. Open a US business checking account online via **Mercury Bank** or **Relay Financial**.
3. Apply to CCBill as a US LLC with your US company EIN and bank account.

#### Required Variables:
- `CCBILL_ACCOUNT_NO`
- `CCBILL_SUBACCOUNT_NO`
- `CCBILL_SALT`

#### How to obtain them:
1. Log into your **[CCBill Merchant Portal](https://admin.ccbill.com)**.
2. Copy your 6-digit **Client Account Number** (e.g. `950123`) ➔ `CCBILL_ACCOUNT_NO`.
3. Copy your 4-digit **Subaccount Number** (e.g. `0001`) ➔ `CCBILL_SUBACCOUNT_NO`.
4. Under **Account Info** → **Subaccount Admin** → **Security**, copy the **Encryption Salt** ➔ `CCBILL_SALT`.
5. Set the CCBill Webhook Postback URL to:
   - `https://live-event-uz3r.onrender.com/api/wallet/webhook`

---

### E. Paystack (African Alternative)

If your business is based in **Nigeria, Ghana, Kenya, South Africa, Côte d'Ivoire, or Egypt**, Paystack is another strong African alternative owned by Stripe.

- **Website**: [https://paystack.com](https://paystack.com)
- Accepts local national IDs and local African bank accounts.
- Accepts Visa, Mastercard, Apple Pay, and local bank transfers.

---

### F. Stripe (Optional — US/EU/UK Only or via US LLC)

> [!CAUTION]
> **Stripe does NOT support direct merchant accounts for residents of most African countries.** Do not spend time trying to get Stripe keys unless you have an incorporated US or UK legal entity. If you are in Africa, use **Flutterwave** instead.

#### Required Variables (If you have a US/UK entity):
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

#### How to obtain them:
1. Log in to your **[Stripe Dashboard](https://dashboard.stripe.com)**.
2. Go to **Developers** → **API keys** ➔ Copy **Secret key** (`sk_live_...`) to `STRIPE_SECRET_KEY`.
3. Go to **Developers** → **Webhooks** → Add endpoint `https://live-event-uz3r.onrender.com/api/wallet/webhook` (event: `payment_intent.succeeded`) ➔ Copy **Signing secret** (`whsec_...`) to `STRIPE_WEBHOOK_SECRET`.

---

## 5. Step-by-Step: Cloud Media & VOD Storage (Cloudflare R2)

Cloudflare R2 provides zero-egress-fee S3-compatible cloud storage for user avatars, stream recordings, and pay-per-view VOD uploads.

#### Required Variables:
- `STORAGE_PROVIDER="r2"`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_DOMAIN`

#### How to obtain them:
1. Log into your **[Cloudflare Dashboard](https://dash.cloudflare.com)**.
2. In the left navigation, select **R2 Object Storage**.
3. Click **Create bucket**:
   - Name it (e.g., `pulsestream-vods`) ➔ This is `R2_BUCKET_NAME`.
   - Choose your preferred location (e.g., North America or Western Europe).
4. In the bucket settings, click **Settings** → **Public Access**:
   - Click **Connect Domain** or enable the **R2.dev Subdomain** (e.g. `https://pub-xxxxxx.r2.dev` or `https://vods.yourdomain.com`).
   - Copy the public URL ➔ This is `R2_PUBLIC_DOMAIN`.
5. Back on the main R2 Overview page:
   - On the right sidebar, copy your **Account ID** ➔ This is `R2_ACCOUNT_ID`.
   - Click **Manage R2 API Tokens** → **Create API Token**:
     - Permissions: **Object Read & Write**.
     - Specify bucket: `pulsestream-vods`.
     - Click **Create API Token**.
     - Copy the **Access Key ID** ➔ This is `R2_ACCESS_KEY_ID`.
     - Copy the **Secret Access Key** ➔ This is `R2_SECRET_ACCESS_KEY`.

---

## 6. Step-by-Step: Cloudinary (Live Video Ingest & Embeds)

Used for external video broadcasting, MP4 previews, and HLS adaptive streaming.

#### Required Variable:
- `CLOUDINARY_URL`

#### How to obtain it:
1. Go to **[https://cloudinary.com](https://cloudinary.com)** and log in.
2. On your **Cloudinary Dashboard / Console**:
   - In the **Product Environment Credentials** card, locate the **API Environment variable**.
   - Copy the complete string (formatted as `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`).
   - Paste this as `CLOUDINARY_URL`.

---

## 7. Step-by-Step: 18+ KYC Identity Verification (Optional)

Used for automated broadcaster government ID scanning and age verification (Persona / Veriff).

#### Variables:
- `PERSONA_API_KEY`: From [withpersona.com](https://withpersona.com) Dashboard → API Keys.
- `VERIFF_API_KEY`: From [veriff.com](https://veriff.com) Developer Portal.

*(If left blank, PulseStream's built-in cryptographic self-attestation KYC module handles verification out of the box).*

---

## 8. Summary Reference Table for Render Dashboard

| Variable Name | Required? | Category | Example Value | Where to Get |
| :--- | :---: | :---: | :--- | :--- |
| **`NEXT_PUBLIC_APP_URL`** | **Yes** | Platform | `https://live-event-uz3r.onrender.com` | Render Web Service Dashboard |
| **`LIVEKIT_URL`** | **Yes** | Video | `wss://pulse-xxxx.livekit.cloud` | [LiveKit Cloud](https://cloud.livekit.io) |
| **`LIVEKIT_API_KEY`** | **Yes** | Video | `APICLOUDa1b2c3d4e5` | [LiveKit Cloud](https://cloud.livekit.io) |
| **`LIVEKIT_API_SECRET`** | **Yes** | Video | `9f8e7d6c5b4a3...` | [LiveKit Cloud](https://cloud.livekit.io) |
| **`FLUTTERWAVE_SECRET_KEY`** | **Recommended (Africa)** | Payment | `FLWSECK_LIVE-...` | [Flutterwave Dashboard](https://dashboard.flutterwave.com) |
| **`FLUTTERWAVE_SECRET_HASH`** | **Recommended (Africa)** | Payment | `your_secret_hash_key` | [Flutterwave Webhooks](https://dashboard.flutterwave.com) |
| **`LEMON_SQUEEZY_API_KEY`** | Optional (MoR) | Payment | `eyJhbGci...` | [Lemon Squeezy API Keys](https://lemonsqueezy.com) |
| **`LEMON_SQUEEZY_STORE_ID`** | Optional (MoR) | Payment | `123456` | [Lemon Squeezy Stores](https://lemonsqueezy.com) |
| **`LEMON_SQUEEZY_WEBHOOK_SECRET`** | Optional (MoR) | Payment | `whsec_...` | [Lemon Squeezy Webhooks](https://lemonsqueezy.com) |
| **`LEMON_SQUEEZY_VARIANT_100`** | Optional (MoR) | Payment | `589124` | Lemon Squeezy Product Variant |
| **`LEMON_SQUEEZY_VARIANT_500`** | Optional (MoR) | Payment | `589125` | Lemon Squeezy Product Variant |
| **`LEMON_SQUEEZY_VARIANT_1200`** | Optional (MoR) | Payment | `589126` | Lemon Squeezy Product Variant |
| **`CCBILL_ACCOUNT_NO`** | Optional (Requires US LLC) | Payment | `951234` | [CCBill Admin Portal](https://admin.ccbill.com) |
| **`CCBILL_SUBACCOUNT_NO`** | Optional (Requires US LLC) | Payment | `0001` | [CCBill Admin Portal](https://admin.ccbill.com) |
| **`CCBILL_SALT`** | Optional (Requires US LLC) | Payment | `A1B2C3D4E5F6` | [CCBill Subaccount Security](https://admin.ccbill.com) |
| **`STRIPE_SECRET_KEY`** | Optional (Requires US LLC) | Payment | `sk_live_51...` | [Stripe Dashboard](https://dashboard.stripe.com) |
| **`STRIPE_WEBHOOK_SECRET`** | Optional (Requires US LLC) | Payment | `whsec_...` | [Stripe Webhooks](https://dashboard.stripe.com/webhooks) |
| **`STORAGE_PROVIDER`** | **Yes** | Media | `r2` (or `local`) | Setting: `r2` |
| **`R2_ACCOUNT_ID`** | Optional | Media | `8a9b7c6d5e4f3a...` | [Cloudflare R2](https://dash.cloudflare.com) |
| **`R2_ACCESS_KEY_ID`** | Optional | Media | `e3b0c44298fc1c...` | [Cloudflare R2 API Tokens](https://dash.cloudflare.com) |
| **`R2_SECRET_ACCESS_KEY`** | Optional | Media | `1234567890abcdef...` | [Cloudflare R2 API Tokens](https://dash.cloudflare.com) |
| **`R2_BUCKET_NAME`** | Optional | Media | `pulsestream-vods` | [Cloudflare R2](https://dash.cloudflare.com) |
| **`R2_PUBLIC_DOMAIN`** | Optional | Media | `https://vods.yourdomain.com` | [Cloudflare R2 Public Bucket Settings](https://dash.cloudflare.com) |
| **`CLOUDINARY_URL`** | Optional | Video | `cloudinary://key:secret@name` | [Cloudinary Console](https://cloudinary.com) |

---

## 9. How to Input Variables on Render

1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Open your service (`live-streaming-web`).
3. Click the **Environment** tab on the left.
4. Click **Add Environment Variable**.
5. Paste the Key and Value from the table above.
6. Click **Save Changes** — Render will automatically trigger a zero-downtime rolling deployment with the new configuration.

---

## 10. How Authentication is Handled with Render

When PulseStream runs on Render.com, authentication operates across four tightly integrated, secure layers:

```mermaid
sequenceDiagram
    autonumber
    actor User as Browser / Mobile Client
    participant Edge as Render Edge / SSL Proxy
    participant Mid as Next.js Middleware (Edge Runtime)
    participant App as Web Service (/api/auth)
    participant DB as Render Managed PostgreSQL

    User->>App: POST /api/auth/login or /register (credentials)
    App->>DB: Query/Verify password hash (bcrypt)
    DB-->>App: User record & role verified
    App->>App: Sign JWT with Render-injected JWT_SECRET
    App-->>User: Set-Cookie: live_session_token (HttpOnly, Secure, SameSite=Lax)
    
    Note over User,Edge: Subsequent Protected Requests (/admin, /dashboard/streamer)
    User->>Edge: GET /dashboard/streamer (Cookie attached)
    Edge->>Mid: Forward request with TLS Termination
    Mid->>Mid: Verify JWT signature & check role permissions
    alt Token valid & role allowed
        Mid->>App: Forward to protected page/API
        App-->>User: Render Dashboard Studio
    else Token missing or insufficient role
        Mid-->>User: HTTP 307 Redirect to /login?redirect=...
    end
```

### 1. Cryptographic Secret Management (`JWT_SECRET`)
- **Automatic Generation**: In `render.yaml`, `JWT_SECRET` is marked with `generateValue: true`. When Render creates the Web Service, its internal vault automatically generates a 256-bit high-entropy secret.
- **Persistent Vaulting**: Render preserves this secret across redeploys, rollbacks, and git pushes. Your users will **never** be logged out unexpectedly when you push new code to production.
- **Token Signing**: Server-side endpoints (`/api/auth/login` and `/api/auth/register`) sign session payloads with standard HS256 JWT tokens containing:
  - `userId`
  - `email`
  - `username`
  - `role` (`VIEWER`, `STREAMER`, `ADMIN`)
  - `ageVerified` (`true`/`false`)
  - `exp` (7-day rolling expiry)

### 2. Cookie Security over Render HTTPS
Render provides free, automated Let's Encrypt SSL/TLS termination for all `*.onrender.com` services and custom domains. The authentication cookie configuration in `src/lib/auth.ts` leverages this natively:
- **`HttpOnly: true`**: Inaccessible to client JavaScript, making session tokens 100% immune to Cross-Site Scripting (XSS) extraction.
- **`Secure: true`**: Automatically enabled when `NODE_ENV=production` on Render; the browser will only transmit the cookie over encrypted HTTPS channels.
- **`SameSite: "lax"`**: Protects against Cross-Site Request Forgery (CSRF) while allowing natural link navigation.
- **`Path: "/"`**: Available across all sub-paths of the platform.

### 3. Edge Routing & Role Protection via Middleware (`src/middleware.ts`)
Render forwards incoming requests through its distributed HTTP routing layer. Before a request even reaches your Next.js application rendering tree, Next.js Middleware intercepts it:
- **Protected Streamer Routes**: `/dashboard/streamer/*`, `/dashboard/streamer/payouts`, `/dashboard/streamer/vods`.
  - Must have an active cookie and a role of either `STREAMER` or `ADMIN`.
  - Non-streamers are redirected back to the home directory.
  - Unauthenticated guests are redirected to `/login?redirect=...`.
- **Protected Admin Routes**: `/admin/*`.
  - Strictly restricted to users with `role === "ADMIN"`.
- **Stateless Verification**: The middleware decodes and verifies the cryptographic signature on the edge without making unnecessary database trips, ensuring lightning-fast response times.

### 4. Database Persistence with Render PostgreSQL (`DATABASE_URL`)
- **Direct Database Link**: Render injects the internal connection string `postgresql://liveuser:...@live-stream-postgres:5432/livestreampform?sslmode=require`.
- **Hard Data Storage**:
  - `User` table stores `email`, `username`, `passwordHash` (salted with bcrypt 10 rounds), `dob`, `ageVerifiedAt`, and `role`.
  - `Wallet` table stores live balances (`balance` and cashable `earnedBalance`).
  - `StreamerProfile` stores verified KYC status, display names, and payment details.
- **No In-Memory Session Loss**: Because sessions are stateless JWT cookies linked to persistent database records in PostgreSQL, your platform scales horizontally across multiple Render instances without requiring sticky sessions or complex session servers.

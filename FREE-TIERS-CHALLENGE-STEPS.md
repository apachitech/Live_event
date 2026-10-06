# Step-by-Step Guide: The $0/Month Free Tiers Challenge for PulseStream

This guide walks you through every single click, command, and setting needed to deploy **PulseStream** on the cloud for **$0.00 / month**, while maintaining **24/7 high availability, real-time WebSockets, live video streaming, and zero server sleeping**.

---

## 📋 Challenge Overview

| Service | Role | Provider | Cost | Why This Tier? |
| :--- | :--- | :--- | :--- | :--- |
| **Web & WebSockets** | Next.js 14 + Socket.IO Server | **Render Free Web Service** | **$0.00** | 750 free hours/month (covers all 744h in a month) |
| **Keep-Alive Bot** | Prevents Render from sleeping | **UptimeRobot / Cron-Job.org** | **$0.00** | Pings `/api/health` every 10 min to keep server awake 24/7 |
| **PostgreSQL Database** | Users, Stream Rooms, VODs | **Supabase** (or Neon.tech) | **$0.00** | 500 MB permanent DB + SSL + automated backups |
| **Redis Cache** | Socket.IO Clustering & Queues | **Upstash Redis** | **$0.00** | 10,000 commands/day + native TLS (`rediss://`) |
| **Live Video WebRTC** | Media Server SFU & Ingest | **LiveKit Cloud** | **$0.00** | 50 GB monthly bandwidth + 100 participant minutes |
| **VOD & Media Storage**| Recordings & Thumbnails | **Cloudflare R2** | **$0.00** | 10 GB storage + **$0.00 egress bandwidth fees forever** |
| **CDN & DDoS Shield** | Global Caching & Free SSL | **Cloudflare Free Plan** | **$0.00** | Edge caching, bot defense, automated SSL |
| **Total Monthly Bill** | | | **$0.00** | **100% Free Forever** |

**Estimated Setup Time:** ~25 to 30 minutes.

---

## 🛠️ Phase 1: Create Your Free PostgreSQL Database (Supabase)

Render's built-in free PostgreSQL database expires and drops after 30 days. Supabase gives you a **permanent free PostgreSQL database**.

### Step 1.1: Sign up on Supabase
1. Open [supabase.com](https://supabase.com).
2. Click **Start your project** and sign in with your GitHub account.

### Step 1.2: Create a New Project
1. Click **+ New Project**.
2. **Name**: `pulsestream-db`
3. **Database Password**: Click *Generate a password* (or type a strong password) and **copy it to a secure note**.
4. **Region**: Choose the region closest to where you plan to host Render (e.g., `Frankfurt (eu-central-1)` or `East US (us-east-1)`).
5. **Pricing Plan**: Ensure **Free ($0/month)** is selected.
6. Click **Create new project** and wait ~2 minutes for it to provision.

### Step 1.3: Retrieve Your Connection String
1. In your Supabase project dashboard, click the **Project Settings** (gear icon) in the bottom-left sidebar.
2. Navigate to **Database**.
3. Scroll down to the **Connection string** section.
4. Select the **URI** tab.
5. Choose **Transaction Pooler** (recommended for Prisma on serverless/containers, port `6543`) or **Session Pooler** (port `5432`).
6. Copy the connection string. It will look like this:
   ```text
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require
   ```
7. Replace `[YOUR-PASSWORD]` with the actual database password you saved in Step 1.2.
8. Save this string as your **`DATABASE_URL`**.

### Step 1.4: Push the Database Schema from Your Computer
Open PowerShell in your local project directory (`c:\Users\XPRISTO\Desktop\tva\Live_event`) and run:
```powershell
$env:DATABASE_URL="postgresql://postgres.[PROJECT-REF]:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require"
npx prisma db push
```
*(Prisma will connect to Supabase and create all tables: `User`, `Stream`, `Vod`, `Transaction`, `Wallet`, etc. in seconds).*

---

## ⚡ Phase 2: Create Your Free Redis Cluster (Upstash)

PulseStream uses Redis for Socket.IO room tracking, tipping alerts, and background job queues.

### Step 2.1: Sign up on Upstash
1. Open [upstash.com](https://upstash.com).
2. Click **Sign In** and authenticate using GitHub.

### Step 2.2: Create a Serverless Redis Database
1. In the Upstash console, click **Create Database**.
2. **Name**: `pulsestream-redis`
3. **Type**: **Regional** (Free tier).
4. **Region**: Select the same geographical region as your Supabase database (e.g. `eu-central-1` Frankfurt or `us-east-1` N. Virginia).
5. **TLS**: Ensure TLS is **Enabled** (required for secure connections).
6. Click **Create**.

### Step 2.3: Copy the Node.js Connection String
1. Scroll down to the **Connect to your database** section.
2. Click on the **Node** or **ioredis** tab.
3. Copy the URL starting with `rediss://`. Example:
   ```text
   rediss://default:AbCdEf123456@eu1-tender-marmot-12345.upstash.io:6379
   ```
4. Save this string as your **`REDIS_URL`**.

---

## 📹 Phase 3: Live Video WebRTC Setup (LiveKit Cloud)

LiveKit Cloud powers the real-time, sub-second WebRTC video broadcast and viewer streams.

### Step 3.1: Sign up on LiveKit Cloud
1. Open [cloud.livekit.io](https://cloud.livekit.io).
2. Click **Get Started for Free** and sign in with GitHub.
3. No credit card is required to access the free tier.

### Step 3.2: Create a Project & Generate Keys
1. Create a project named `PulseStream`.
2. Under **Project Settings** > **Keys**, click **Generate Access Key**.
3. Copy the 3 values:
   - **`LIVEKIT_URL`**: `wss://your-subdomain.livekit.cloud`
   - **`LIVEKIT_API_KEY`**: `APIxxxxxxxxx`
   - **`LIVEKIT_API_SECRET`**: `secretxxxxxxxxx`
4. The free tier gives you **50 GB of monthly video transfer**, which covers approximately 70–100 hours of live broadcasts every month for $0.

---

## 🗄️ Phase 4: Free VOD & Image Storage (Cloudflare R2)

Uploaded videos, stream recordings, and user avatars need reliable cloud storage. Unlike Amazon S3, Cloudflare R2 has **zero egress bandwidth fees**.

### Step 4.1: Sign up on Cloudflare & Create R2 Bucket
1. Open [dash.cloudflare.com](https://dash.cloudflare.com) and log in.
2. In the left sidebar, click **R2**.
3. Click **Create Bucket**.
4. **Bucket Name**: `pulsestream-vods`
5. Click **Create Bucket**.

### Step 4.2: Enable Public URL Access
1. Inside your `pulsestream-vods` bucket, go to the **Settings** tab.
2. Scroll to **Public Access** > **R2.dev subdomain**.
3. Click **Allow Access** and type `allow`.
4. Copy the public URL (e.g., `https://pub-a1b2c3d4e5.r2.dev`). Save this as **`R2_PUBLIC_DOMAIN`**.

### Step 4.3: Generate R2 API Credentials
1. In the R2 Overview page, click **Manage R2 API Tokens** on the right side.
2. Click **Create API Token**.
3. **Permissions**: Select **Admin Read & Write**.
4. Click **Create API Token**.
5. Copy the following keys immediately:
   - **Account ID** (from the R2 overview page): Save as **`R2_ACCOUNT_ID`**.
   - **Access Key ID**: Save as **`R2_ACCESS_KEY_ID`**.
   - **Secret Access Key**: Save as **`R2_SECRET_ACCESS_KEY`**.

---

## 🚀 Phase 5: Deploy the Web Service on Render (Free Plan)

Now that your external free database, Redis, LiveKit, and R2 storage are configured, deploy **only the Web Service** on Render.

> [!IMPORTANT]
> **Do NOT use Render Blueprints (`render.yaml`) for the $0 plan!**
> The blueprint will automatically spin up Render's paid PostgreSQL ($7), paid Redis ($7), and paid Worker ($7). Instead, follow the simple manual Web Service creation below.

### Step 5.1: Create a Render Web Service
1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** in the top-right corner and select **Web Service**.
3. Select **Build and deploy from a Git repository**.
4. Connect your GitHub repository (`apachitech/Live_event`).

### Step 5.2: Configure Service Parameters
Fill in the deployment details exactly as follows:

| Field | Value |
| :--- | :--- |
| **Name** | `pulsestream-live` |
| **Language / Runtime** | `Node` |
| **Region** | Choose Frankfurt (Europe) or Oregon/Ohio (US) matching Supabase |
| **Branch** | `main` |
| **Build Command** | `npm install && npx prisma generate && npm run build` |
| **Start Command** | `npm run start` |
| **Instance Type** | **Free (0.5 CPU, 512 MB RAM, 750 free hours/mo)** |

### Step 5.3: Set Health Check Path
Click **Advanced** at the bottom of the form:
- **Health Check Path**: Type `/api/health`
- *(This tells Render where to verify your app is running healthy).*

### Step 5.4: Add All Free Environment Variables
Under the **Environment Variables** section, add the keys we prepared:

```env
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://pulsestream-live.onrender.com
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require
REDIS_URL=rediss://default:PASSWORD@your-endpoint.upstash.io:6379
JWT_SECRET=super_secret_jwt_key_random_32_characters_here
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=pulsestream-vods
R2_PUBLIC_DOMAIN=https://pub-xxxxxx.r2.dev
```

*(You can also add `SASPAY_CLIENT_ID`, `VAULTPAY_MERCHANT_ID`, etc., if using payment gateways).*

### Step 5.5: Deploy
Click **Create Web Service**.
Render will clone your repository, run the build command, generate Prisma clients, and deploy your container. Once complete, you will see:
`==> Your service is live at https://pulsestream-live.onrender.com`

---

## ⏱️ Phase 6: The "Free Tier Challenge" Master Hack — 24/7 Keep-Alive

### The Problem
Render Free tier containers shut down into sleep mode if they do not receive HTTP requests for **15 consecutive minutes**. The next visitor experiences a 45-second delay while the container boots up.

### The 100% Free Solution
Use a free uptime robot to ping PulseStream's lightweight health check endpoint every **10 minutes**. Because traffic hits your server every 10 minutes, **Render never sleeps**, keeping WebSockets, chat, and stream viewers connected 24/7 for $0.

### Step 6.1: Set up UptimeRobot
1. Open [uptimerobot.com](https://uptimerobot.com) and create a free account.
2. In the dashboard, click **+ Add New Monitor**.
3. **Monitor Type**: Select **HTTP(s)**.
4. **Friendly Name**: `PulseStream 24/7 Keep-Alive`.
5. **URL (or IP)**: `https://pulsestream-live.onrender.com/api/health`
6. **Monitoring Interval**: Set to **Every 10 minutes** (or 5 minutes).
7. **Monitor Timeout**: 30 seconds.
8. Click **Create Monitor**.

### Step 6.2: Add Redundant Backup Pinger (Optional, 100% Free)
For guaranteed redundancy in case one monitor hiccups:
1. Open [cron-job.org](https://cron-job.org) and register for free.
2. Click **Create Cronjob**.
3. **Title**: `Render Stay-Awake Ping`.
4. **URL**: `https://pulsestream-live.onrender.com/api/health`
5. **Schedule**: *Every 10 minutes*.
6. Click **Create**.

> [!TIP]
> PulseStream's `/api/health` endpoint responds with a tiny `200 OK` JSON in under 5 milliseconds and uses negligible CPU/memory. It will keep your Render service awake 744 hours a month within your 750 free hours budget.

---

## 🌐 Phase 7: Connect Custom Domain with Free SSL (Cloudflare)

You don't have to keep the `.onrender.com` URL. You can connect your custom domain (`yourdomain.com`) with free Cloudflare DDoS protection.

### Step 7.1: Add Domain to Render
1. In the Render Dashboard, open `pulsestream-live`.
2. Go to **Settings** > **Custom Domains**.
3. Click **Add Custom Domain** and enter:
   - `yourdomain.com`
   - `www.yourdomain.com`

### Step 7.2: Configure DNS in Cloudflare
1. Go to your Cloudflare DNS dashboard for your domain.
2. Add a **CNAME** record:
   - **Name**: `www`
   - **Target**: `pulsestream-live.onrender.com`
   - **Proxy status**: **Proxied (Orange Cloud)**
3. Add a **CNAME** (or ALIAS/ANAME) for root `@`:
   - **Name**: `@`
   - **Target**: `pulsestream-live.onrender.com`
   - **Proxy status**: **Proxied**
4. Under Cloudflare **SSL/TLS**, set encryption mode to **Full** (or **Full (Strict)**).

---

## 🧪 Phase 8: Verification & Smoke Test Checklist

Once all steps are finished, test your free-tier deployment:

1. **Verify Health Check Endpoint**:
   - Open in browser: `https://your-app.onrender.com/api/health`
   - Expected Output: `{"status":"healthy","uptime":...}` with status 200.
2. **Verify Database Connection**:
   - Visit `/login` or `/register` and create a test user.
   - Check Supabase Table Editor: see the new record in the `User` table.
3. **Verify Real-Time WebSockets**:
   - Open a live watch room: `/watch/[streamId]`.
   - Send a chat message. Check that it appears instantly without lag.
4. **Verify Live Stream Video**:
   - Log into `/dashboard/streamer` and start a test camera broadcast.
   - Open the room in an Incognito window: verify real-time WebRTC video playback via LiveKit Cloud.
5. **Verify Pay-Per-View VOD Paywall**:
   - Go to `/vods`. Check that premium VODs hide the raw video URL from unauthenticated guests and prompt them to log in.

---

## 💰 Cost Breakdown Review: What You Paid

| Item | Cost |
| :--- | :--- |
| Render Web Service | **$0.00** |
| Supabase PostgreSQL | **$0.00** |
| Upstash Redis Cache | **$0.00** |
| LiveKit WebRTC Video | **$0.00** |
| Cloudflare R2 Media Storage | **$0.00** |
| Cloudflare SSL & CDN | **$0.00** |
| UptimeRobot Keep-Alive Bot | **$0.00** |
| **Total Out-of-Pocket Expense** | **$0.00 / month** |

Congratulations! You have completed the **Free Tiers Challenge**. You have a complete, production-grade live streaming platform operating on the cloud with **zero monthly fees**.

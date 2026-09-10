# Production Deployment Guide: Deploying PulseStream to Render.com

This guide provides step-by-step instructions to deploy **PulseStream** on [Render.com](https://render.com) using the included `render.yaml` Infrastructure-as-Code blueprint.

---

## 1. Architecture Overview on Render

Render manages 4 connected resources:
1. **`live-streaming-web`** (Web Service):
   - Runs Next.js 14, custom Node.js HTTP server, and Socket.IO real-time websockets on port 3000.
   - Built-in zero-downtime health probing at `/api/health`.
2. **`live-streaming-worker`** (Background Worker):
   - Processes periodic recurring subscriptions, automated VOD stream archival, and streamer payout transfers.
3. **`live-stream-postgres`** (Managed PostgreSQL):
   - Production PostgreSQL database with SSL encryption.
4. **`live-stream-redis`** (Managed Redis):
   - Key-Value store for real-time pub/sub, rate limiting, and viewer room state.

---

## 2. One-Click Blueprint Deployment

1. **Push your repository to GitHub or GitLab**:
   ```bash
   git init
   git add .
   git commit -m "feat: complete production ready live streaming platform"
   git remote add origin https://github.com/yourusername/pulsestream.git
   git push -u origin main
   ```

2. **Open Render Dashboard**:
   - Navigate to [dashboard.render.com](https://dashboard.render.com).
   - Click **New +** → **Blueprint**.
   - Connect your GitHub/GitLab repository.
   - Render will automatically parse [render.yaml](file:///c:/Users/XPRISTO/Desktop/tva/Live_event/render.yaml).

3. **Configure Environment Variables in Render Dashboard**:
   Fill in your third-party credentials:
   - **`NEXT_PUBLIC_APP_URL`**: Your assigned Render web service URL (e.g. `https://pulsestream.onrender.com`).
   - **`LIVEKIT_URL`**, **`LIVEKIT_API_KEY`**, **`LIVEKIT_API_SECRET`**: From your [LiveKit Cloud Dashboard](https://cloud.livekit.io).
   - **`STRIPE_SECRET_KEY`**, **`STRIPE_WEBHOOK_SECRET`**: From Stripe Developers.
   - **`FLUTTERWAVE_SECRET_KEY`**, **`FLUTTERWAVE_SECRET_HASH`**: For African Mobile Money (DR Congo M-Pesa, Orange, Airtel).
   - **`CCBILL_ACCOUNT_NO`**, **`CCBILL_SUBACCOUNT_NO`**, **`CCBILL_SALT`**: High-risk processor keys.
   - **`R2_ACCOUNT_ID`**, **`R2_ACCESS_KEY_ID`**, **`R2_SECRET_ACCESS_KEY`**, **`R2_BUCKET_NAME`**, **`R2_PUBLIC_DOMAIN`**: Cloudflare R2 media storage.

4. **Click Apply**:
   Render will provision the PostgreSQL database, Redis instance, build the web service bundle, push the database schema, and launch the web app with automated health monitoring.

---

## 3. Pre-Flight Verification Command

Before deploying, verify your environment locally:
```bash
node scripts/check-production-config.js
```

---

## 4. Key Production Endpoints

- **Live Directory**: `https://your-domain.com/`
- **Mobile Explore Swipe Feed**: `https://your-domain.com/explore`
- **Pay-Per-View VODs**: `https://your-domain.com/vods`
- **Broadcast Studio**: `https://your-domain.com/dashboard/streamer`
- **Health Check**: `https://your-domain.com/api/health`
- **18 U.S.C. 2257 Record-Keeping**: `https://your-domain.com/compliance-2257`
- **Terms of Service**: `https://your-domain.com/terms`
- **Privacy Policy**: `https://your-domain.com/privacy`

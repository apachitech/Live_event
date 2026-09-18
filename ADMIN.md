# Platform Administrator Guide (`ADMIN.md`)

This comprehensive guide covers everything required to access, configure, and operate the platform as an **Administrator**, both in local development and live on **Render**.

---

## 1. Default Admin Credentials

When the database is initialized or seeded, a built-in administrator account is automatically provisioned with full platform privileges:

| Credential Field | Value | Details |
| :--- | :--- | :--- |
| **Email or Username** | `PlatformAdmin` *(or `admin@platform.live`)* | Case-insensitive identifier |
| **Password** | `Password123!` | Case-sensitive password |
| **Role** | `ADMIN` | Unrestricted administrative access |
| **Age Verification** | `Pre-verified (18+)` | Bypasses age restriction gate |
| **Initial Wallet** | `10,000 Tokens` | Pre-funded for platform testing |

---

## 2. How to Log In

### A. Local Development
1. Open your browser and navigate to:
   ```text
   http://localhost:3000/login
   ```
2. Enter `PlatformAdmin` (or `admin@platform.live`) in the identifier box.
3. Enter `Password123!` in the password box.
4. Click **Sign In**.

### B. Live Application on Render
1. Open your deployed live URL:
   ```text
   https://<your-render-service>.onrender.com/login
   ```
2. Enter `PlatformAdmin` (or `admin@platform.live`).
3. Enter `Password123!`.
4. Click **Sign In**.

Once authenticated, a red **`🛡️ Admin`** navigation button will immediately appear in the top header on every page, granting one-click access to the admin portal.

---

## 3. Promoting a Personal Account to Admin (Render / Production)

If you registered your own personal email (or signed in via Google) on your live Render app and want **your personal account** to have full `ADMIN` rights, use either method below:

### Method A: Via Render Web Shell (Fastest)
1. Go to your **Render Dashboard** → click your **Web Service** (`live-streaming-web`).
2. Click the **Shell** tab on the left sidebar.
3. Paste and run this one-line command (replace with your email):
   ```bash
   node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.user.update({ where: { email: 'your-email@example.com' }, data: { role: 'ADMIN' } }).then(() => console.log('✔ Promoted to ADMIN!')).finally(() => p.$disconnect());"
   ```
4. Log out and log back into your live app. Your account now has the `ADMIN` role.

### Method B: Via Render PostgreSQL Database
1. In your **Render Dashboard**, open your PostgreSQL database (`live-stream-postgres`).
2. Under the **Connect** tab, open the **PSQL CLI** or connect using any database tool (TablePlus, pgAdmin, DBeaver).
3. Run:
   ```sql
   UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
   ```

### Method C: Run Database Seed on Render
If you have a fresh Render database and want to provision the default `PlatformAdmin` user manually:
In the Render Web Service **Shell** tab, run:
```bash
npm run db:seed
```

---

## 4. Admin Feature Suite & Operations

### 4.1. Site Name & Branding CRUD
- **Location:** `/admin/settings?tab=branding`
- **Capabilities:**
  - **Site Name (Brand Title):** Update the brand name (e.g. from `PulseStream` to your company or project name).
  - **Site Tagline & Slogan:** Customize the platform tagline shown under logos and headers.
  - **Meta Description:** Set SEO descriptions for search engines and social cards.
  - **Support Email:** Update customer support and billing contact email.
- **Global Real-Time Propagation:**
  - Changes are stored in `PlatformSetting` and broadcast via real-time WebSockets (`site_settings_updated`).
  - Automatically updates the **Navbar logo**, **Footer brand**, **Token Purchase Modals**, and **Browser Tab Title (`document.title`)** without requiring users to refresh the page.
  - Includes a "Reset to Defaults" button to restore original branding anytime.

---

### 4.2. Token Pricing & Economy Organizer
- **Location:** `/admin/settings?tab=pricing`
- **Capabilities:**
  - **Visual Package Tier Cards:** Edit existing packages or add new bundles.
  - **Token Quantities & Pricing:** Set token counts, bonus incentives, and prices in USD ($).
  - **Featured / Popular Badges:** Toggle highlighting to showcase best-value bundles.
  - **Token Cashout Exchange Rate:** Set baseline fiat rate per token (e.g. `5¢ = $0.05 USD`) for streamer cashouts.
  - **Instant Storefront Sync:** Public purchase modal (`TokenPurchaseModal`) dynamically renders the active database tiers.

---

### 4.3. Token Distribution (Airdrops & Direct Credits)
- **Location:** `/admin/settings?tab=distribute`
- **Capabilities:**
  - **Target: Specific User:**
    - Type-ahead search autocomplete looks up users by `@username`, email, or user ID.
    - Displays current token balance and recipient avatar.
  - **Target: All Users (Platform Community Airdrop):**
    - One-click distribution that credits tokens to every registered member in the system simultaneously.
  - **Destination Wallet Selector:**
    - *Viewer Balance:* Tokens for chatting, sending tips, and buying VODs.
    - *Streamer Earned Balance:* Cashable balance eligible for payouts.
  - **Custom Memo / Reason:** Attach notes such as *"Spring Welcome Gift"*, *"Contest Winner"*, or *"Platform Bonus"*.
  - **Real-Time Notification:** Emits a socket event (`wallet_balance_updated` or global airdrop alert) to update the recipient's UI instantly.
  - **Audit Logging:** Every distribution records a `Transaction` (`type: 'ADMIN_DISTRIBUTION'`) and an immutable `AuditLog` entry.

---

### 4.4. Advertisements & Sponsored Promotions
- **Location:** `/admin/ads`
- **Capabilities:**
  - **Campaign Analytics:** Live counters for Total Impressions, Total Clicks, and aggregate Click-Through Rate (CTR %).
  - **Create Advertisement Modal:**
    - Enter Title, Image URL (with live preview), and Target Landing URL.
    - Choose Placement:
      - `FEED`: Vertical swipe feed sponsored card on `/explore`.
      - `DIRECTORY`: Top sponsored banner on `/live`.
      - `WATCH`: Video player overlay banner.
    - Quick template buttons (Creator Festival, Token Sale, Streamer Gear).
  - **Active / Paused Status Toggle:** Turn campaigns on or off with a single click.
  - **Delete Campaign:** Permanently remove outdated advertisements.
  - **Automatic Tracking:** Frontend components call `/api/ads/public` to log impressions and track clicks automatically.

---

### 4.5. Streamer Payout Approval Queue
- **Location:** `/admin` (or `/admin#payouts`)
- **Capabilities:**
  - Broadcasters with verified KYC submit cashout requests once they hit the minimum token threshold.
  - Admin reviews requested token deductions and corresponding USD amounts.
  - Single-click **Approve** (marks payout completed and generates payment reference) or **Reject** (refunds earned tokens back to the streamer's balance).

---

### 4.6. Content Moderation & Anti-Spam Rules
- **Location:** `/admin/moderation` and `/admin/settings?tab=rules`
- **Capabilities:**
  - Review flagged chat messages and reported stream rooms.
  - Adjust the **Streamer Revenue Split %** (e.g. 70% streamer / 30% platform fee).
  - Set the **Minimum Cashout Threshold** (e.g. 1,000 tokens = $50 USD).
  - Configure the **Chat Anti-Spam Rate Limit** (maximum messages allowed per 4-second rolling window).

---

## 5. Admin Navigation & Route Directory

| Page / Component | URL Path | Description |
| :--- | :--- | :--- |
| **Admin Overview & Control Center** | `/admin` | Metrics, analytics cards, quick navigation, and payout queue |
| **Site Branding CRUD** | `/admin/settings?tab=branding` | Change site name, slogans, description, and support email |
| **Token Pricing Organizer** | `/admin/settings?tab=pricing` | Customize token packages, dollar pricing, bonuses, and badges |
| **Distribute Tokens** | `/admin/settings?tab=distribute` | Airdrop or credit tokens to individual users or all users |
| **Platform Economics & Rules** | `/admin/settings?tab=rules` | Configure revenue splits, payout minimums, and chat rate limits |
| **Advertisements Manager** | `/admin/ads` | Create, manage, and monitor sponsored banners and swipe ads |
| **Moderation Queue** | `/admin/moderation` | Review flagged content, reports, and user compliance |
| **Change Data Audit Logs** | `/admin/audit` | View immutable audit trail logs for all administrative actions |

---

## 6. Security Best Practices for Production

1. **Change Default Password:**
   In production, do not keep the default `Password123!`. Change the password for `admin@platform.live` using the Render Shell or your account settings.
2. **Environment Variables:**
   Ensure `JWT_SECRET` is configured with a secure 32+ character random string in your Render Environment Variables.
3. **Audit Trail:**
   All administrative actions (branding updates, pricing changes, token distributions, advertisement creation, and payout approvals) are logged with the acting Admin's user ID in the `AuditLog` database table for full transparency.

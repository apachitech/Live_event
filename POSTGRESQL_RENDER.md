# Step-by-Step PostgreSQL Setup on Render.com

This guide walks you through setting up a **Free Managed PostgreSQL Database** on Render and linking it to your **PulseStream** web application so all users, streams, wallets, tokens, and transactions are **permanently saved**.

---

## 1. Why PostgreSQL on Render?

By default without a configured database URL, the container runs an ephemeral SQLite database that resets on restarts. Adding Render's managed PostgreSQL guarantees:
- **Persistent Data**: Users, balances, stream keys, and purchases remain hard-kept forever across redeploys.
- **ACID Compliance**: Safe financial transactions for token purchases and tips without race conditions.
- **Zero Local Setup**: Render manages backups, health, and server operations in the cloud.
- **Automatic Sync**: Our custom `docker-entrypoint.sh` automatically detects the PostgreSQL URL, compiles Prisma for PostgreSQL, and synchronizes all tables on startup.

---

## 2. Step 1: Create the PostgreSQL Database on Render

1. Log in to your **[Render Dashboard](https://dashboard.render.com)**.
2. In the top-right header, click the blue **New +** button.
3. Select **PostgreSQL** from the drop-down menu:

   | Field | Recommended Value | Notes |
   | :--- | :--- | :--- |
   | **Name** | `live-event-db` | Identifier for your database instance |
   | **Database** | `live_event_db` | Internal database name |
   | **User** | `live_user` | Database admin user (or leave default) |
   | **Region** | *Same as Web Service* | e.g. Frankfurt, Oregon, or Ohio (matches `live-event-uz3r`) |
   | **PostgreSQL Version** | `16` (Default) | Standard LTS version |
   | **Instance Type** | **Free** | 0.25 CPU, 256 MB RAM, 1 GB Storage (Free tier) |

4. Scroll down and click **Create Database**.

---

## 3. Step 2: Copy the Internal Connection String

1. Wait ~30–60 seconds until the database status badge turns **Available** (green).
2. Scroll down to the **Connections** card on the database settings page.
3. Locate the field labeled **Internal Database URL**:
   - It will look like this:
     ```text
     postgresql://live_user:aBcDeFg123456@dpg-xxxxxxxxx-a/live_event_db
     ```
4. Click the **Copy** icon next to **Internal Database URL**.

> [!IMPORTANT]
> Always use the **Internal Database URL** (not the External URL). The internal URL routes directly over Render's private high-speed network between your web app and database, offering lower latency, zero bandwidth fees, and strict firewall security.

---

## 4. Step 3: Link It to Your Web Service (`live-event-uz3r`)

1. In the **Render Dashboard**, click on your web service: **`live-event-uz3r`**.
2. In the left navigation sidebar, click the **Environment** tab.
3. Scroll to the environment variables list or click **Add Environment Variable**:
   - **Key**: `DATABASE_URL`
   - **Value**: Paste the copied Internal Database URL:
     ```text
     postgresql://live_user:YOUR_PASSWORD@dpg-xxxxxxxxx-a/live_event_db
     ```
4. Scroll down and click the blue **Save Changes** button.

---

## 5. What Happens Automatically on Container Start

Render will automatically trigger a rolling deployment of your container. You can watch the **Logs** tab in Render:

```text
=== PulseStream Container Bootstrapping ===
PORT: 3000
NODE_ENV: production
Detected PostgreSQL database connection.
Generating Prisma client...
Prisma schema loaded from prisma/schema.prisma
✔ Generated Prisma Client to ./node_modules/@prisma/client
Synchronizing database schema...
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "live_event_db"
🚀 Your database is now in sync with your Prisma schema. Done in 750ms
Launching application server on port 3000...
> Live Streaming Web Server ready on http://0.0.0.0:3000
```

---

## 6. What Data is Now Hard-Kept in PostgreSQL?

The following tables and relations are now permanently stored in PostgreSQL:

| Table | What it Stores |
| :--- | :--- |
| **`User`** | Accounts, salted bcrypt password hashes, roles (`VIEWER`, `STREAMER`, `ADMIN`), age verification timestamps |
| **`Wallet`** | Viewer token balances & streamer cashable earned balances |
| **`Transaction`** | Ledger of every token purchase, tip, private show fee, and refund with unique IDs |
| **`StreamerProfile`** | Streamer display names, bios, payout preferences, and verification status |
| **`Stream`** | Stream room records, titles, categories, viewer counts, and earnings |
| **`Vod`** | Uploaded video recordings, view counts, and pay-per-view prices |
| **`ChatMessage`** | Moderated stream chat logs |
| **`TipGoal`** | Streamer tip goals, targets, and progress |
| **`TipMenuItem`** | Interactive menu items with token costs |
| **`Poll` & `PollVote`** | Real-time interactive stream polls and votes |
| **`PrivateSession`** | 1:1 private show duration and token metering records |

---

## 7. Troubleshooting

- **Error: `connection refused` or `timeout`:**
  - Verify that your Web Service and PostgreSQL database are in the **same Render Region** (e.g. both in Frankfurt or both in Oregon).
- **Need to connect from your personal computer for debugging?**
  - Use the **External Database URL** (which includes SSL) in tools like **DBeaver**, **pgAdmin**, or **TablePlus**.
- **Free Tier Inactivity:**
  - Render free PostgreSQL databases run continuously without sleeping as long as your web app is connected.

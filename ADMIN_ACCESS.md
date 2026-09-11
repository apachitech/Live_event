# PulseStream Platform Administrator Access Guide

This document contains everything you need to know about logging in as an **Administrator**, managing platform settings, and managing administrative roles.

---

## 1. Default Admin Credentials

When the platform boots and seeds its database, the built-in administrator account is initialized with the following credentials:

| Field | Default Value | Notes |
| :--- | :--- | :--- |
| **Email** | `admin@platform.live` | Case-insensitive |
| **Username** | `PlatformAdmin` | Can also be entered in the login field |
| **Password** | `Password123!` | Case-sensitive |
| **Account Role** | `ADMIN` | Full administrative privileges |
| **Age Verification** | `Verified (18+)` | Pre-verified bypass |
| **Initial Wallet** | `10,000 Tokens` | Pre-funded for platform testing |

---

## 2. Step-by-Step Login Procedure

1. **Go to the Login Page:**  
   Navigate to `/login` on your deployed Render URL (or `http://localhost:3000/login` locally).

2. **Enter Your Identifier:**  
   In the **Email or Username** box, type either:
   ```text
   admin@platform.live
   ```
   *or*
   ```text
   PlatformAdmin
   ```

3. **Enter the Password:**  
   ```text
   Password123!
   ```
   *(Click the **Eye** icon on the right side of the password field if you want to inspect what you typed).*

4. **Click "Sign In":**  
   - The platform verifies your hashed credentials.
   - A secure, HTTP-only session cookie (`live_session_token`) is set.
   - You are redirected back to the platform homepage.

---

## 3. How to Access the Admin Portal

Once authenticated with an `ADMIN` account:

1. **Top Navigation Bar:**  
   A dedicated red **Admin** button with a shield icon (`🛡️ Admin`) will appear in the top navigation header on every page.
2. **Direct URLs:**  
   You can also navigate directly to any admin route:

| Route URL | Purpose |
| :--- | :--- |
| **`/admin`** | **Overview & Payout Approvals**: View gross platform revenue, active streams, token transaction volume, and approve/reject streamer cashout requests. |
| **`/admin/moderation`** | **Content Moderation**: Review flagged chat messages, suspended accounts, and reported broadcast rooms. |
| **`/admin/settings`** | **Platform Economics**: Adjust the streamer revenue split (default `70%` streamer / `30%` house) and minimum payout thresholds. |

---

## 4. How to Promote Your Own Account to Admin

If you registered your own personal email (e.g. `you@domain.com`) on `/register` and want to grant it full Administrator rights:

### Option A: Via PostgreSQL Database (Recommended on Render)
1. In your **Render Dashboard**, open your PostgreSQL database.
2. Under the **Connect** tab, use the **PSQL Command** or connect with a GUI client (like TablePlus, pgAdmin, or DBeaver).
3. Run this single SQL query:
```sql
UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'you@domain.com';
```
4. Log out and log back in on the platform. Your account will now have the `ADMIN` role.

---

### Option B: Changing the Default Admin Password
To change the password for `admin@platform.live` directly in PostgreSQL, generate a new bcrypt hash or update it via a quick Node script:

```bash
# In the project terminal:
node -e "const b = require('bcryptjs'); b.hash('YourNewStrongPassword!', 10).then(h => console.log(h));"
```

Then run in PostgreSQL:
```sql
UPDATE "User"
SET "passwordHash" = '<PASTE_NEW_BCRYPT_HASH_HERE>'
WHERE email = 'admin@platform.live';
```

---

## 5. Automatic Database Seeding on Render

To make deployment completely seamless, the production container (`docker-entrypoint.sh`) runs database migrations and seeds the default admin user automatically in the background upon container startup:

```bash
npx prisma generate && npx prisma db push --skip-generate && npm run db:seed
```

- **Idempotent**: The seed script uses Prisma `upsert`, meaning it will create the admin user if it does not exist, but will **never** overwrite or corrupt your data if it already exists.

---

## 6. Security Checklist for Live Production

Before launching to the public:
1. **Change the Default Admin Password**: Do not keep `Password123!` in a live public environment.
2. **Set a Custom `JWT_SECRET`**: Ensure the `JWT_SECRET` environment variable is configured with a 32+ character random string in your Render Environment Variables.

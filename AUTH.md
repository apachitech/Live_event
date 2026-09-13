# Platform Authentication & Authorization Guide (AUTH.md)

This document provides a comprehensive reference for the authentication, authorization, and session management system of the Live Streaming Platform, covering both **Local Development** and **Live Production Deployments**.

---

## 1. Architecture Overview

The platform uses a stateless **JSON Web Token (JWT)** session architecture stored in secure, **HTTP-only cookies**, paired with **Prisma ORM** (SQLite locally, PostgreSQL in production).

```
┌─────────────────┐       HTTPS Cookie / JWT       ┌──────────────────────┐
│  Next.js Client │ ─────────────────────────────> │ API Route Handlers   │
│  (React / Auth) │ <───────────────────────────── │ (/api/auth/*)        │
└─────────────────┘        (auth_token)            └──────────┬───────────┘
                                                              │
                                            ┌─────────────────┴─────────────────┐
                                            │                                   │
                                    ┌───────▼────────┐                 ┌────────▼────────┐
                                    │  Prisma / SQL  │                 │ Google OAuth 2  │
                                    │ (User, Wallet) │                 │  (Cloud / Mock) │
                                    └────────────────┘                 └─────────────────┘
```

### Key Highlights
- **Zero-Dependency Local Dev**: Uses SQLite (`prisma/dev.db` mirrored to `./dev.db`) with automatic PostgreSQL alignment when deploying to cloud providers like Render.
- **Role-Based Access Control (RBAC)**: Supports `VIEWER`, `STREAMER`, `MODERATOR`, and `ADMIN`.
- **Automatic Wallet Provisioning**: Every new account (Credentials or Google OAuth) is automatically gifted **100 starter tokens** upon registration.
- **Streamer Profile Creation**: Streamers automatically receive a verified `StreamerProfile` for immediate broadcasting and tipping menu customization.
- **18+ Compliance**: Enforces age attestation and date-of-birth validation on registration.

---

## 2. Authentication Methods

### 2.1 Standard Email & Password
- **Registration (`/register`)**:
  - Requires `email`, `username`, `password`, `birthDate`, and `agreeAgeVerification` (18+).
  - Role selection: `VIEWER` or `STREAMER`.
  - Passwords hashed using `bcryptjs` (salt rounds: 10).
  - Returns `auth_token` cookie immediately (no secondary login step needed).
- **Login (`/login`)**:
  - Accepts either **Email** OR **Username** in a single field (`emailOrUsername`).
  - Verifies credentials against `passwordHash`.
  - Sets `auth_token` cookie and redirects to `/` or requested `?redirect=` URL.

### 2.2 Google OAuth 2.0
- **Initiation (`/api/auth/google`)**:
  - Generates a cryptographically random anti-CSRF `state` token stored in an `oauth_state` cookie.
  - Encodes the user's intended redirect path and desired role (`STREAMER` or `VIEWER`).
  - **Live Production**: Redirects to `https://accounts.google.com/o/oauth2/v2/auth`.
  - **Local Development / Sandbox**: If `GOOGLE_CLIENT_ID` is not configured, seamlessly routes to developer sandbox mode (`google.tester@platform.live` / `GoogleStreamer`).
- **Callback (`/api/auth/google/callback`)**:
  - Exchanges OAuth authorization code for Google user profile (email, name, picture).
  - Finds or creates the User record:
    - If new, creates user with selected role (`STREAMER` or `VIEWER`), 100 starter tokens, verified avatar, and sets default testing password hash `Password123!`.
    - If existing, updates `googleId`, avatar, and attaches `streamerProfile` if streamer role was requested.
  - Issues `auth_token` cookie and redirects to home or intended destination.

### 2.3 Forgot & Reset Password Flow
- **Request Link (`/forgot-password` & `POST /api/auth/forgot-password`)**:
  - User submits registered email.
  - Generates a secure 32-byte cryptographic token (`crypto.randomBytes(32).toString('hex')`) with a 1-hour expiration timestamp (`resetPasswordExpires`).
  - In development mode, the response includes a clickable `devResetUrl` for immediate testing.
  - In production, sends via transactional email.
  - Returns generic success message to prevent user enumeration.
- **Password Reset (`/reset-password?token=...` & `POST /api/auth/reset-password`)**:
  - Validates token presence and checks `resetPasswordExpires > new Date()`.
  - Hashes new password with `bcryptjs`.
  - Revokes reset token (`resetPasswordToken: null`, `resetPasswordExpires: null`) to prevent replay attacks.
  - Logs `PASSWORD_RESET_COMPLETED` in audit logs.

---

## 3. Session & Cookie Specifications

Session tokens are stored in an HTTP cookie named **`auth_token`**:

```typescript
{
  name: 'auth_token',
  options: {
    httpOnly: true,                                // Inaccessible to JavaScript (XSS protection)
    secure: process.env.NODE_ENV === 'production', // Enforces HTTPS in production
    sameSite: 'lax',                               // Protects against CSRF attacks
    path: '/',
    maxAge: 60 * 60 * 24 * 7,                      // 7 days validity
  }
}
```

### JWT Payload Structure
```json
{
  "userId": "d4ea2fc0-c781-4e50-881c-4d6cc5f13f49",
  "email": "admin@platform.live",
  "username": "PlatformAdmin",
  "role": "ADMIN",
  "ageVerified": true,
  "iat": 1789317432,
  "exp": 1789922232
}
```

---

## 4. API Reference

| Endpoint | Method | Body / Params | Description |
| :--- | :---: | :--- | :--- |
| `/api/auth/register` | `POST` | `{ email, username, password, role, birthDate, agreeAgeVerification }` | Creates user account, assigns starter tokens, sets cookie. |
| `/api/auth/login` | `POST` | `{ emailOrUsername, password }` | Authenticates credentials, sets `auth_token` cookie. |
| `/api/auth/me` | `GET` | *(Cookie: `auth_token`)* | Returns authenticated user, wallet balance, and profile. |
| `/api/auth/logout` | `POST` | *(None)* | Clears session cookie (`maxAge: 0`). |
| `/api/auth/google` | `GET` | `?redirect=/&role=STREAMER` | Initiates Google OAuth 2.0 flow or sandbox dev flow. |
| `/api/auth/google/callback` | `GET` | `?code=...&state=...` | Handles OAuth return, provisions user, issues cookie. |
| `/api/auth/forgot-password` | `POST` | `{ email }` | Creates 32-byte crypto token and reset URL. |
| `/api/auth/reset-password` | `POST` | `{ token, password }` | Validates token, hashes new password, revokes token. |

---

## 5. Local Development Quick Reference

### Seed Test Accounts
All pre-seeded local accounts share the default password: **`Password123!`**

| Role | Username | Email | Permissions / Features |
| :--- | :--- | :--- | :--- |
| **Admin** | `PlatformAdmin` | `admin@platform.live` | Full admin dashboard, compliance, audit logs, payouts |
| **Streamer** | `NeonNova` | `streamer@platform.live` | Live broadcasting, tip menu, token goals, private sessions |
| **Streamer** | `AuroraGlow` | `aurora@platform.live` | Creative broadcasting, verified KYC |
| **Google Streamer** | `GoogleStreamer` | `google.tester@platform.live` | Google OAuth sandbox account, live streaming privileges |
| **Viewer** | `CyberViewer99` | `viewer@platform.live` | Chat, tipping, token wallet, private stream viewing |

### Useful CLI Commands
```bash
# Push Prisma schema to SQLite database and mirror dev.db
npm run db:push

# Re-seed test database with default users and demo streams
npm run db:seed

# Start Next.js development server with Socket.IO
npm run dev

# Type check all TypeScript files
npx tsc --noEmit
```

---

## 6. Production Deployment Guide (Render.com / Cloud)

### 6.1 Environment Variables Checklist

Set the following in your hosting provider's dashboard (e.g. **Render Dashboard → Environment**):

| Environment Variable | Required | Description | Example / Recommended Value |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | **Yes** | Enforces production optimizations and secure cookies | `production` |
| `DATABASE_URL` | **Yes** | PostgreSQL database connection string | `postgresql://user:pw@host/dbname?sslmode=require` |
| `JWT_SECRET` | **Yes** | 32+ character random string for signing JWTs | Generated securely or `openssl rand -hex 32` |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Public domain of the application | `https://your-platform.onrender.com` or `https://live.yourdomain.com` |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth Web Application Client ID | `123456789-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth Web Application Secret | `GOCSPX-xxxxxxxxxxxxxxxx` |

### 6.2 Setting Up Google OAuth for Live Production

1. Visit the [Google Cloud Console](https://console.cloud.google.com/).
2. Navigate to **APIs & Services** → **Credentials**.
3. Click **Create Credentials** → **OAuth Client ID**.
4. Set Application Type to **Web application**.
5. Add to **Authorized JavaScript origins**:
   ```
   https://<YOUR-PRODUCTION-DOMAIN>
   ```
6. Add to **Authorized redirect URIs**:
   ```
   https://<YOUR-PRODUCTION-DOMAIN>/api/auth/google/callback
   ```
   *(Example: `https://live-streaming-web.onrender.com/api/auth/google/callback`)*
7. Click **Create** and copy the **Client ID** and **Client Secret** into your production environment variables (`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`).

> **Note on Sandbox Fallback**: If `GOOGLE_CLIENT_ID` is left empty in production, the application will cleanly fallback to the developer sandbox flow, ensuring you can test features without waiting for external API approvals.

### 6.3 Automated Database Migration on Render
The deployment pipeline uses `scripts/ensure-db.js`, which is wired directly into `package.json` (`npm run build`). When deploying on Render:
1. `ensure-db.js` detects the PostgreSQL `DATABASE_URL`.
2. Automatically updates `prisma/schema.prisma` datasource provider to `postgresql`.
3. Runs `prisma db push` to ensure all tables, columns (`googleId`, `resetPasswordToken`, etc.), and indices exist.
4. Generates a fresh `@prisma/client`.
5. Next.js builds the production bundle (`next build`).

---

## 7. Security, Audit Logging & Compliance

- **Change Data Audit Trail**: All authentication events are logged to the `AuditLog` table using `logChangeData()`:
  - `USER_REGISTERED`
  - `USER_LOGIN_SUCCESS`
  - `USER_LOGIN_GOOGLE`
  - `USER_LOGOUT`
  - `PASSWORD_RESET_REQUESTED`
  - `PASSWORD_RESET_COMPLETED`
- **Tamper Protection**: Session tokens are signed using `HS256` with secret rotation support.
- **Timing Attack Resistance**: Failed login attempts return unified `Invalid email/username or password` errors to prevent account enumeration.
- **18+ Age Attestation**: Satisfies adult entertainment / live event regulatory compliance (USC 2257) with mandatory self-attestation timestamps and date-of-birth storage.

---

## 8. Troubleshooting

### 1. "Invalid credentials" when logging in with Google accounts
- **Cause**: Accounts created via Google OAuth have no default password unless configured.
- **Fix**: The system assigns `Password123!` to Google demo accounts, allowing login via both "Continue with Google" AND the credentials form (`google.tester@platform.live` / `Password123!`).

### 2. "The column User.googleId does not exist in the current database"
- **Cause**: Local SQLite database was out of sync with Prisma schema.
- **Fix**: Run `npm run db:push`. `scripts/ensure-db.js` pushes the latest schema and mirrors `prisma/dev.db` <-> `./dev.db`.

### 3. "Connection error: Failed to fetch"
- **Cause**: The local Node.js server is stopped or crashed.
- **Fix**: Start the server with `npm run dev` and ensure it displays `Next.js application ready and serving traffic!`.

### 4. Google OAuth Redirect Mismatch (`redirect_uri_mismatch`)
- **Cause**: The URL configured in Google Cloud Console does not match `https://<YOUR-DOMAIN>/api/auth/google/callback`.
- **Fix**: Verify `NEXT_PUBLIC_APP_URL` in environment variables matches the exact domain (including protocol `https://` and no trailing slash).

# DeMourinho Crypto on Railway — Deployment Guide

A practical, copy-paste guide to get a working DeMourinho Crypto (Bicrypto v6.3
fork) demo running on [Railway](https://railway.app). Everything here has been
pre-wired in this repo — `railway.json`, `nixpacks.toml`, `railway-start.sh`,
`scripts/import-sql.js`, and `production.config.js` all work together with
zero manual edits required.

---

## TL;DR (5-minute path)

1. Push this repo to GitHub.
2. New Railway project → **Deploy from GitHub repo** → pick this repo.
3. **+ New** → **Database** → **Add MySQL**.
4. **+ New** → **Database** → **Add Redis**. *(Required — see §3d.)*
5. Open your **app service** → **Variables → Raw Editor** → paste the block from
   [§4 Required environment variables](#4-required-environment-variables).
6. Click **Deploy**. First successful deploy takes ~10 minutes (install + build +
   schema import + seed).
7. **Settings → Networking → Generate Domain.** Open it.
8. Login with the seeded super admin (see [§7 First login](#7-first-login)).

That's it. The rest of this doc explains *why* each step exists and how to
extend the deployment.

---

## 1. Architecture: ONE service, not two

A single Railway service running both the frontend and backend in one
container, managed by PM2:

| Process  | Port            | What it is                                  |
|----------|-----------------|---------------------------------------------|
| frontend | `$PORT` (auto)  | Next.js app (the UI users see)              |
| backend  | 4000            | Node/TypeScript API (compiled, in `dist/`)  |

Railway's edge proxy publishes `$PORT` (the frontend) at your `*.up.railway.app`
URL. The browser calls `/api/*` on the same domain — Next.js rewrites those
calls to `127.0.0.1:4000` inside the container (configured in
`frontend/next.config.js`). Nothing else needs to be exposed.

> **DO NOT split this into two Railway services** (one for backend, one for
> frontend). The codebase is engineered to run as a single PM2 process. Splitting
> requires you to publicly expose port 4000, fight CORS, and set
> `BACKEND_INTERNAL_URL` everywhere. None of that is needed with the default
> single-service setup.

Two managed plugins back the app:

- **MySQL plugin** — holds the 160-table schema (imported on first boot).
- **Redis plugin** — holds BullMQ job queues, rate-limit counters, cache,
  Redlock locks, deposit/order-monitor state.

The plugins live in the same Railway project and are wired to the app service
via reference variables (no IP addresses to manage).

---

## 2. Files Railway uses

Push the **entire repo as it is**. The pieces Railway specifically reads:

```
railway.json              ← build/start config + healthcheck
nixpacks.toml             ← Node 22 + pnpm + openssl
railway-start.sh          ← boot: env-mapping + Redis check + DB wait + import + seed + PM2
production.config.js      ← PM2 process definitions for backend + frontend
scripts/import-sql.js     ← SQL importer (relaxes sql_mode, disables FK checks)
initial.sql               ← schema (160 tables; pre-cleaned for MySQL 8 strict mode)
package.json + pnpm-lock.yaml + pnpm-workspace.yaml
backend/                  ← compiled backend (dist/)
frontend/                 ← Next.js source
```

Files that should NOT be uploaded (already gitignored or removed):

- `node_modules/` — Railway reinstalls fresh
- `.env` — never commit; set vars in the Railway dashboard
- `database_export.sql.gz` — large, only if you want a populated dump (see §6)
- `node-v22.14.0-win-x64/` — Windows binary, useless on Linux
- `HOW TO INSTALL/`, `installer.sh` — VPS docs, not used on Railway

---

## 3. Step-by-step on Railway

### 3a. Create the project

1. https://railway.app → **New Project** → **Deploy from GitHub repo**.
2. Authorize Railway, pick this repo.
3. Railway auto-detects `nixpacks.toml` and starts an initial build.
   **It will fail the first time** because the DB and Redis aren't attached
   yet. That is expected — proceed to 3b.

### 3b. Add MySQL

1. **+ New → Database → Add MySQL**. Wait ~30 seconds.
2. Click the MySQL service → **Variables** tab. You'll see auto-generated
   `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`.
   Don't copy these manually — you'll reference them in 3e.

### 3c. Add Redis

1. **+ New → Database → Add Redis**. Wait ~30 seconds.
2. Click the Redis service → **Variables** tab. You'll see `REDISHOST`,
   `REDISPORT`, `REDISPASSWORD`, `REDISUSER`. Same story — referenced below.

### 3d. Why Redis is non-negotiable

The backend uses Redis for:

- **BullMQ cron** — every scheduled task (price snapshots, KYC reminders,
  withdrawal cleanup, etc.) is a BullMQ job.
- **Rate limiting** — login throttle, API throttle.
- **Caching** — settings, market data, exchange metadata.
- **Redlock** — distributed locks (deposit monitors, order matching).
- **Notifications fan-out**.

Without Redis, the backend boots but every one of the above silently fails or
crashes the worker. The boot script (`railway-start.sh`) prints a loud warning
if Redis isn't wired so you'll see it in the deploy logs immediately.

### 3e. Reference the plugins from the app service

Open the **app service** (not the DB/Redis ones) → **Variables → Raw Editor**
and paste the block from [§4](#4-required-environment-variables). The
`${{ MySQL.* }}` and `${{ Redis.* }}` references are how Railway injects the
plugin credentials.

> If your plugin services are named something other than `MySQL` / `Redis`
> (Railway lets you rename them), update the reference names accordingly.

### 3f. Generate the domain

**Settings → Networking → Generate Domain.** You'll get something like
`demourinho-production-1234.up.railway.app`. Copy it, set it as the value of
`NEXT_PUBLIC_SITE_URL` in Variables, save (Railway auto-redeploys).

### 3g. Watch the deploy

In **Deployments**, click the active deploy and watch the logs. You should see,
in order:

```
DB target: <user>@<host>:3306/<dbname>
Redis target: <host>:6379
Waiting for MySQL at ...
MySQL is reachable.
Importing initial.sql (4022 lines)...
Executing 312 statements...
Schema imported.
Running seeders...
Starting backend (port 4000) + frontend (port $PORT) under PM2...
[PM2][backend] online
[PM2][frontend] online
✓ Ready in 4.2s
```

Total time: 8–12 minutes for a cold deploy.

---

## 4. Required environment variables

Open the app service → **Variables → Raw Editor** and paste this (replace each
`CHANGE_ME` value):

```env
# ---------- App ----------
NODE_ENV=production
# Note: do NOT set PORT — Railway injects it automatically. The frontend
# binds to $PORT and the backend always binds to 4000 internally.
NEXT_PUBLIC_SITE_URL=https://CHANGE_ME.up.railway.app
NEXT_PUBLIC_SITE_NAME=DeMourinho Crypto
NEXT_PUBLIC_SITE_DESCRIPTION=DeMourinho Crypto Exchange Platform
NEXT_PUBLIC_DEMO_STATUS=false
NEXT_PUBLIC_FRONTEND_PORT=3000
NEXT_PUBLIC_BACKEND_PORT=4000
NEXT_PUBLIC_BACKEND_THREADS=2
NEXT_PUBLIC_DEFAULT_LANGUAGE=en
NEXT_PUBLIC_LANGUAGES=en,es,fr,de,it,pt,ru,ar,ja,ko,hi,tr
NEXT_PUBLIC_DEFAULT_THEME=dark
NEXT_PUBLIC_FRONTEND=true

# ---------- Database (MySQL plugin via References) ----------
DB_HOST=${{ MySQL.MYSQLHOST }}
DB_PORT=${{ MySQL.MYSQLPORT }}
DB_USER=${{ MySQL.MYSQLUSER }}
DB_PASSWORD=${{ MySQL.MYSQLPASSWORD }}
DB_NAME=${{ MySQL.MYSQLDATABASE }}

# ---------- Redis (Redis plugin via References) ----------
REDIS_HOST=${{ Redis.REDISHOST }}
REDIS_PORT=${{ Redis.REDISPORT }}
REDIS_PASSWORD=${{ Redis.REDISPASSWORD }}
REDIS_USER=${{ Redis.REDISUSER }}

# ---------- Token secrets — REGENERATE THESE ----------
# Generate each one fresh:
#   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
APP_ACCESS_TOKEN_SECRET=CHANGE_ME_128_HEX_CHARS
APP_REFRESH_TOKEN_SECRET=CHANGE_ME_128_HEX_CHARS
APP_RESET_TOKEN_SECRET=CHANGE_ME_128_HEX_CHARS
APP_VERIFY_TOKEN_SECRET=CHANGE_ME_128_HEX_CHARS
JWT_EXPIRY=30m
JWT_REFRESH_EXPIRY=30d
JWT_RESET_EXPIRY=1h

# ---------- Rate limiting ----------
RATE_LIMIT=100
RATE_LIMIT_EXPIRY=60
APP_CLIENT_PLATFORM=browser

# ---------- Public market data exchange (no API keys needed for read-only) -
# ccxt streams public price feeds & order book from this exchange.
# bin = Binance, kuc = KuCoin, kra = Kraken, okx = OKX, xt = XT
NEXT_PUBLIC_EXCHANGE=bin

# ---------- Email (use 'local' to make backend boot without SMTP) ----------
APP_EMAILER=local
APP_EMAIL_SENDER_NAME=DeMourinho Crypto
NEXT_PUBLIC_APP_EMAIL=admin@example.com
APP_SENDMAIL_PATH=/usr/sbin/sendmail

# ---------- Optional placeholders (safe to leave blank for demo) ----------
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=
NEXT_PUBLIC_APP_PAYPAL_CLIENT_ID=
```

After saving, Railway redeploys automatically.

> **Important:** if a previous attempt by the Railway agent (or a deploy that
> failed mid-import) added a `MYSQL_INIT_COMMAND` workaround to the MySQL
> service variables, **delete it.** It was masking the strict-mode SQL bug
> that has now been fixed in `initial.sql`. Leaving it in place hides future
> issues.

---

## 5. What works out of the box (no extra keys)

After a clean deploy, with **only** the variables above set, you get:

- Login / signup / 2FA UI
- Admin panel (super admin auto-seeded — see §7)
- Public market data: live BTC/ETH/etc. prices, candles, depth charts via
  Binance public API (`ccxt`, no key required)
- Trading UI with moving charts
- Wallet UI (balances will be 0 — no chain RPCs configured)
- User profile, KYC forms, settings
- Multi-language switching (12 languages)
- Dark / light theming

What does **not** work without you adding your own credentials:

- Real fiat deposits/withdrawals (needs Stripe/PayPal/Paystack keys)
- Real crypto deposits/withdrawals (needs blockchain RPCs)
- Email delivery (signup confirmations, password resets) — needs SMTP
- SMS / OTP (needs Twilio)
- AI features (needs OpenAI / Gemini / DeepSeek key)
- Push notifications (needs Firebase / VAPID)
- KYC provider integrations
- Authenticated exchange trades (the UI uses public data; signed orders need
  your real Binance/KuCoin API keys)

This is enough for a *demonstration* — investors can see the trading UI,
moving charts, and the admin panel.

---

## 6. Using `database_export.sql.gz` instead of `initial.sql`

`initial.sql` gives you an **empty schema with default settings** —
clean slate. The `database_export.sql.gz` (561 KB) is a richer dump
with sample users / orders / market data already populated.

To use it instead:

```bash
gunzip -c database_export.sql.gz > initial.sql
git add initial.sql && git commit -m "use richer seed dump"
git push
```

`railway-start.sh` will pick it up the same way — it imports whatever
`initial.sql` it finds when the database is empty.

---

## 7. First login

The `superAdmin` seeder creates this account:

```
Email:    superadmin@example.com
Password: 12345678
```

**Change the password immediately** after first login (Profile → Security).

If the seeders failed (check the deploy log), run them manually from
Railway → app service → ⋮ menu → **Open Shell**:

```bash
cd backend && npx sequelize-cli db:seed:all --config ./config.js
```

---

## 8. Updating the deploy

- **Code change**: just `git push`. Railway auto-deploys on push to the branch
  the app service is configured to watch (default: `main`).
- **New env var**: add it in **Variables**, Railway auto-redeploys.
- **Wipe DB and re-seed**: in MySQL plugin → ⋮ → **Reset** (or run
  `DROP DATABASE railway; CREATE DATABASE railway;` from the plugin's Data
  tab). Next deploy re-imports `initial.sql` and re-seeds.

---

## 9. Cost estimate (Railway pricing as of late 2025)

- App service: ~$5–15/mo (depending on traffic; ~512 MB – 1 GB RAM idle)
- MySQL plugin: ~$5/mo (1 GB)
- Redis plugin: ~$3–5/mo
- Egress: pennies for a demo

Plan on **$15–30/mo** for a comfortable demo. Railway gives every account
$5/mo of free credit on the Hobby plan.

---

## 10. Troubleshooting

**Deploy fails with "MySQL not reachable after 60s"**
The MySQL plugin isn't attached, or the references in §4 are wrong. Open the
MySQL service variables and confirm `MYSQLHOST`, `MYSQLPORT`, etc. exist.

**Deploy log shows "WARNING: No Redis attached"**
Add the Redis plugin (§3c) and reference its vars (§4). Without Redis, the
backend cron, queues, and rate limiter will fail at runtime.

**Schema import fails with "Statement N failed: ..."**
The repo's `initial.sql` is pre-cleaned for MySQL 8 strict mode (78 invalid
`text DEFAULT NULL` clauses removed, plus 1 `longtext NOT NULL DEFAULT ''`),
and `scripts/import-sql.js` additionally relaxes `sql_mode` for the import
session, so this should not happen with the shipped SQL. If you imported a
custom dump and hit it, either clean the dump the same way or pre-set
`MYSQL_INIT_COMMAND='SET sql_mode=""'` on the MySQL plugin.

**Schema import fails with "Table already exists"**
A previous deploy died partway through the import and left a partial schema.
Open the MySQL plugin → Data tab and run:
```sql
DROP DATABASE `railway`;
CREATE DATABASE `railway`;
```
Then redeploy. The boot script will detect the empty DB and re-import cleanly.

**Frontend builds but backend crashes on boot**
Open the deploy log and search for errors. Most common: a token secret is
missing or shorter than 64 chars; or `REDIS_HOST` is unset and a worker
tried to connect to BullMQ.

**Frontend shows "Loading" forever**
The browser is calling `/api/*` and getting nothing back. In the app service
shell: `pm2 logs backend`. If the backend is up, check that the rewrites in
`frontend/next.config.js` are pointing at `127.0.0.1:4000` (default) and not
overridden by a `BACKEND_INTERNAL_URL` env var.

**"Application failed to respond" from Railway proxy**
The frontend isn't binding to `$PORT`. Confirm you did NOT set `PORT=3000` in
the variables — Railway needs to inject its own. `production.config.js`
defaults to 3000 only when `$PORT` is unset.

**Out of memory during build**
Bump the service plan one tier, or reduce `NODE_OPTIONS` in `nixpacks.toml`.

**"Lit is in dev mode" warning**
Cosmetic only. Ignore — happens because some wallet libraries ship dev builds.

---

## 11. After the demo, before going live

If/when you move to a VPS later:

- Use `installer.sh` from the original repo (sets up nginx + SSL + PM2 +
  MySQL + Redis on a fresh Ubuntu/Debian box).
- Set `NEXT_PUBLIC_DEMO_STATUS=false`, `APP_CLIENT_PLATFORM=browser`.
- Replace every `CHANGE_ME` token secret.
- Add real SMTP, exchange API keys, blockchain RPCs.
- Enable HTTPS via Let's Encrypt (the installer does this).

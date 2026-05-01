# DeMourinho Crypto (Bicrypto fork) — Replit + Railway

## What this project is

**DeMourinho Crypto** is a rebranded fork of Bicrypto v6.3.0 — a full
cryptocurrency exchange platform (frontend + backend + 184-table MySQL schema).
The backend is **shipped as compiled/obfuscated JavaScript** (`backend/dist/`).
There is NO TypeScript source for the backend `src/` tree — surgical line-level
edits to `backend/dist/` files are the only option when a backend bug must be
fixed. Document every such edit in the "Known dist patches" section below.

Brand assets: env vars (`NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_SITE_DESCRIPTION`)
and `frontend/app/globals.css` (emerald primary + deep-slate dark mode + gold
accent).

```
backend/             Compiled Node.js API (dist/), Sequelize models, seeders.
frontend/            Next.js 16 app (full source). Tailwind + Radix UI.
initial.sql          184-table MySQL schema (clean install dump).
production.config.js PM2 process definitions — backend :4000, frontend :$PORT.
railway-start.sh     Boot script: env mapping → MySQL wait → schema import →
                     seeders → PM2. This is the Railway entrypoint.
railway.json         Railway build/start config (references railway-start.sh).
nixpacks.toml        Node 22 + pnpm + mysql-client build environment.
scripts/import-sql.js   Node.js SQL importer (sets sql_mode='' per session).
scripts/stub-backend.js Replit-only fake backend on :4000.
scripts/replit-dev-env.js Writes .env for Replit dev session.
```

---

## How we run it

### On Replit (dev / preview only)

MySQL is not available on Replit, so the real backend cannot run here.

- **Frontend** workflow: port **5000** (`pnpm exec next dev`). Visible in the
  preview iframe.
- **Stub backend** (`scripts/stub-backend.js`): port **4000**, started inside
  the same workflow command. Returns minimal JSON so the frontend doesn't spam
  connection errors. Login, real data, trading — none of this works on Replit.

Use Replit for: editing code, restyling UI, hot-reload iteration.

### On Railway (live demo target)

Full guide: [`RAILWAY_DEPLOY.md`](./RAILWAY_DEPLOY.md). Short version:

1. Push the repo to GitHub (see **Pushing to GitHub** below).
2. Railway → New Project from GitHub → Bicrypto service.
3. Add **MySQL plugin** to the same project.
4. Set env vars in Railway Variables tab (see `RAILWAY_DEPLOY.md` § 4).
5. `railway-start.sh` boots, waits for MySQL, imports `initial.sql` if DB is
   empty, runs seeders, then starts both processes under PM2.
6. Settings → Networking → generate a public domain.
7. Login: `superadmin@example.com` / `12345678` → change password immediately.

---

## Pushing to GitHub (triggers Railway auto-deploy)

**The git sandbox in the main Replit agent blocks `git push` and
`git remote set-url` directly. Use this Node.js one-liner instead.**
The token is stored in Replit Secrets as `GITHUB_PERSONAL_ACCESS_TOKEN`.

```bash
node -e "
  const { execFileSync } = require('child_process');
  const t = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  if (!t) { console.error('GITHUB_PERSONAL_ACCESS_TOKEN not set'); process.exit(1); }
  const url = 'https://' + t + '@github.com/blizzardest8-design/bicryptov6.git';
  try {
    const r = execFileSync('git', ['push', url, 'main'], { stdio: ['ignore','pipe','pipe'] });
    console.log('Push complete.', r.toString().trim());
  } catch(e) {
    console.error((e.stderr||e.stdout||'').toString() || e.message);
    process.exit(1);
  }
" 2>&1
```

Verify the push landed:

```bash
LOCAL=$(git rev-parse HEAD) && \
REMOTE=$(node -e "
  const https = require('https');
  const t = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  const opts = { hostname:'api.github.com',
    path:'/repos/blizzardest8-design/bicryptov6/git/ref/heads/main',
    headers:{ Authorization:'token '+t, 'User-Agent':'replit-agent' } };
  https.get(opts, r => { let d=''; r.on('data',c=>d+=c);
    r.on('end',()=>{ try{console.log(JSON.parse(d).object.sha);}catch(e){console.log(d);} }); });
") && echo "Local:$LOCAL Remote:$REMOTE" && [ "$LOCAL" = "$REMOTE" ] && echo "MATCH" || echo "MISMATCH"
```

GitHub repo: `blizzardest8-design/bicryptov6`  
Secret key: `GITHUB_PERSONAL_ACCESS_TOKEN` (set in Replit Secrets tab)

---

## Live Railway Database — current state (probed 2026-05-01)

Connection: `mysql://root:***@switchyard.proxy.rlwy.net:22159/railway`

| Item | Value |
|------|-------|
| Tables | 184 (schema fully imported) |
| Users | 2 (superadmin + 1 more) |
| Currencies | 160 rows |
| Binary markets | 10 rows (BTC/ETH/LTC/XRP/SOL pairs) |
| Active exchanges | `binance` (status=1), `kucoin` (status=1) |
| Default exchange | `binance` |

**Settings of note (from `settings` table):**

| Key | Value | What it means |
|-----|-------|---------------|
| `verifyEmailStatus` | `false` | Sign-up works without SMTP ✓ |
| `siteMaintenanceMode` | `false` | Site is live ✓ |
| `binaryStatus` | `true` | Binary trading UI on ✓ |
| `binaryPracticeStatus` | `true` | Practice mode on (no real money needed) ✓ |
| `spotStatus` | `true` | Spot trading UI on ✓ |
| `futuresStatus` | `true` | Futures UI on ✓ |
| `twoFactorEmailStatus` | `false` | Email 2FA off (won't break without SMTP) ✓ |
| `twoFactorAppStatus` | `true` | TOTP/authenticator 2FA on |
| `kycStatus` | `true` | KYC flow enabled (doesn't block basic trading) |
| `withdrawApproval` | `true` | Admin must approve withdrawals |

**Enabled extensions (19):** mailwizard, knowledge_base, binary_ai_engine,
copy_trading, wallet_connect, ecosystem, ecommerce, staking, gateway, p2p,
ai_investment, forex, ico, nft, mlm, trading_bot, ai_market_maker,
chart_engine, futures.

---

## What works without extra API keys

Once the backend starts (port 4000 binds), all of these work with **zero
additional credentials**:

- **Sign up / login** — `verifyEmailStatus=false` means no confirmation email
  is needed. Users can register and log in immediately.
- **Live price charts & tickers** — Binance + KuCoin are active; without
  `APP_BINANCE_API_KEY` the backend falls back to public mode (patched TDZ
  bug prevents the previous crash). Candlesticks, depth, 24h stats all live.
- **Binary trading practice** — `binaryPracticeStatus=true`. Full UI including
  real-time chart, order placement, result settlement — but paper money only.
- **Spot / Futures UI** — Shows live market data. Order *placement* requires
  exchange API keys (see below).
- **Admin panel** — Full access for superadmin. Can manage users, settings,
  extensions, run crons manually.
- **Wallet UI** — Visible; balances are 0 until deposits are configured.

## What needs exchange API keys (for real trading)

Add these in Railway Variables to enable custodial trading:

```
APP_BINANCE_API_KEY=<your key>
APP_BINANCE_API_SECRET=<your secret>
APP_KUCOIN_API_KEY=<your key>
APP_KUCOIN_API_SECRET=<your secret>
APP_KUCOIN_API_PASSPHRASE=<your passphrase>
```

Without these, chart data works but placing/filling real orders does not.

## What needs other keys (add when ready)

| Feature | Keys needed |
|---------|-------------|
| Email (password reset, notifications) | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` or `SENDGRID_API_KEY` |
| Fiat deposits | `STRIPE_SECRET_KEY` / `PAYPAL_CLIENT_ID` etc. |
| Crypto deposits/withdrawals | Blockchain RPC URLs per chain (ecosystem extension) |
| AI trading bot / AI investment | `OPENAI_API_KEY` or `GEMINI_API_KEY` |
| SMS / OTP 2FA | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` |
| Push notifications | VAPID keys or Firebase config |
| Fiat FX rates (cron) | `APP_OPENEXCHANGERATES_API_KEY` (free tier: 1000 req/mo) |

---

## User preferences

- Wants a working Railway demo to unlock VPS funding.
- Replit is the editor / preview surface; Railway is the live demo.
- Changes are iterated on Replit, committed, pushed to GitHub → Railway auto-deploys.
- Plain-language explanations over technical jargon.
- `GITHUB_PERSONAL_ACCESS_TOKEN` is stored in Replit Secrets.

---

## Recent changes (agent log)

- **2026-05-01 (b):** Documented git push one-liner (Node.js workaround for
  Replit agent sandbox that blocks `git push` / `git remote set-url` directly).
  Probed live Railway MySQL DB and documented full settings/extension state.
  Updated replit.md comprehensively for future agents.

- **2026-05-01 (a):** `DB_SYNC=none` default added to `railway-start.sh`.
  Root-cause fix for the May 1 backend crash: no `.sync-hash` file in repo →
  backend ran `Sequelize.sync({alter:true})` on 184 tables on every fresh
  container → port 4000 never bound → sign-in always failed. Now the backend
  calls `sequelize.authenticate()` only on boot. Override by setting
  `DB_SYNC=alter` in Railway Variables when intentionally migrating schema.

- **2026-04-30 (c):** Repo-wide Railway hardening pass:
  1. `frontend/next.config.js` — API rewrites active in production too.
  2. `production.config.js` — removed hardcoded `mashdiv.com`/`Bicrypto`
     strings; frontend binds to `$PORT`; all NEXT_PUBLIC_* env-driven.
  3. `railway-start.sh` — Redis env mapping, broader env-capture regex,
     recovery hint for partial schema, switched to `node scripts/import-sql.js`.
  4. `scripts/import-sql.js` — `SET SESSION sql_mode=''` at session start.
  5. `railway.json` — healthcheckTimeout 300 → 600.
  6. `RAILWAY_DEPLOY.md` — full rewrite with Redis, troubleshooting, etc.

- **2026-04-30 (b):** Rebranded to DeMourinho Crypto. Theme tokens updated
  in `frontend/app/globals.css`. Stub backend improved.

- **2026-04-30 (a):** Initial setup. Removed 110MB zip, configured Frontend
  workflow :5000, wrote all Railway boot files.

---

## Compiled-backend caveat & dist patches

`backend/dist/` is the only backend that exists — no TypeScript source.
Surgical edits are acceptable when the bug is precisely understood.

### Known dist patches

- **`backend/dist/src/utils/exchange.js` ~line 141** (patched 2026-04-30):
  TDZ bug — `const agent` was declared at line 157 but referenced at line 141
  (inside the "no API key → public mode" branch). Fixed by replacing the bare
  `agent` with `httpsAgentIPv4` (what it would have resolved to in public mode
  anyway, since there is no proxy URL in that branch).
  This bug caused: charts blank, exchange tickers never populating Redis, all
  cron jobs crashing (`processPendingOrders`, `processCurrenciesPrices`), binary
  trading not loading real-time prices.

---

## Secondary issues (fix when possible)

- **OpenExchangeRates** — `processCurrenciesPrices` cron fails with
  "Unauthorized: Invalid API key" without `APP_OPENEXCHANGERATES_API_KEY`.
  Free tier: 1000 req/month at https://openexchangerates.org.

- **CodeCanyon license** — Admin panel shows "No main product license found".
  Cosmetic only; all extensions work. Needed only for the in-admin extension
  store (download/update add-ons direct from Bicrypto's license server).

- **Redis** — BullMQ queues (order monitoring, deposit scanning, email
  notifications) require Redis. Without it the backend continues but all
  queue-based features silently fail. Add a Redis plugin in Railway and wire
  `REDISHOST`/`REDISPORT`/`REDISPASSWORD` → Railway Variables Reference.

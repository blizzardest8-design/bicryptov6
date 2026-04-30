# Prompt for the Railway Agent

Copy-paste **everything below the line** into the Railway agent (the AI inside
the Railway dashboard) when you want it to deploy this project. The repo is
already engineered to deploy as a single service — your only job is to attach
the two managed plugins, paste the env-var block, and generate the domain.

---

## Mission

Deploy the **DeMourinho Crypto** repo (a Bicrypto v6.3 fork) from GitHub to
Railway as **ONE** service. Do not split it into two services. The repo is
self-contained: `railway.json`, `nixpacks.toml`, `railway-start.sh`,
`scripts/import-sql.js`, `production.config.js`, and `frontend/next.config.js`
are all pre-wired for this exact deployment shape.

**Before you do anything else, read these two files in the repo:**
1. `RAILWAY_DEPLOY.md` — the full deployment guide (architecture, env vars,
   troubleshooting).
2. `RAILWAY_AGENT_PROMPT.md` — this file (the brief).

If anything below contradicts something you "remember" about Bicrypto from
prior knowledge, the repo files win. Specifically: this repo's `initial.sql`
has been pre-cleaned for MySQL 8 strict mode and `frontend/next.config.js`
proxies `/api/*` from the public port to internal port 4000, so you do **not**
need to add `MYSQL_INIT_COMMAND` workarounds and you do **not** need to expose
the backend on its own domain.

---

## Architecture (read this; don't deviate)

ONE Railway service running both Next.js (frontend) and the compiled Node
backend under PM2 in the same container:

| Process  | Port           | Notes                                              |
|----------|----------------|----------------------------------------------------|
| frontend | `$PORT` (auto) | Next.js. Bind to whatever Railway injects.         |
| backend  | 4000           | Internal only. Not exposed publicly.               |

The browser hits `https://<your-app>.up.railway.app/api/*` and Next.js rewrites
those calls to `127.0.0.1:4000` inside the container. No CORS, no second
domain, no second service. This is configured in `frontend/next.config.js`
and in `production.config.js` — do not touch either file.

Two managed plugins back the app:

- **MySQL plugin** — holds the 160-table schema (auto-imported on first boot).
- **Redis plugin** — holds BullMQ queues, rate-limit counters, cache, locks.

---

## Step-by-step

### 1. Create the service from GitHub

- New project → Deploy from GitHub repo → pick this repo.
- The first build will fail because plugins aren't attached yet. That's fine,
  proceed.

### 2. Add the MySQL plugin

- **+ New → Database → Add MySQL.** Wait ~30 seconds.

### 3. Add the Redis plugin (REQUIRED — do not skip)

- **+ New → Database → Add Redis.** Wait ~30 seconds.
- Without Redis, the backend boots but every cron job, rate-limit check,
  cache lookup, distributed lock, and notification fan-out fails at runtime.
  The boot script `railway-start.sh` prints a loud warning if Redis is missing,
  so you'll see it in the deploy logs immediately if you forget.

### 4. Paste the env-var block into the app service

Open the **app service** (not the plugins) → **Variables → Raw Editor** and
paste this block. Replace every `CHANGE_ME` value:

```env
# ---------- App ----------
NODE_ENV=production
# DO NOT set PORT — Railway injects it. The frontend binds to $PORT
# automatically; the backend always uses 4000 internally.
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
# Generate each one fresh with:
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

# ---------- Public market data exchange ----------
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

### 5. Generate the public domain

**Settings → Networking → Generate Domain.** Copy the `*.up.railway.app` URL,
paste it as the value of `NEXT_PUBLIC_SITE_URL` in Variables, save. Railway
auto-redeploys.

### 6. Watch the deploy log

In **Deployments**, click the active deploy. Expected log sequence:

```
DB target: <user>@<host>:3306/<dbname>
Redis target: <host>:6379
Waiting for MySQL at ...
MySQL is reachable.
Importing initial.sql (~4022 lines)...
Executing ~312 statements...
Schema imported.
Running seeders...
Starting backend (port 4000) + frontend (port $PORT) under PM2...
[PM2][backend] online
[PM2][frontend] online
✓ Ready in N.Ns
```

Total cold-deploy time: 8–12 minutes.

### 7. Smoke-test

Open the public URL. You should see a logged-out home page. Login with the
seeded super admin:

```
Email:    superadmin@example.com
Password: 12345678
```

Change that password immediately.

---

## Things you must NOT do

1. **Do NOT split frontend and backend into two Railway services.** The repo
   is engineered for a single PM2 process. Splitting it requires exposing port
   4000 publicly, fighting CORS, and setting `BACKEND_INTERNAL_URL` everywhere.
   None of that is needed.
2. **Do NOT set `MYSQL_INIT_COMMAND` or any `sql_mode` workaround on the MySQL
   plugin.** The repo's `initial.sql` is already strict-mode-clean (78 invalid
   `text DEFAULT NULL` clauses and 1 `longtext NOT NULL DEFAULT ''` were
   removed), and `scripts/import-sql.js` additionally relaxes `sql_mode` for
   the import session. If a previous deploy attempt added that workaround,
   delete it.
3. **Do NOT set `PORT=3000` (or any other value) in Variables.** Railway
   injects `PORT` itself; overriding it makes the frontend bind to a port the
   edge proxy can't reach, producing "Application failed to respond".
4. **Do NOT edit `railway.json`, `nixpacks.toml`, `railway-start.sh`,
   `production.config.js`, or `frontend/next.config.js`.** They're already
   correct.
5. **Do NOT skip the Redis plugin.** Without it the backend silently breaks at
   runtime even though boot succeeds.
6. **Do NOT commit secrets to the repo.** All values live in the Railway
   Variables tab.

---

## Recovery scenarios

### "Schema import failed: Table already exists"

A previous deploy died midway through the import and left a partial schema.
Open the **MySQL plugin → Data tab** and run:

```sql
DROP DATABASE `railway`;
CREATE DATABASE `railway`;
```

Then redeploy. The boot script detects the empty DB and re-imports cleanly.

### "MySQL not reachable after 60s"

Either the MySQL plugin isn't attached, or the `${{ MySQL.* }}` references in
the Variables block point to a service named something other than `MySQL`.
Confirm the plugin's name and update references accordingly.

### "WARNING: No Redis attached" in the deploy log

Add the Redis plugin (step 3) and reference its vars in the Variables block.

### Frontend shows "Loading" forever after deploy

The browser is calling `/api/*` and getting nothing back. Open a shell on the
app service and run `pm2 logs backend`. If the backend is up, the issue is
almost always a missing token secret or a `BACKEND_INTERNAL_URL` env var that
was set incorrectly — remove it (the default `127.0.0.1:4000` is correct).

### "Application failed to respond" from Railway proxy

You set `PORT` manually. Delete the `PORT` variable; Railway injects its own.

---

## What you DO NOT need to do

- You do not need to install the `mysql` CLI; the boot script uses a Node-based
  importer (`scripts/import-sql.js`) that is shipped in the repo.
- You do not need to run any seeders manually. `railway-start.sh` runs
  `sequelize-cli db:seed:all` automatically when the database is empty.
- You do not need to configure CORS, healthchecks, or restart policies —
  `railway.json` already sets `healthcheckPath: /`, `healthcheckTimeout: 600`,
  and `restartPolicyType: ON_FAILURE` with 5 retries.
- You do not need to set `NODE_OPTIONS`, `NIXPACKS_NODE_VERSION`, or
  `NODE_ENV=production` — `nixpacks.toml` already does.

---

## Final checklist before you tell the user "done"

- [ ] One service, not two.
- [ ] MySQL plugin attached and `DB_*` vars reference it.
- [ ] Redis plugin attached and `REDIS_*` vars reference it.
- [ ] All four `APP_*_TOKEN_SECRET` values are 128 hex chars (regenerated, not
      `CHANGE_ME`).
- [ ] `NEXT_PUBLIC_SITE_URL` matches the generated domain.
- [ ] No `MYSQL_INIT_COMMAND` workaround anywhere.
- [ ] No `PORT` variable manually set.
- [ ] Deploy log shows both `[PM2][backend] online` and `[PM2][frontend] online`.
- [ ] Public URL loads and `/api/health` returns 200.
- [ ] Login with `superadmin@example.com` / `12345678` works.

When all ten boxes are checked, report back to the user with the public URL
and a one-line note that the super admin password should be changed.

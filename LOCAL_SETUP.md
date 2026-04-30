# LOCAL_SETUP.md — Autonomous Setup Guide for AI Agents

This file is written for an AI coding agent (Replit, Cursor, Claude Code, etc.)
that opens this repo cold and needs to bring it from zero to a running dev
preview without asking the human a single question.

> **Project**: DeMourinho Crypto (Bicrypto v6.3.0 fork) — Next.js 16 frontend +
> compiled Node.js backend + MySQL.
> **Hard rule**: never modify anything under `backend/dist/`. The backend ships
> as compiled JavaScript only — no source.

---

## TL;DR — copy-paste sequence

```bash
# 1. Install runtimes (Replit: use the package-management skill; otherwise nvm)
node -v   # must be 22.x  (nodejs-22)
pnpm -v   # must be 9.x   (`npm i -g pnpm@9` if missing)

# 2. Install deps for the workspace + the frontend package
pnpm install
pnpm --dir frontend install

# 3. Generate the demo .env at repo root (idempotent)
node scripts/replit-dev-env.js
#  → if .env already exists, prefix with REPLIT_DEV_OVERWRITE=1 to overwrite

# 4. Boot the dev preview (frontend on 5000, stub backend on 4000)
node scripts/replit-dev-env.js && \
  cd frontend && \
  PORT=5000 NEXT_PUBLIC_FRONTEND_PORT=5000 NEXT_PUBLIC_BACKEND_PORT=4000 \
  NODE_OPTIONS='--max-old-space-size=4096' \
  pnpm exec next dev --webpack -H 0.0.0.0 -p 5000
```

If you are inside Replit, the workflow named **Frontend** already runs the
exact command above — just call `restart_workflow("Frontend")`.

---

## Repo map (what an agent needs to know)

```
.
├── frontend/                  Next.js 16 source — EDIT FREELY
│   ├── app/                   App-router pages
│   ├── components/            UI components
│   ├── lib/siteInfo.ts        Brand name + URLs (env-driven)
│   ├── messages/*.json        i18n strings (12+ languages)
│   ├── public/                Static assets (logos go in /img/logo/ on backend)
│   └── next.config.js         Allowed dev origins are pre-patched for Replit
├── backend/                   COMPILED — DO NOT EDIT
│   ├── dist/                  Compiled JS, run via PM2 in production
│   └── src/                   May be missing on commercial builds
├── scripts/
│   ├── replit-dev-env.js      Writes the demo .env
│   ├── stub-backend.js        Tiny port-4000 stub (used when MySQL absent)
│   └── import-sql.js          Pure-Node SQL importer (Railway fallback)
├── railway.json + nixpacks.toml + railway-start.sh
│                              Railway deployment glue
├── initial.sql                160-table schema seed (super admin included)
├── database_export.sql.gz     Richer alt seed (use one OR the other)
├── .env                       COMMITTED demo file — every value is a placeholder
├── .env.example               Original reference template
├── replit.md                  Human + agent project notes
├── RAILWAY_DEPLOY.md          Step-by-step Railway deployment
└── RAILWAY_AGENT_PROMPT.md    Drop-in prompt for the next AI agent
```

---

## Environment / secrets

* `.env` is **committed on purpose** for this demo. Every value is either a
  safe public default, an empty string, or a randomly-generated demo token.
* The only secret an agent ever needs is `GITHUB_PERSONAL_ACCESS_TOKEN` (for
  pushing to the repo). On Replit it is exposed via the environment-secrets
  skill; on other hosts the human must export it manually.
* Real production keys belong in the host's secret manager (Railway
  Variables, Replit Secrets, Vercel env, etc.) — **never** edit `.env` with
  real values and commit the result.

---

## Common agent tasks

### Run the dev preview

```bash
restart_workflow("Frontend")          # Replit
# OR
pnpm --dir frontend dev -- --port 5000 -H 0.0.0.0
```

Verify with: `curl -sI http://localhost:5000` → expect `HTTP/1.1 200`.

### Rebrand (everything is env-driven)

* Brand name → `NEXT_PUBLIC_SITE_NAME` in `.env` and Railway Variables.
* Brand description → `NEXT_PUBLIC_SITE_DESCRIPTION`.
* Theme colors → `frontend/app/globals.css` (`:root` + `.dark` blocks).
* Logos → drop files at `frontend/public/img/logo/logo.webp`,
  `logo-dark.webp`, `favicon.ico`. The Next.js dev server is pre-configured
  to allow `*.replit.dev` and `*.up.railway.app` origins.

### Push to GitHub

```bash
TOKEN="$GITHUB_PERSONAL_ACCESS_TOKEN"
git remote remove github 2>/dev/null || true
git remote add github "https://x-access-token:${TOKEN}@github.com/neilstrauss8686-pixel/bicryptov6.git"
git add -A && git commit -m "chore: agent checkpoint"
git push github HEAD:main
```

### Deploy to Railway

Read `RAILWAY_DEPLOY.md` end-to-end, then follow `RAILWAY_AGENT_PROMPT.md`
for the agent-friendly version.

---

## Known sharp edges

* **`backend/dist/` is read-only**. If a feature is missing, fix it in
  `frontend/` or in `scripts/stub-backend.js`. Never patch compiled JS.
* **Browser "Failed to fetch" on the home page** is expected on Replit when
  the real backend isn't running — the stub returns `{ data: null }` for
  `/api/content/*` so the UI degrades gracefully.
* **Direct edits to `.env`** are blocked by Replit's secret-leakage guard.
  Always regenerate via `REPLIT_DEV_OVERWRITE=1 node scripts/replit-dev-env.js`.
* **Workspace uses pnpm**, not npm or yarn. Mixing lockfiles will break
  Railway's nixpacks build.

---

## "How do I know it's working?"

| Check | Expected |
|------|----------|
| `curl -sI http://localhost:5000` | `HTTP/1.1 200 OK` |
| Browser preview | DeMourinho Crypto landing page renders, emerald primary button visible |
| Workflow logs | `✓ Ready in <N>s`, no `EADDRINUSE`, no `MODULE_NOT_FOUND` |
| `git --no-optional-locks log --oneline -1` | Most recent commit reflects your latest change |

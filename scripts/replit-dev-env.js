#!/usr/bin/env node
/**
 * scripts/replit-dev-env.js
 *
 * Writes the canonical demo .env at the workspace root.
 *
 * Goals:
 *   1. Boot cleanly on Replit (frontend dev preview) and on Railway
 *      (frontend + backend production).
 *   2. Be 100% safe to commit — every value is a placeholder/demo.
 *   3. Be idempotent — only writes if .env is missing OR if
 *      REPLIT_DEV_OVERWRITE=1 is exported in the environment.
 *
 * Replace every value before going to real production:
 *   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
 *   npx web-push generate-vapid-keys
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ENV_PATH = path.join(ROOT, ".env");

if (fs.existsSync(ENV_PATH) && process.env.REPLIT_DEV_OVERWRITE !== "1") {
  console.log("[demo-env] .env already exists, leaving it alone.");
  process.exit(0);
}

const lines = `# ============================================================================
# DeMourinho Crypto — DEMO environment file
# ----------------------------------------------------------------------------
# This file is intentionally COMMITTED so the project boots with safe demo
# defaults on Railway and any other host. Every value here is a placeholder.
# Replace them with real production secrets before going live.
#
# Regenerate this file (overwrites in place):
#   REPLIT_DEV_OVERWRITE=1 node scripts/replit-dev-env.js
# Generate fresh JWT secrets:
#   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Generate fresh VAPID keys:
#   npx web-push generate-vapid-keys
# ============================================================================

# --------------- App ---------------------------------------------------------
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_NAME="DeMourinho Crypto"
NEXT_PUBLIC_SITE_DESCRIPTION="DeMourinho Crypto — premium cryptocurrency exchange and trading platform."
NEXT_PUBLIC_DEMO_STATUS="true"
NODE_ENV="production"
PORT="3000"
NEXT_PUBLIC_FRONTEND_PORT="3000"
NEXT_PUBLIC_BACKEND_PORT="4000"
NEXT_PUBLIC_BACKEND_THREADS="2"
NEXT_PUBLIC_DEFAULT_LANGUAGE="en"
NEXT_PUBLIC_LANGUAGES="en,es,fr,de,it,pt,ru,ar,ja,ko,hi,tr"
NEXT_PUBLIC_DEFAULT_THEME="dark"
NEXT_PUBLIC_FRONTEND="true"
NEXT_PUBLIC_ALLOWED_DEV_IPS=""

# --------------- Database (Railway: railway-start.sh maps MYSQL_* into DB_*) -
DB_HOST="localhost"
DB_PORT="3306"
DB_USER="root"
DB_PASSWORD=""
DB_NAME="v4"

# --------------- Token secrets (DEMO — rotate before production) ------------
APP_ACCESS_TOKEN_SECRET="3b415f1023e6e49a656fd43ecdea80cb8a60ae3e015090bab4fc1f30a8abfc8084e89b699fc16a5e7c0291bc43b5d3ab71ce02348c7f3c28ad61144eb8563d62"
APP_REFRESH_TOKEN_SECRET="1307b1aba1e2041b1ae5cd5065bd7431d798543cee60eed0caf50cef13b877cb2a2657debe18d7aa12ac9a279a301d40007b30a703fc25b0ccad817daf70827c"
APP_RESET_TOKEN_SECRET="c6aa56f0d6ef9f4272d95134f5a65a9ed609fbe971cdfe542d890387f94cdac46017ebe6bdbf1e1736763d2bbc7505a9cb107a8c186732e2b846cb948ce4580d"
APP_VERIFY_TOKEN_SECRET="90d1a95590f3cd20503eed82c7b069f5992cf48a2defe361d85e8418d2ef61f0570381162b7246346ea3d854b7bab3fe258b166846c625425e515fc48a8583c1"
JWT_EXPIRY="30m"
JWT_REFRESH_EXPIRY="30d"
JWT_RESET_EXPIRY="1h"

# --------------- Rate limiting ----------------------------------------------
RATE_LIMIT="100"
RATE_LIMIT_EXPIRY="60"
APP_CLIENT_PLATFORM="browser"

# --------------- Public market data (no keys required) ----------------------
NEXT_PUBLIC_EXCHANGE="bin"

# --------------- Public OAuth / analytics (blank = feature off) -------------
NEXT_PUBLIC_GOOGLE_CLIENT_ID=""
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=""
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=""

# --------------- Payment providers (DEMO — set real keys to enable) ---------
APP_STRIPE_PUBLIC_KEY=""
APP_STRIPE_SECRET_KEY=""
NEXT_PUBLIC_APP_PAYPAL_CLIENT_ID=""
APP_PAYPAL_CLIENT_SECRET=""
APP_PAYSTACK_SECRET_KEY=""
APP_PAYSTACK_PUBLIC_KEY=""
OANDA_API_KEY=""

# --------------- Mailer (DEMO uses local sendmail; safe to leave blank) -----
APP_EMAILER="local"
NEXT_PUBLIC_APP_EMAIL="admin@demourinho.example"
APP_EMAIL_SENDER_NAME="DeMourinho Crypto"
APP_NODEMAILER_SERVICE="gmail"
APP_NODEMAILER_SERVICE_SENDER=""
APP_NODEMAILER_SERVICE_PASSWORD=""
APP_NODEMAILER_SMTP_HOST=""
APP_NODEMAILER_SMTP_PORT="587"
APP_NODEMAILER_SMTP_ENCRYPTION="tls"
APP_NODEMAILER_SMTP_SENDER=""
APP_NODEMAILER_SMTP_PASSWORD=""
APP_SENDGRID_API_KEY=""
APP_SENDGRID_SENDER=""
APP_SENDMAIL_PATH="/usr/sbin/sendmail"

# --------------- Auth / SMS (DEMO blank — disables Twilio OTP) --------------
APP_TWILIO_ACCOUNT_SID=""
APP_TWILIO_VERIFY_SERVICE_SID=""
APP_TWILIO_AUTH_TOKEN=""
APP_TWILIO_PHONE_NUMBER=""
APP_TWILIO_MESSAGING_SERVICE_SID=""
APP_SUPPORT_PHONE_NUMBER=""

# --------------- Notifications / cache --------------------------------------
REDIS_HOST=""
REDIS_PORT="6379"
REDIS_PASSWORD=""

# --------------- Mobile push (FCM) — disabled until real creds set ----------
FCM_PROJECT_ID=""
FCM_PRIVATE_KEY=""
FCM_CLIENT_EMAIL=""
FCM_SERVICE_ACCOUNT_PATH=""

# --------------- Web push (DEMO VAPID keys — rotate for production) ---------
VAPID_PUBLIC_KEY="BBJweYorVRXKvRsYuhbKj0ZhlF4PAMNgLdQ38yPM7X-VhLozK2HCQd8fi58rEw0YhgE5rycJFhMH-cePfCpXUYw"
VAPID_PRIVATE_KEY="hLozK2HCQd8fi58rEw0YhgE5rycJFhMH-cePfCpXUYw"
VAPID_SUBJECT="mailto:admin@demourinho.example"

# --------------- Exchange API keys (blank = market data only, no trading) ---
APP_KUCOIN_API_KEY=""
APP_KUCOIN_API_SECRET=""
APP_KUCOIN_API_PASSPHRASE=""
APP_BINANCE_API_KEY=""
APP_BINANCE_API_SECRET=""
APP_XT_API_KEY=""
APP_XT_API_SECRET=""

# --------------- AI providers (blank = AI features disabled) ----------------
OPENAI_API_KEY=""
DEEPSEEK_API_KEY=""
GEMINI_API_KEY=""

# --------------- FIAT rates -------------------------------------------------
APP_FIAT_RATES_PROVIDER="openexchangerates"
APP_OPENEXCHANGERATES_APP_ID=""
APP_EXCHANGERATE_API_KEY=""
`;

fs.writeFileSync(ENV_PATH, lines);
console.log("[demo-env] wrote", ENV_PATH);

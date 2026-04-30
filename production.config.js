// PM2 production config for single-service deploys (Railway, VPS, Docker, etc).
// Frontend binds to PORT (set by the host platform; defaults to 3000).
// Backend binds to BACKEND_PORT (defaults to 4000) and is reached locally
// via the Next.js rewrites in frontend/next.config.js.
//
// Every NEXT_PUBLIC_* value falls back to a sensible default but is overridden
// by whatever the host environment provides. Nothing is hardcoded to a domain.

const PORT = process.env.PORT || 3000;
const BACKEND_PORT = process.env.BACKEND_PORT || 4000;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:${PORT}`;
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "DeMourinho Crypto";
const SITE_DESCRIPTION =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "DeMourinho Crypto Exchange Platform";

const frontendEnv = {
  NODE_ENV: "production",
  PORT: String(PORT),
  NEXT_PUBLIC_SITE_URL: SITE_URL,
  NEXT_PUBLIC_BACKEND_PORT: String(BACKEND_PORT),
  NEXT_PUBLIC_FRONTEND_PORT: String(PORT),
  NEXT_PUBLIC_SITE_NAME: SITE_NAME,
  NEXT_PUBLIC_SITE_DESCRIPTION: SITE_DESCRIPTION,
};

module.exports = {
  apps: [
    {
      name: "backend",
      script: "./backend/dist/index.js",
      env: {
        NODE_ENV: "production",
        PORT: String(BACKEND_PORT),
      },
      env_production: {
        NODE_ENV: "production",
        PORT: String(BACKEND_PORT),
      },
      exec_mode: "fork",
      instances: 1,
    },
    {
      name: "frontend",
      script: "./frontend/node_modules/next/dist/bin/next",
      args: "start",
      cwd: "./frontend",
      env: frontendEnv,
      env_production: frontendEnv,
      exec_mode: "fork",
      instances: 1,
    },
  ],
};

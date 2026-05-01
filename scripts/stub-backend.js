#!/usr/bin/env node
/**
 * Tiny stub backend for Replit dev preview.
 *
 * The real Bicrypto backend needs MySQL, which Replit doesn't host. Without
 * any backend on port 4000, the Next.js dev server logs hundreds of
 * ECONNREFUSED errors per page load (the proxy middleware tries to forward
 * /api/*, /img/*, etc.). That's noisy AND can cause the dev server to
 * misbehave.
 *
 * This script answers just enough requests to keep the frontend quiet:
 *   - /api/settings    → empty {} so the settings hook doesn't throw
 *   - /api/health      → ok
 *   - /img/*           → 1x1 transparent PNG
 *   - everything else  → 503 + json explanation
 *
 * For Railway, the real backend runs and this script is unused.
 */
const http = require("http");

const PORT = parseInt(process.env.STUB_PORT || "4000", 10);

// 1x1 transparent PNG
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64"
);

const STUB_SETTINGS = {
  // Minimum settings shape the frontend expects
  site_name: "DeMourinho Crypto (dev)",
  site_url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:5000",
  default_theme: "dark",
  default_language: "en",
  languages: ["en"],
  demo_status: false,
  social: {},
  features: {},
};

const server = http.createServer((req, res) => {
  const url = req.url || "/";

  // CORS for dev — echo origin so credentialed fetches work
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", req.headers["access-control-request-headers"] || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,OPTIONS");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (url.startsWith("/api/health")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "stub-ok" }));
    return;
  }

  if (url.startsWith("/api/settings")) {
    // Frontend expects { settings: [{key,value}, ...], extensions: [...] }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        settings: Object.entries(STUB_SETTINGS).map(([key, value]) => ({
          key,
          value: typeof value === "object" ? JSON.stringify(value) : String(value),
        })),
        extensions: [],
      })
    );
    return;
  }

  // Roles endpoint — middleware/auth.ts wants an array
  if (url.startsWith("/api/auth/role")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify([]));
    return;
  }

  // PoW captcha challenge — return disabled so login form doesn't spin forever
  if (url.startsWith("/api/auth/pow/challenge")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ enabled: false }));
    return;
  }

  // Login / register / password — return a clear error pointing to Railway
  if (
    url.startsWith("/api/auth/login") ||
    url.startsWith("/api/auth/register") ||
    url.startsWith("/api/auth/password") ||
    url.startsWith("/api/auth/logout") ||
    url.startsWith("/api/auth/verify")
  ) {
    res.writeHead(503, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "This is the Replit dev preview — login/register requires the real backend on Railway. Open your Railway URL to sign in.",
      })
    );
    return;
  }

  // Page content (home, etc.) — return empty page so the home renderer
  // falls through to its default layout instead of erroring.
  if (url.startsWith("/api/content/")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        title: "Bicrypto",
        slug: "home",
        content: [],
        meta: {},
      })
    );
    return;
  }

  // Auth: pretend nobody is logged in
  if (url.startsWith("/api/auth/profile") || url.startsWith("/api/user/profile")) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "unauthorized" }));
    return;
  }

  if (url.startsWith("/img/") || url.startsWith("/uploads/")) {
    res.writeHead(200, {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    });
    res.end(PIXEL);
    return;
  }

  // Generic /api/* → empty list/object so consumers don't throw
  if (url.startsWith("/api/")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ data: [], items: [], total: 0, _stub: true }));
    return;
  }

  // Default: 503 with a clear note
  res.writeHead(503, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      error: "stub-backend",
      note: "Real backend not running on Replit (needs MySQL). This is a dev stub. Deploy to Railway for full backend.",
      path: url,
    })
  );
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[stub-backend] listening on http://127.0.0.1:${PORT}`);
});

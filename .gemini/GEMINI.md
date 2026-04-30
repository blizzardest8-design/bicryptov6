## Environment
- Windows 10/11. Terminal is PowerShell 7+ (pwsh). NEVER use Unix commands (ls, rm, cat).
- Current Machine Specs: Node.js v24.14.0, npm v11.11.1.
- WSL is enabled, but currently only `docker-desktop` is installed. Ubuntu or another Linux distro might need to be installed for native WSL2 Redis/MySQL.
- ALL commands must use flat format: `pwsh -c command` — never wrap in outer quotes unless using shell operators (&&, |, >).
- NEVER run long-running servers (npm run dev, npm start) autonomously. STOP and ask the user to run these manually in a separate terminal.
- For large command output, always limit results to avoid context flooding: e.g. `pwsh -c git log -n 5`

## Project
- This is Bicrypto v6 — a full-stack crypto trading platform.
- Frontend: Next.js (React) — in /frontend folder
- Backend: Node.js with MashServer framework — in /backend folder  
- Database: MySQL 8
- Cache: Real-time: Redis 7
- NO Docker. Install all services natively via WSL2.

## Your Approach
- Before writing a single file or running a single command, read ALL files in this project completely. Build your full mental model first.
- Search the web to verify any version number, package name, or command syntax before using it.
- Show me your plan as a numbered list before executing each phase. Wait for my approval.
- After each phase, verify it worked before moving to the next.
- Commit to Git after each stable phase.

## Task Prompt Phases

Phase 1 — Audit: Search the web for the current Bicrypto v6 official documentation at support.web3div.com. Then read every file in this project. Report: exact Node.js version required, all environment variables needed, the correct install order for backend vs frontend, and any known Windows-specific issues in the docs.
Phase 2 — Git: Initialise a Git repo. Create a thorough .gitignore (node_modules, .next, .env files, build folders, logs). Create .env.example for both /frontend and /backend with all required keys but no real values. Initial commit.
Phase 3 — Dependencies: Check what's installed on this machine (Node version, MySQL, Redis). Search the web for how to install MySQL 8 and Redis 7 natively on WSL2 in 2026. Install whatever is missing. Verify each service is running before proceeding.
Phase 4 — Backend: Configure /backend .env with local development values. Run npm install. Attempt to start the backend — but DO NOT run it autonomously. Show me the exact command and ask me to run it in a separate terminal, then tell me what healthy output should look like.
Phase 5 — Frontend: Configure /frontend .env.local. Run npm install. Show me the exact npm run dev command for me to run manually. Confirm what port to expect and what the first screen should look like.
Phase 6 — Verify: Once I confirm both are running, walk me through logging into the admin panel, connecting a test exchange API, and confirming the trading UI loads with live data.
Search the web at each phase if you hit an error before asking me.

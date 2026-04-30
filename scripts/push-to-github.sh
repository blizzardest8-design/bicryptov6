#!/usr/bin/env bash
# scripts/push-to-github.sh
#
# Safe one-liner to push the current main branch to the demo GitHub repo.
# Uses GITHUB_PERSONAL_ACCESS_TOKEN from the environment — never written to disk.
#
# Usage:  bash scripts/push-to-github.sh

set -euo pipefail

REPO_URL="github.com/musyavosty/bicryptov6.git"
REMOTE="github"

if [ -z "${GITHUB_PERSONAL_ACCESS_TOKEN:-}" ]; then
  echo "ERROR: GITHUB_PERSONAL_ACCESS_TOKEN is not set in the environment." >&2
  exit 1
fi

# (Re)wire the github remote with the embedded token.
if git remote | grep -q "^${REMOTE}$"; then
  git remote set-url "${REMOTE}" "https://x-access-token:${GITHUB_PERSONAL_ACCESS_TOKEN}@${REPO_URL}"
else
  git remote add "${REMOTE}" "https://x-access-token:${GITHUB_PERSONAL_ACCESS_TOKEN}@${REPO_URL}"
fi

# Make sure local main has every change committed before pushing.
git add -A
if ! git diff --cached --quiet; then
  git commit -m "chore(deploy): Railway hardening pass + updated agent prompt"
fi

# Push main → main. Plain push, no force.
git push "${REMOTE}" HEAD:main

# Wipe the embedded token from the remote URL so it never lands in .git/config logs.
git remote set-url "${REMOTE}" "https://${REPO_URL}"
echo "Pushed to https://${REPO_URL%.git}"

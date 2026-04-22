#!/usr/bin/env bash
# Vercel "Root Directory" = apps/web: cwd is apps/web when this runs.
# Resolves DB URL the same way as @launchramp/db at runtime, then migrates + builds Next.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ "${SKIP_PRISMA_MIGRATE:-}" == "1" ]]; then
  echo "SKIP_PRISMA_MIGRATE=1 — skipping prisma migrate deploy"
else
  if [[ -n "${DATABASE_URL:-}" ]]; then
    export DATABASE_URL
  elif [[ -n "${POSTGRES_PRISMA_URL:-}" ]]; then
    export DATABASE_URL="$POSTGRES_PRISMA_URL"
  elif [[ -n "${POSTGRES_URL:-}" ]]; then
    export DATABASE_URL="$POSTGRES_URL"
  else
    echo "ERROR: Set one of DATABASE_URL, POSTGRES_PRISMA_URL, or POSTGRES_URL in Vercel (Production + Preview) and ensure it is available at build time."
    exit 1
  fi

  echo "Running prisma migrate deploy (schema=packages/db/prisma/schema.prisma)…"
  npx --yes prisma@5.22.0 migrate deploy --schema=packages/db/prisma/schema.prisma
fi

echo "Building Next.js (apps/web)…"
cd apps/web
npm run build

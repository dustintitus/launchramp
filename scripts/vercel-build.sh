#!/usr/bin/env bash
# Invoked from monorepo root via: npm run vercel:build-web
# (Vercel Root Directory = apps/web → buildCommand: cd ../.. && npm run vercel:build-web)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

echo "=== vercel-build.sh ==="
echo "ROOT=$ROOT"
echo "SKIP_PRISMA_MIGRATE=${SKIP_PRISMA_MIGRATE:-}"
echo "DATABASE_URL set: $([[ -n "${DATABASE_URL:-}" ]] && echo yes || echo no)"
echo "POSTGRES_PRISMA_URL set: $([[ -n "${POSTGRES_PRISMA_URL:-}" ]] && echo yes || echo no)"
echo "POSTGRES_URL set: $([[ -n "${POSTGRES_URL:-}" ]] && echo yes || echo no)"

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
    echo "ERROR: Set DATABASE_URL, POSTGRES_PRISMA_URL, or POSTGRES_URL for Vercel (build + runtime)."
    exit 1
  fi

  SCHEMA="packages/db/prisma/schema.prisma"
  echo "Running: npx prisma@5.22.0 migrate deploy --schema=$SCHEMA"
  if ! npx --yes prisma@5.22.0 migrate deploy --schema="$SCHEMA"; then
    echo "migrate deploy failed. Status:"
    npx --yes prisma@5.22.0 migrate status --schema="$SCHEMA" || true
    exit 1
  fi
fi

if [[ ! -d apps/web ]]; then
  echo "ERROR: apps/web missing under ROOT (wrong repo root?)."
  ls -la
  exit 1
fi

echo "Running: (cd apps/web && npm run build)"
cd apps/web
npm run build

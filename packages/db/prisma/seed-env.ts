import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

/** Monorepo root (this file: packages/db/prisma/seed-env.ts) */
const monorepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);

config({ path: path.join(monorepoRoot, '.env') });
// Prefer `.env` for local dev. `.env.local` is typically Vercel-managed and may
// point at a remote database; we don't want seeding to accidentally hit that.
config({ path: path.join(monorepoRoot, '.env.local') });

import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

/** Monorepo root (this file: packages/db/prisma/seed-env.ts) */
const monorepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);

config({ path: path.join(monorepoRoot, '.env') });
config({ path: path.join(monorepoRoot, '.env.local'), override: true });

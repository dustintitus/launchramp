/**
 * Run `prisma migrate deploy` only on Vercel builds.
 * Vercel often detects Turborepo and ignores apps/web/vercel.json `buildCommand`;
 * hooking into @launchramp/web `prebuild` ensures migrations still run before `next build`.
 */
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

if (process.env.SKIP_PRISMA_MIGRATE === '1') {
  console.log('vercel-migrate-if-prod: SKIP_PRISMA_MIGRATE=1 — skip');
  process.exit(0);
}
if (process.env.VERCEL !== '1') {
  console.log('vercel-migrate-if-prod: not Vercel — skip');
  process.exit(0);
}

const root = path.resolve(__dirname, '..');
const schema = path.join(root, 'packages/db/prisma/schema.prisma');

let prismaCli;
try {
  prismaCli = require.resolve('prisma/build/index.js', { paths: [root] });
} catch {
  console.error(
    'vercel-migrate-if-prod: prisma CLI missing; add prisma to root package.json dependencies.'
  );
  process.exit(1);
}

if (!fs.existsSync(schema)) {
  console.error('vercel-migrate-if-prod: schema not found:', schema);
  process.exit(1);
}

const dbUrl =
  process.env.DATABASE_URL?.trim() ||
  process.env.POSTGRES_PRISMA_URL?.trim() ||
  process.env.POSTGRES_URL?.trim();

if (!dbUrl) {
  console.error(
    'vercel-migrate-if-prod: set DATABASE_URL, POSTGRES_PRISMA_URL, or POSTGRES_URL on Vercel.'
  );
  process.exit(1);
}

console.log('vercel-migrate-if-prod: running prisma migrate deploy…');
const r = spawnSync(
  process.execPath,
  [prismaCli, 'migrate', 'deploy', '--schema', schema],
  {
    stdio: 'inherit',
    cwd: root,
    env: { ...process.env, DATABASE_URL: dbUrl },
  }
);
if (r.status !== 0) {
  console.error('vercel-migrate-if-prod: migrate deploy failed; status:', r.status);
  spawnSync(
    process.execPath,
    [prismaCli, 'migrate', 'status', '--schema', schema],
    { stdio: 'inherit', cwd: root, env: { ...process.env, DATABASE_URL: dbUrl } }
  );
  process.exit(r.status ?? 1);
}
console.log('vercel-migrate-if-prod: migrate deploy ok');

/**
 * Run `prisma migrate deploy` on Vercel (see apps/web package.json prebuild).
 *
 * P3005 ("database schema is not empty"): common on Prisma Postgres / DBs created
 * with `db push` or partial SQL. On Vercel we auto-recover by default (db push + resolve),
 * unless PRISMA_NO_AUTO_SYNC_P3005=1. Manual overrides:
 *   PRISMA_VERCEL_SYNC=1       — same as auto path; explicit opt-in (optional).
 *   PRISMA_BASELINE_ON_P3005=1 — only `migrate resolve --applied` (DB must already match SQL).
 *   PRISMA_FAIL_OPEN_MIGRATE=1 — if migrate still fails, exit 0 so the Vercel build can finish (dangerous).
 *   PRISMA_DB_PUSH_ACCEPT_DATA_LOSS=1 — pass --accept-data-loss to db push during P3005 recovery.
 *   RUN_VERCEL_MIGRATE_SCRIPT=1 — run this script without VERCEL=1 (e.g. local dry run).
 * migrate URLs: prisma:// / prisma+postgres:// (Accelerate) are skipped; use postgresql:// for deploy.
 */
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

if (process.env.SKIP_PRISMA_MIGRATE === '1') {
  console.log('vercel-migrate-if-prod: SKIP_PRISMA_MIGRATE=1 — skip');
  process.exit(0);
}
/** When unset, still run on Vercel (VERCEL=1). CI e.g. GitHub Actions can set VERCEL=1 + DATABASE_URL. */
const runMigrate =
  process.env.VERCEL === '1' || process.env.RUN_VERCEL_MIGRATE_SCRIPT === '1';
if (!runMigrate) {
  console.log(
    'vercel-migrate-if-prod: skip (set VERCEL=1 or RUN_VERCEL_MIGRATE_SCRIPT=1 to run)'
  );
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

function isAccelerateOrDataProxy(url) {
  return /^prisma(\+postgres)?:\/\//i.test(url);
}

/**
 * migrate deploy / db push require a real Postgres connection string.
 * prisma+ / prisma:// (Accelerate, Data Proxy) always fail here.
 */
function pickMigrateUrl() {
  const candidates = [
    process.env.DATABASE_URL?.trim(),
    process.env.POSTGRES_URL_NON_POOLING?.trim(),
    process.env.POSTGRES_PRISMA_URL?.trim(),
    process.env.POSTGRES_URL?.trim(),
    process.env.PRISMA_DATABASE_URL?.trim(),
  ].filter(Boolean);

  const direct = candidates.find((u) => !isAccelerateOrDataProxy(u));
  if (direct) return direct;

  if (candidates.length > 0) {
    console.error(
      'vercel-migrate-if-prod: only prisma:// or prisma+postgres:// URLs are set; migrate needs a postgresql:// URL.\n' +
        'Add POSTGRES_URL_NON_POOLING (Vercel Postgres) or a direct DATABASE_URL for builds — not the Accelerate / Data Proxy string.'
    );
    process.exit(1);
  }

  return null;
}

const dbUrl = pickMigrateUrl();

if (!dbUrl) {
  console.error(
    'vercel-migrate-if-prod: set DATABASE_URL (or POSTGRES_URL_NON_POOLING / POSTGRES_PRISMA_URL / POSTGRES_URL / PRISMA_DATABASE_URL) on Vercel. Ensure Postgres vars are enabled for Builds, not only Runtime.'
  );
  process.exit(1);
}

try {
  const u = new URL(dbUrl.replace(/^postgres(ql)?:/i, 'postgres:'));
  console.log(
    `vercel-migrate-if-prod: datasource ${u.hostname}${u.pathname === '/' ? '' : u.pathname} (direct connection for migrate)`
  );
} catch {
  console.log('vercel-migrate-if-prod: datasource URL set');
}

const env = { ...process.env, DATABASE_URL: dbUrl };

function migrationDirectories() {
  const m = path.join(root, 'packages/db/prisma/migrations');
  if (!fs.existsSync(m)) return [];
  return fs
    .readdirSync(m)
    .filter((n) => /^\d+_/.test(n) && fs.statSync(path.join(m, n)).isDirectory())
    .sort();
}

function spawnPrisma(args, inherit = false) {
  return spawnSync(process.execPath, [prismaCli, ...args], {
    encoding: 'utf-8',
    cwd: root,
    env,
    stdio: inherit ? 'inherit' : ['inherit', 'pipe', 'pipe'],
  });
}

function migrateDeployWithLogs() {
  const r = spawnPrisma(['migrate', 'deploy', '--schema', schema], false);
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  const out = `${r.stdout || ''}\n${r.stderr || ''}`;
  return { status: r.status === 0 ? 0 : r.status ?? 1, out };
}

function migrateStatus() {
  spawnPrisma(['migrate', 'status', '--schema', schema], true);
}

function resolveAllApplied() {
  const dirs = migrationDirectories();
  if (dirs.length === 0) {
    console.error('vercel-migrate-if-prod: no migration folders under prisma/migrations');
    process.exit(1);
  }
  for (const name of dirs) {
    console.log(`vercel-migrate-if-prod: migrate resolve --applied "${name}"`);
    const r = spawnPrisma(
      ['migrate', 'resolve', '--applied', name, '--schema', schema],
      false
    );
    if (r.stdout) process.stdout.write(r.stdout);
    if (r.stderr) process.stderr.write(r.stderr);
    const combined = `${r.stdout || ''}\n${r.stderr || ''}`;
    if (r.status === 0) continue;
    if (
      /already recorded as applied|is already applied|\bP3008\b/i.test(combined)
    ) {
      console.log(
        `vercel-migrate-if-prod: resolve non-fatal for "${name}" (already applied); continuing`
      );
      continue;
    }
    process.exit(r.status ?? 1);
  }
}

function printP3005Help() {
  console.error(`
vercel-migrate-if-prod: Prisma P3005 — database is not empty and migrate cannot apply from scratch.

  PRISMA_BASELINE_ON_P3005=1 — only migrate resolve --applied (use when DB already matches migration SQL).

By default on Vercel, any other P3005 runs: prisma db push --skip-generate, resolve all migrations
as applied, then migrate deploy again. To skip that (show this message instead):
  PRISMA_NO_AUTO_SYNC_P3005=1

  PRISMA_VERCEL_SYNC=1 — same as the default db push path (explicit opt-in; optional).

Docs: https://pris.ly/d/migrate-baseline
`);
}

console.log('vercel-migrate-if-prod: prisma migrate deploy…');
let { status, out } = migrateDeployWithLogs();

if (status === 0) {
  console.log('vercel-migrate-if-prod: migrate deploy ok');
  process.exit(0);
}

console.error('vercel-migrate-if-prod: migrate deploy failed; status:', status);

if (/\bP3005\b/i.test(out)) {
  if (process.env.PRISMA_BASELINE_ON_P3005 === '1') {
    console.log(
      'vercel-migrate-if-prod: PRISMA_BASELINE_ON_P3005=1 — marking migrations applied'
    );
    resolveAllApplied();
    ({ status, out } = migrateDeployWithLogs());
    if (status === 0) {
      console.log('vercel-migrate-if-prod: migrate deploy ok after baseline');
      process.exit(0);
    }
    console.error(out);
    migrateStatus();
    process.exit(status);
  }

  const shouldDbPushAndResolve =
    process.env.PRISMA_VERCEL_SYNC === '1' ||
    process.env.PRISMA_NO_AUTO_SYNC_P3005 !== '1';

  if (shouldDbPushAndResolve) {
    const label =
      process.env.PRISMA_VERCEL_SYNC === '1'
        ? 'PRISMA_VERCEL_SYNC=1'
        : 'P3005 auto-recovery (set PRISMA_NO_AUTO_SYNC_P3005=1 to skip)';
    console.log(`vercel-migrate-if-prod: ${label} — prisma db push, then baseline migrations`);
    const pushArgs = ['db', 'push', '--schema', schema, '--skip-generate'];
    if (process.env.PRISMA_DB_PUSH_ACCEPT_DATA_LOSS === '1') {
      pushArgs.push('--accept-data-loss');
    }
    const push = spawnPrisma(pushArgs, true);
    if (push.status !== 0) process.exit(push.status ?? 1);
    resolveAllApplied();
    ({ status, out } = migrateDeployWithLogs());
    if (status === 0) {
      console.log('vercel-migrate-if-prod: migrate deploy ok after sync');
      process.exit(0);
    }
    console.error(out);
    migrateStatus();
    process.exit(status);
  }

  printP3005Help();
  process.exit(1);
}

migrateStatus();

if (status !== 0 && process.env.PRISMA_FAIL_OPEN_MIGRATE === '1') {
  console.error(
    'vercel-migrate-if-prod: WARNING: PRISMA_FAIL_OPEN_MIGRATE=1 — continuing build without a successful migrate. Fix the database and redeploy; remove this flag after.'
  );
  process.exit(0);
}

process.exit(status);

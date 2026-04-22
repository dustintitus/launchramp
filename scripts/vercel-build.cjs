/**
 * Vercel build when Root Directory = apps/web:
 *   buildCommand: cd ../.. && node scripts/vercel-build.cjs
 * Repo root = parent of /scripts ; does not depend on where `node` is invoked from
 * after the `cd ../..` in buildCommand.
 */
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');
const schema = path.join(root, 'packages/db/prisma/schema.prisma');
const webDir = path.join(root, 'apps/web');

function run(cmd, args, opts = {}) {
  console.log(`\n$ ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: false,
    env: { ...process.env, ...opts.env },
    cwd: opts.cwd ?? root,
  });
  if (r.error) {
    console.error(r.error);
    process.exit(1);
  }
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log('=== vercel-build.cjs ===');
console.log('root=', root);
console.log('SKIP_PRISMA_MIGRATE=', process.env.SKIP_PRISMA_MIGRATE || '');
console.log('DATABASE_URL set=', process.env.DATABASE_URL ? 'yes' : 'no');
console.log(
  'POSTGRES_PRISMA_URL set=',
  process.env.POSTGRES_PRISMA_URL ? 'yes' : 'no'
);
console.log('POSTGRES_URL set=', process.env.POSTGRES_URL ? 'yes' : 'no');

if (!fs.existsSync(webDir)) {
  console.error('ERROR: apps/web not found at', webDir);
  process.exit(1);
}
if (!fs.existsSync(schema)) {
  console.error('ERROR: Prisma schema not found at', schema);
  process.exit(1);
}

let prismaCli;
try {
  prismaCli = require.resolve('prisma/build/index.js', { paths: [root] });
} catch {
  console.error(
    'ERROR: prisma CLI not found under',
    path.join(root, 'node_modules'),
    '— add "prisma" to root package.json dependencies (Vercel often omits devDependencies).'
  );
  process.exit(1);
}

if (process.env.SKIP_PRISMA_MIGRATE === '1') {
  console.log('SKIP_PRISMA_MIGRATE=1 — skipping prisma migrate deploy');
} else {
  const dbUrl =
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    process.env.POSTGRES_URL?.trim();
  if (!dbUrl) {
    console.error(
      'ERROR: Set DATABASE_URL, POSTGRES_PRISMA_URL, or POSTGRES_URL on Vercel (build + runtime).'
    );
    process.exit(1);
  }
  run(process.execPath, [prismaCli, 'migrate', 'deploy', '--schema', schema], {
    env: { ...process.env, DATABASE_URL: dbUrl },
  });
}

run('npm', ['run', 'build'], { cwd: webDir });

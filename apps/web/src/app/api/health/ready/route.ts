import { NextResponse } from 'next/server';
import { prisma } from '@launchramp/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public readiness probe (no secrets). Use after deploy to confirm the same DB
 * the app uses has NextAuth tables (e.g. Account).
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    return NextResponse.json(
      { ok: false, database: 'unreachable', hint: 'Check DATABASE_URL / POSTGRES_* on Vercel.' },
      { status: 503 }
    );
  }

  try {
    await prisma.account.findFirst({ take: 1 });
  } catch (e: unknown) {
    const code = e && typeof e === 'object' && 'code' in e ? (e as { code: string }).code : undefined;
    return NextResponse.json(
      {
        ok: false,
        database: 'connected',
        accountTable: false,
        prismaCode: code,
        hint:
          code === 'P2021'
            ? 'Run: npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma against this DATABASE_URL (build should run this if DATABASE_URL is set for migrate).'
            : 'See Vercel function logs for the full Prisma error.',
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    ok: true,
    database: 'connected',
    accountTable: true,
  });
}

import { PrismaClient } from '@prisma/client';

/**
 * Vercel Postgres often exposes `POSTGRES_PRISMA_URL` / `POSTGRES_URL`.
 * We override `datasourceUrl` at runtime so Prisma does not require `DATABASE_URL`
 * to be set separately (though setting `DATABASE_URL` is still recommended).
 */
function resolveDatabaseUrl(): string {
  const url =
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    process.env.POSTGRES_URL?.trim();
  if (!url) {
    throw new Error(
      'Database URL missing: in Vercel → Settings → Environment Variables, set DATABASE_URL to your Postgres connection string (or ensure POSTGRES_PRISMA_URL exists from Vercel Postgres).'
    );
  }
  return url;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: { url: resolveDatabaseUrl() },
    },
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
}

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

/**
 * Lazy proxy so importing this module does not require DATABASE_URL at build time.
 * The error surfaces on the first query if no URL is configured (clearer for Vercel).
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol, receiver) {
    const client = getClient();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
}) as PrismaClient;

export * from '@prisma/client';

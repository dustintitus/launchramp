import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

/** Prisma + OAuth token exchange require Node; avoid accidental Edge bundling. */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


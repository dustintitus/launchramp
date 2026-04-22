import type { NextAuthOptions } from 'next-auth';
import type { Adapter, AdapterAccount } from 'next-auth/adapters';
import GoogleProvider from 'next-auth/providers/google';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@launchramp/db';
import { isMicrosoftAuthConfigured } from '@/lib/oauth-provider-flags';

const googleProvider = GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
});

const providers = isMicrosoftAuthConfigured()
  ? [
      googleProvider,
      AzureADProvider({
        clientId: process.env.MICROSOFT_CLIENT_ID!,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
        tenantId: process.env.MICROSOFT_TENANT_ID!,
      }),
    ]
  : [googleProvider];

const DEFAULT_ORG_ID = process.env.DEFAULT_ORG_ID ?? 'org_launchramp_demo';

/** Comma-separated in BOOTSTRAP_ADMIN_EMAILS; defaults so first deploy has an admin without extra env. */
function getBootstrapAdminEmails(): Set<string> {
  const fallback = 'dustin.titus@gmail.com';
  const raw = process.env.BOOTSTRAP_ADMIN_EMAILS ?? fallback;
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

async function ensureDefaultOrganization() {
  await prisma.organization.upsert({
    where: { id: DEFAULT_ORG_ID },
    update: {},
    create: {
      id: DEFAULT_ORG_ID,
      name: 'Launch Ramp',
      slug: 'launchramp-demo',
    },
  });
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: (() => {
    const base = PrismaAdapter(prisma);
    return {
      ...base,
      /**
       * Default Prisma adapter uses `findUnique` on @@unique([provider, providerAccountId]).
       * If production DB predates that index or drifted from migrations, Prisma throws
       * "Invalid prisma.account.findUnique() invocation". `findFirst` uses the same filters
       * and only needs a btree index on (provider, providerAccountId) or a sequential scan.
       */
      async getUserByAccount(
        providerAccount: Pick<AdapterAccount, 'provider' | 'providerAccountId'>
      ) {
        const { provider, providerAccountId } = providerAccount;
        if (
          !provider ||
          providerAccountId === undefined ||
          providerAccountId === null ||
          String(providerAccountId) === ''
        ) {
          return null;
        }
        const row = await prisma.account.findFirst({
          where: {
            provider,
            providerAccountId: String(providerAccountId),
          },
          include: { user: true },
        });
        return (row?.user as any) ?? null;
      },
      async unlinkAccount(
        providerAccount: Pick<AdapterAccount, 'provider' | 'providerAccountId'>
      ) {
        const { provider, providerAccountId } = providerAccount;
        if (!provider || providerAccountId == null) return;
        await prisma.account.deleteMany({
          where: {
            provider,
            providerAccountId: String(providerAccountId),
          },
        });
      },
      async createUser(
        data: Parameters<NonNullable<Adapter['createUser']>>[0]
      ) {
        await ensureDefaultOrganization();
        const boot = getBootstrapAdminEmails();
        const isBootstrapAdmin =
          !!data.email && boot.has(data.email.toLowerCase());
        const created = await prisma.user.create({
          data: {
            email: data.email,
            name: data.name,
            image: data.image,
            emailVerified: data.emailVerified,
            organizationId: DEFAULT_ORG_ID,
            role: isBootstrapAdmin ? 'ADMIN' : 'USER',
          },
        });
        return created as any;
      },
    } satisfies Adapter;
  })(),
  /**
   * Database sessions do not work with `next-auth/middleware` on the Edge (no Prisma;
   * `getToken` expects a JWT). JWT keeps User/Account in Postgres via the adapter but
   * stores the session in an encrypted cookie so middleware and API routes agree.
   */
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: '/login' },
  providers,
  events: {
    async createUser({ user }) {
      const email = user.email?.toLowerCase();
      if (email && getBootstrapAdminEmails().has(email)) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'ADMIN' },
        });
      }
    },
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      try {
        if (url.startsWith('/')) return `${baseUrl}${url}`;
        const next = new URL(url);
        const base = new URL(baseUrl);
        if (next.origin === base.origin) return url;
      } catch {
        /* malformed callbackUrl cookie / param would throw in default handler → error=Callback */
      }
      return baseUrl;
    },
    async signIn({ user }) {
      if (!user.email) return false;
      const email = user.email.toLowerCase();
      if (getBootstrapAdminEmails().has(email)) {
        const existing = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (existing) {
          await prisma.user.update({
            where: { id: existing.id },
            data: { role: 'ADMIN' },
          });
        }
      }
      // NextAuth invokes signIn before the DB user exists for new OAuth users;
      // `user` is then the provider profile (id is the provider sub, not our User.id).
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
      });
      if (dbUser?.disabled) return false;
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email.toLowerCase();
        if (getBootstrapAdminEmails().has(token.email)) {
          const u = await prisma.user.update({
            where: { id: user.id },
            data: { role: 'ADMIN' },
            select: {
              id: true,
              role: true,
              organizationId: true,
              disabled: true,
            },
          });
          token.sub = u.id;
          token.role = u.role as typeof token.role;
          token.organizationId = u.organizationId;
          token.disabled = u.disabled;
          return token;
        }
      }
      if (user) {
        token.sub = user.id;
        if (user.email) token.email = user.email.toLowerCase();
        token.role = (user as { role?: string }).role as typeof token.role;
        token.organizationId = (user as { organizationId?: string })
          .organizationId;
        token.disabled = Boolean((user as { disabled?: boolean }).disabled);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = (token.role ?? 'USER') as typeof session.user.role;
        session.user.organizationId =
          token.organizationId ?? DEFAULT_ORG_ID;
        session.user.disabled = token.disabled ?? false;
      }
      return session;
    },
  },
};


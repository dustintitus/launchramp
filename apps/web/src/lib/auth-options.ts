import type { NextAuthOptions } from 'next-auth';
import type { Adapter } from 'next-auth/adapters';
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
      async createUser(
        data: Parameters<NonNullable<Adapter['createUser']>>[0]
      ) {
        await ensureDefaultOrganization();
        const created = await prisma.user.create({
          data: {
            email: data.email,
            name: data.name,
            image: data.image,
            emailVerified: data.emailVerified,
            organizationId: DEFAULT_ORG_ID,
          },
        });
        return created as any;
      },
    } satisfies Adapter;
  })(),
  session: { strategy: 'database' },
  pages: { signIn: '/login' },
  providers,
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
      // NextAuth invokes signIn before the DB user exists for new OAuth users;
      // `user` is then the provider profile (id is the provider sub, not our User.id).
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
      });
      if (dbUser?.disabled) return false;
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        (session.user as any).id = user.id;
        (session.user as any).role = (user as any).role;
        (session.user as any).organizationId = (user as any).organizationId;
        (session.user as any).disabled = (user as any).disabled;
      }
      return session;
    },
  },
};


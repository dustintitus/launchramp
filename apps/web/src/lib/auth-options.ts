import type { NextAuthOptions } from 'next-auth';
import type { Adapter } from 'next-auth/adapters';
import GoogleProvider from 'next-auth/providers/google';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@launchramp/db';

const DEFAULT_ORG_ID = process.env.DEFAULT_ORG_ID ?? 'org_launchramp_demo';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: (() => {
    const base = PrismaAdapter(prisma);
    return {
      ...base,
      async createUser(
        data: Parameters<NonNullable<Adapter['createUser']>>[0]
      ) {
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
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    AzureADProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: process.env.MICROSOFT_TENANT_ID!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
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


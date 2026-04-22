import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';

const PUBLIC_PREFIXES = [
  '/login',
  '/api/auth',
  '/api/health',
  '/api/webhooks/twilio/inbound',
];

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    pages: { signIn: '/login' },
    callbacks: {
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl;
        if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
        return Boolean(token);
      },
    },
  }
);

export const config = {
  matcher: [
    '/login',
    '/dashboard/:path*',
    '/inbox/:path*',
    '/contacts/:path*',
    '/templates/:path*',
    '/settings/:path*',
    '/api/:path*',
  ],
};


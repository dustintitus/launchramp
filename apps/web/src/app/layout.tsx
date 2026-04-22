import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthSessionProvider } from '@/components/auth/session-provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://launchramp.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Launch Ramp - AI Powered Customer Service',
    template: '%s | Launch Ramp',
  },
  description:
    'AI powered customer service — shared inbox and CRM for messaging-first teams.',
  openGraph: {
    title: 'Launch Ramp - AI Powered Customer Service',
    description:
      'AI powered customer service — shared inbox and CRM for messaging-first teams.',
    siteName: 'Launch Ramp',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/og-share-logo.jpg',
        width: 1024,
        height: 1023,
        alt: 'Launch Ramp',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Launch Ramp - AI Powered Customer Service',
    description:
      'AI powered customer service — shared inbox and CRM for messaging-first teams.',
    images: ['/og-share-logo.jpg'],
  },
  appleWebApp: {
    title: 'Launch Ramp',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} min-h-screen bg-dashboard-frame font-sans antialiased`}
      >
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}

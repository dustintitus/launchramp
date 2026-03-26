import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

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
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Launch Ramp - AI Powered Customer Service',
    description:
      'AI powered customer service — shared inbox and CRM for messaging-first teams.',
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
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { AppShell } from '@/components/dashboard/app-shell';

export const metadata: Metadata = {
  title: 'Dashboard | Launch Ramp',
};

export default function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}

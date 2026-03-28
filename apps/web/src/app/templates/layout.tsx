import { AppShell } from '@/components/dashboard/app-shell';

export default function TemplatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}

import { AppShell } from '@/components/dashboard/app-shell';
import { InboxSidebar } from '@/components/inbox/inbox-sidebar';

export default function InboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <div className="flex min-h-0 flex-1">
        <InboxSidebar />
        {children}
      </div>
    </AppShell>
  );
}

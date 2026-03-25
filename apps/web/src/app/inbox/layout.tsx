import { InboxSidebar } from '@/components/inbox/inbox-sidebar';

export default function InboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-neutral-50">
      <aside className="flex w-56 flex-shrink-0 flex-col border-r border-neutral-200 bg-white">
        <div className="flex h-14 items-center border-b border-neutral-200 px-4">
          <a href="/" className="font-semibold text-neutral-900">
            LaunchRamp
          </a>
        </div>
        <InboxSidebar />
      </aside>
      {children}
    </div>
  );
}

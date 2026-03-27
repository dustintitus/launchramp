import { AppSidebar } from '@/components/layout/app-sidebar';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-app-canvas">
      <AppSidebar />
      {children}
    </div>
  );
}

import type { Metadata } from 'next';
import { AppSidebar } from '@/components/layout/app-sidebar';

export const metadata: Metadata = {
  title: 'Contacts | Launch Ramp',
};

export default function ContactsLayout({
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

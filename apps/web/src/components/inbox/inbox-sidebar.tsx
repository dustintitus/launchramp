'use client';

import { SidebarNav } from './sidebar-nav';
import { useConversations } from '@/features/inbox/use-conversations';
import { mockStats } from '@/lib/mock-data';

export function InboxSidebar() {
  const { unreadCount, error } = useConversations();
  // Use mock stats when API isn't available
  const displayUnread = error ? mockStats.unread : (unreadCount ?? mockStats.unread);
  return <SidebarNav unreadCount={displayUnread} stats={mockStats} />;
}

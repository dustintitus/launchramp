'use client';

import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime, formatPhone, cn } from '@/lib/utils';
import type { Conversation } from '@/types';

export interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  unreadCount?: number;
}

const stageVariant: Record<string, 'lead' | 'qualified' | 'customer' | 'churned'> = {
  lead: 'lead',
  qualified: 'qualified',
  customer: 'customer',
  churned: 'churned',
};

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  search = '',
  onSearchChange,
}: ConversationListProps) {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="shrink-0 border-b border-neutral-200/80 p-3">
        <Input
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="h-9 bg-neutral-50/80 text-sm placeholder:text-neutral-400 focus-visible:ring-1"
        />
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col">
          {conversations.map((conv) => {
            const messages = conv.messages ?? [];
            const newest =
              messages.length === 0
                ? undefined
                : [...messages].sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                  )[0];
            const preview = newest?.body ?? 'No messages yet';
            const displayName = conv.contact.name ?? formatPhone(conv.contact.phone);

            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => onSelect(conv.id)}
                className={cn(
                  'group flex flex-col gap-1.5 border-b border-neutral-100/80 px-4 py-3.5 text-left transition-colors hover:bg-neutral-50/80 focus:outline-none focus:bg-neutral-50/80',
                  selectedId === conv.id && 'bg-neutral-50 border-l-2 border-l-neutral-900'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar className="h-9 w-9 shrink-0 ring-1 ring-neutral-100">
                      <AvatarFallback className="bg-neutral-100 text-xs font-medium text-neutral-600">
                        {displayName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'truncate font-medium',
                            conv.isUnread ? 'text-neutral-900' : 'text-neutral-700'
                          )}
                        >
                          {displayName}
                        </span>
                        {conv.isUnread && (
                          <span
                            className="h-2 w-2 shrink-0 rounded-full bg-blue-500"
                            aria-label="Unread"
                          />
                        )}
                      </div>
                      <p className="truncate text-[13px] text-neutral-500">
                        {preview}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-[11px] text-neutral-400 tabular-nums">
                      {formatRelativeTime(conv.lastMessageAt)}
                    </span>
                    <Badge
                      variant={stageVariant[conv.contact.stage] ?? 'secondary'}
                      className="h-5 px-1.5 text-[10px] font-medium"
                    >
                      {conv.contact.stage}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 pl-12">
                  <span className="text-[10px] uppercase tracking-wider text-neutral-400">
                    {conv.channelType}
                  </span>
                  {conv.assignedTo && (
                    <span className="text-[10px] text-neutral-500">
                      → {conv.assignedTo.name}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
          {conversations.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center py-16 px-6 text-center">
              <p className="text-sm font-medium text-neutral-500">
                No conversations
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                New messages will appear here
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

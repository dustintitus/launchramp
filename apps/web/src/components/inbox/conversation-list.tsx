'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime, formatPhone } from '@/lib/utils';
import type { Conversation } from '@/features/inbox/types';
import { cn } from '@/lib/utils';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  search?: string;
  onSearchChange?: (value: string) => void;
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
    <div className="flex h-full flex-col border-r border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 p-3">
        <Input
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="rounded-xl bg-neutral-50"
        />
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {conversations.map((conv) => {
            const lastMsg = conv.messages?.[0];
            const preview = lastMsg?.body ?? 'No messages yet';
            const displayName = conv.contact.name ?? formatPhone(conv.contact.phone);

            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => onSelect(conv.id)}
                className={cn(
                  'flex flex-col gap-1 border-b border-neutral-100 px-4 py-3 text-left transition-colors hover:bg-neutral-50',
                  selectedId === conv.id && 'bg-neutral-50'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="text-sm">
                        {displayName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-neutral-900">
                          {displayName}
                        </span>
                        {conv.isUnread && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <p className="truncate text-sm text-neutral-500">
                        {preview}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-xs text-neutral-400">
                      {formatRelativeTime(conv.lastMessageAt)}
                    </span>
                    <Badge
                      variant={stageVariant[conv.contact.stage] ?? 'secondary'}
                      className="text-[10px]"
                    >
                      {conv.contact.stage}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 pl-13">
                  <span className="text-[10px] uppercase text-neutral-400">
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
            <div className="flex flex-1 items-center justify-center py-12 text-center text-sm text-neutral-500">
              No conversations yet
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

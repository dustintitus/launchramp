'use client';

import { useRef, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageComposer } from './MessageComposer';
import { formatRelativeTime, formatPhone, cn } from '@/lib/utils';
import type { Conversation, Message } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export interface MessageThreadProps {
  conversation: Conversation | null;
  isLoading?: boolean;
  onSendMessage: (text: string) => void;
  isSending?: boolean;
}

function outboundStatusLabel(status: Message['status']): string {
  const labels: Record<string, string> = {
    queued: 'Sending…',
    sent: 'Sent',
    delivered: 'Delivered',
    failed: 'Failed',
  };
  return labels[status] ?? status;
}

function MessageBubble({ message }: { message: Message }) {
  const isOutbound = message.direction === 'outbound';

  return (
    <div
      className={cn(
        'flex w-full',
        isOutbound ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm',
          isOutbound
            ? 'bg-neutral-900 text-white'
            : 'bg-neutral-100 text-neutral-900'
        )}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p>
        <p
          className={cn(
            'mt-1.5 text-[11px]',
            isOutbound ? 'text-neutral-400' : 'text-neutral-500'
          )}
        >
          {formatRelativeTime(message.createdAt)}
          {message.status && message.status !== 'delivered' && (
            <span>
              {' '}
              · {isOutbound ? outboundStatusLabel(message.status) : message.status}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

export function MessageThread({
  conversation,
  isLoading,
  onSendMessage,
  isSending,
}: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const messages = conversation?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (isLoading || !conversation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-app-canvas/50 px-6">
        <div className="w-full max-w-sm text-center">
          <Skeleton className="mx-auto mb-4 h-12 w-12 rounded-full" />
          <Skeleton className="mx-auto mb-2 h-4 w-32" />
          <Skeleton className="mx-auto h-3 w-24" />
          <p className="mt-6 text-sm text-neutral-500">
            {isLoading ? 'Loading conversation...' : 'Select a conversation'}
          </p>
        </div>
      </div>
    );
  }

  const displayName =
    conversation.contact.name ?? formatPhone(conversation.contact.phone);

  return (
    <div className="flex flex-1 flex-col bg-white">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-neutral-200/80 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-10 w-10 shrink-0 ring-1 ring-neutral-100">
            <AvatarFallback className="bg-neutral-100 text-sm font-medium text-neutral-600">
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2 className="truncate font-semibold text-neutral-900">
              {displayName}
            </h2>
            <p className="truncate text-xs text-neutral-500">
              {conversation.contact.phone}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-xs text-neutral-400">
          {conversation.assignedTo ? (
            <>Assigned to {conversation.assignedTo.name}</>
          ) : (
            'Unassigned'
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-neutral-200/80 bg-white p-4">
        <MessageComposer
          onSend={onSendMessage}
          disabled={isSending}
          placeholder="Type a message..."
        />
      </div>
    </div>
  );
}
